import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const PREFS_KEY = "a11y_prefs";
const FAVS_KEY = "a11y_favs";

const DEFAULT_PREFS = {
  colorScheme: "calm-earthy", // "calm-earthy" | "blue-yellow"
  theme: "device", // "device" | "light" | "dark"
  textSize: "default", // "small" | "default" | "large" | "largest"
  typeface: "default", // "default" | "dyslexia"
  contrast: "default", // "default" | "high"
  motion: "device", // "device" | "reduce"
};

// CSS `zoom` scales everything uniformly (layout included, not just font
// size) -- the right tool here since the app uses hardcoded px throughout
// rather than a relative type scale. Every value shifted up a tier from the
// original small/default/large/largest = 0.9/1/1.15/1.3 -- per direct
// feedback that the baseline text felt too small everywhere, not just for
// users who'd go looking for the "Large" option -- while keeping the same
// relative spacing between tiers, so "Small" is still the smallest option
// and "Largest" is still the largest, just all raised together.
const TEXT_ZOOM = { small: 1, default: 1.15, large: 1.3, largest: 1.45 };

export const COLOR_SCHEME_OPTIONS = [
  { value: "calm-earthy", label: "Calm & earthy" },
  { value: "blue-yellow", label: "Blue & yellow" },
];
export const THEME_OPTIONS = [
  { value: "device", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
export const TEXT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "largest", label: "Largest" },
];
export const TYPEFACE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "dyslexia", label: "Dyslexia-friendly" },
];
export const CONTRAST_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "high", label: "Higher contrast" },
];
export const MOTION_OPTIONS = [
  { value: "device", label: "Match device" },
  { value: "reduce", label: "Reduce motion" },
];
export const SPEECH_RATE_OPTIONS = [
  { value: 0.75, label: "Slow" },
  { value: 1, label: "Normal" },
  { value: 1.25, label: "Fast" },
  { value: 1.5, label: "Fastest" },
];

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveTheme(theme) {
  if (theme !== "device") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMotion(motion) {
  if (motion === "reduce") return "reduce";
  if (motion === "device" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "reduce";
  }
  return "no-preference";
}

const AccessibilityContext = createContext(null);

/**
 * One consolidated prefs object (colorScheme, theme, textSize, typeface,
 * contrast, motion), persisted to localStorage under a11y_prefs, plus
 * favorites persisted separately under a11y_favs. Applies the resolved
 * state to `<html>` as data-* attributes (and `zoom` for text size) so
 * index.css can style off them directly -- this component owns state and
 * side effects, not visual styling.
 */
export function AccessibilityProvider({ children }) {
  const [prefs, setPrefsState] = useState(loadPrefs);
  const [favorites, setFavoritesState] = useState(loadFavorites);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(loadPrefs().theme));
  const [resolvedMotion, setResolvedMotion] = useState(() => resolveMotion(loadPrefs().motion));
  const [panelOpen, setPanelOpen] = useState(false);

  const [speechState, setSpeechState] = useState("idle"); // idle | speaking | paused
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");

  // The "currently visible resource list" is whichever screen registers
  // itself here -- avoids lifting chat/picker state up to this provider
  // just so read-aloud can see it.
  const readableContentRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    localStorage.setItem(FAVS_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setResolvedTheme(resolveTheme(prefs.theme));
    if (prefs.theme !== "device" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(resolveTheme("device"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs.theme]);

  useEffect(() => {
    setResolvedMotion(resolveMotion(prefs.motion));
    if (prefs.motion !== "device" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setResolvedMotion(resolveMotion("device"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs.motion]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-color-scheme", prefs.colorScheme);
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-contrast", prefs.contrast);
    root.setAttribute("data-typeface", prefs.typeface);
    root.setAttribute("data-motion", resolvedMotion);
    root.style.zoom = String(TEXT_ZOOM[prefs.textSize] ?? 1);
  }, [prefs.colorScheme, prefs.contrast, prefs.typeface, prefs.textSize, resolvedTheme, resolvedMotion]);

  // Voice list loads asynchronously in most browsers.
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const setPref = useCallback((key, value) => {
    setPrefsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isFavorite = useCallback((scenarioId) => favorites.includes(scenarioId), [favorites]);

  const toggleFavorite = useCallback((scenarioId) => {
    setFavoritesState((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId]
    );
  }, []);

  /** Screens call this (in a useEffect, re-registering when their content
   * changes) to make their content the one "Read aloud" reads. */
  const registerReadableContent = useCallback((getText) => {
    readableContentRef.current = getText;
    return () => {
      if (readableContentRef.current === getText) readableContentRef.current = null;
    };
  }, []);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeechState("idle");
  }, []);

  const playSpeech = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
      return;
    }
    const text = readableContentRef.current?.() ?? "";
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");
    window.speechSynthesis.speak(utterance);
    setSpeechState("speaking");
  }, [speechState, speechRate, voices, voiceURI]);

  const pauseSpeech = useCallback(() => {
    if (speechState !== "speaking") return;
    window.speechSynthesis?.pause();
    setSpeechState("paused");
  }, [speechState]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ prefs, favorites }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-accessibility-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [prefs, favorites]);

  const deleteAllData = useCallback(() => {
    stopSpeech();
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(FAVS_KEY);
    setPrefsState({ ...DEFAULT_PREFS });
    setFavoritesState([]);
  }, [stopSpeech]);

  const value = {
    prefs,
    setPref,
    resolvedTheme,
    resolvedMotion,
    favorites,
    isFavorite,
    toggleFavorite,
    panelOpen,
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
    registerReadableContent,
    speechState,
    speechRate,
    setSpeechRate,
    voices,
    voiceURI,
    setVoiceURI,
    playSpeech,
    pauseSpeech,
    stopSpeech,
    exportData,
    deleteAllData,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within an AccessibilityProvider");
  return ctx;
}
