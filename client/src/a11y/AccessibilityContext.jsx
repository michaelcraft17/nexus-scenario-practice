import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { getReflectionHistory, clearReflectionHistory } from "../services/reflectionHistory.js";
import { useTooltips } from "./useTooltips.js";

const PREFS_KEY = "a11y_prefs";
const FAVS_KEY = "a11y_favs";

const DEFAULT_PREFS = {
  colorScheme: "calm-earthy", // "calm-earthy" | "blue-yellow"
  theme: "device", // "device" | "light" | "dark"
  textSize: "default", // "small" | "default" | "large" | "largest" | "huge" | "giant"
  typeface: "default", // "default" | "dyslexia" | "legible"
  contrast: "default", // "default" | "high" | "invert" | "dark" | "light"
  motion: "device", // "device" | "reduce"
  // The tile-menu features below (see tiles.jsx for each one's steps).
  links: "default", // "default" | "on"
  spacing: "default", // "default" | "1" | "2" | "3"
  lineHeight: "default", // "default" | "1" | "2" | "3"
  textAlign: "default", // "default" | "left" | "right" | "center" | "justify"
  saturation: "default", // "default" | "low" | "high" | "mono"
  cursor: "default", // "default" | "black" | "mask" | "guide"
  hideImages: "default", // "default" | "on"
  tooltips: "default", // "default" | "on"
  oversized: false, // bigger menu
};

// CSS `zoom` scales everything uniformly (layout included, not just font
// size) -- the right tool here since the app uses hardcoded px throughout
// rather than a relative type scale. Every value shifted up a tier from the
// original small/default/large/largest = 0.9/1/1.15/1.3 -- per direct
// feedback that the baseline text felt too small everywhere, not just for
// users who'd go looking for the "Large" option -- while keeping the same
// relative spacing between tiers, so "Small" is still the smallest option
// and "Largest" is still the largest, just all raised together. "Huge" and
// "Giant" extend the range for the Bigger Text tile; "small" is no longer
// offered in the menu but is still honored if it was stored earlier.
const TEXT_ZOOM = { small: 1, default: 1.15, large: 1.3, largest: 1.45, huge: 1.6, giant: 1.75 };

// Saturation is a page-wide filter on <html> (a filter on <body> would break
// position:fixed), combined with the Invert contrast step's filter.
const INVERT_FILTER = "invert(1) hue-rotate(180deg)";
const SATURATION_FILTERS = { low: "saturate(.5)", high: "saturate(2)", mono: "grayscale(1)" };

export const COLOR_SCHEME_OPTIONS = [
  { value: "calm-earthy", label: "Calm & earthy" },
  { value: "blue-yellow", label: "Blue & yellow" },
];
export const THEME_OPTIONS = [
  { value: "device", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
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

const MAX_CHUNK_CHARS = 200;

/** Screens register either a string or an array of items (one per scenario
 * card / chat message -- preferred, since it keeps natural pauses between
 * items). Anything longer than one breath is further split on sentence
 * boundaries so no single utterance runs long enough to be cut off. */
function toSpeechChunks(content) {
  const items = Array.isArray(content) ? content : [content];
  const chunks = [];
  for (const item of items) {
    const text = String(item ?? "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length <= MAX_CHUNK_CHARS) {
      chunks.push(text);
      continue;
    }
    let current = "";
    for (const sentence of text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text]) {
      if (current && (current + sentence).length > MAX_CHUNK_CHARS) {
        chunks.push(current.trim());
        current = "";
      }
      current += sentence;
    }
    if (current.trim()) chunks.push(current.trim());
  }
  return chunks;
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
 * contrast, motion, plus the tile-menu features -- see DEFAULT_PREFS and
 * tiles.jsx), persisted to localStorage under a11y_prefs, plus
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
  // Whether any screen currently has content registered -- state (not just
  // the ref above) so the panel can grey out Play instead of silently
  // doing nothing.
  const [canReadAloud, setCanReadAloud] = useState(false);

  // Read-aloud speaks one chunk at a time and chains them, rather than
  // handing the browser one giant utterance: Chrome silently cuts long
  // utterances off after ~15s, which a whole conversation easily exceeds.
  // The chain is driven from refs, not state, because each utterance's
  // onend callback is bound once and would otherwise read stale rate/voice
  // values. speechTokenRef invalidates callbacks from a superseded or
  // stopped read (cancel() fires onend/onerror on the old utterance in some
  // browsers, which would otherwise start the next chunk after a Stop).
  const speechTokenRef = useRef(0);
  const speechQueueRef = useRef([]);
  const speechRateRef = useRef(1);
  const voicesRef = useRef([]);
  const voiceURIRef = useRef("");

  useEffect(() => {
    speechRateRef.current = speechRate;
    voicesRef.current = voices;
    voiceURIRef.current = voiceURI;
  }, [speechRate, voices, voiceURI]);

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
    // The dark/light contrast steps are themselves a dark or a light look,
    // so they pin data-theme (letting every existing [data-theme="dark"]
    // rule apply as the base, then a11y.css overrides the palette) rather
    // than following the theme preference.
    const effectiveTheme = prefs.contrast === "dark" || prefs.contrast === "light" ? prefs.contrast : resolvedTheme;
    root.setAttribute("data-color-scheme", prefs.colorScheme);
    root.setAttribute("data-theme", effectiveTheme);
    root.setAttribute("data-contrast", prefs.contrast);
    root.setAttribute("data-typeface", prefs.typeface);
    root.setAttribute("data-motion", resolvedMotion);
    // Tile-menu features -- a11y.css keys off these.
    root.setAttribute("data-links", prefs.links);
    root.setAttribute("data-spacing", prefs.spacing);
    root.setAttribute("data-line-height", prefs.lineHeight);
    root.setAttribute("data-text-align", prefs.textAlign);
    root.setAttribute("data-cursor", prefs.cursor);
    root.setAttribute("data-hide-images", prefs.hideImages);
    const filters = [];
    if (prefs.contrast === "invert") filters.push(INVERT_FILTER);
    if (SATURATION_FILTERS[prefs.saturation]) filters.push(SATURATION_FILTERS[prefs.saturation]);
    root.style.filter = filters.join(" ");
    const zoomValue = TEXT_ZOOM[prefs.textSize] ?? 1;
    root.style.zoom = String(zoomValue);
    // `zoom` scales the *rendered* size of everything, but viewport units
    // (vh/dvh) don't know about zoom and still resolve against the real
    // viewport -- so `height: 100dvh` becomes `900px` pre-zoom, then renders
    // at 900*zoom px, overflowing the actual viewport by exactly the zoom
    // factor whenever it's not 1. --zoom-factor lets any such element
    // compensate (`calc(100dvh / var(--zoom-factor))`) so it still renders
    // at the true viewport size. See .chat-screen in index.css, the one
    // place in this app that currently needs this.
    root.style.setProperty("--zoom-factor", String(zoomValue));
  }, [prefs, resolvedTheme, resolvedMotion]);

  useTooltips(prefs.tooltips === "on");

  // Ctrl+U toggles the menu (the same shortcut the UserWay menu uses). Note
  // this shadows View Source in Chrome/Firefox on Windows and Linux; on a
  // Mac, View Source is Cmd+Option+U so it does not collide.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && !e.metaKey && !e.altKey && e.key?.toLowerCase() === "u") {
        e.preventDefault();
        setPanelOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  // Stable identities: the panel's Escape/focus effect depends on
  // closePanel, and a fresh function each render would re-run it (and steal
  // focus back to the close button) on every unrelated context update.
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => setPanelOpen((open) => !open), []);

  const resetAllPrefs = useCallback(() => setPrefsState({ ...DEFAULT_PREFS }), []);

  const isFavorite = useCallback((scenarioId) => favorites.includes(scenarioId), [favorites]);

  const toggleFavorite = useCallback((scenarioId) => {
    setFavoritesState((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId]
    );
  }, []);

  /** Screens call this (in a useEffect, re-registering when their content
   * changes) to make their content the one "Read aloud" reads. */
  const registerReadableContent = useCallback((getContent) => {
    readableContentRef.current = getContent;
    setCanReadAloud(true);
    return () => {
      if (readableContentRef.current === getContent) {
        readableContentRef.current = null;
        setCanReadAloud(false);
      }
    };
  }, []);

  const stopSpeech = useCallback(() => {
    speechTokenRef.current += 1;
    window.speechSynthesis?.cancel();
    setSpeechState("idle");
  }, []);

  const speakFrom = useCallback((index, token) => {
    if (token !== speechTokenRef.current) return;
    const queue = speechQueueRef.current;
    if (index >= queue.length) {
      setSpeechState("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(queue[index]);
    utterance.rate = speechRateRef.current;
    const voice = voicesRef.current.find((v) => v.voiceURI === voiceURIRef.current);
    if (voice) utterance.voice = voice;
    utterance.onend = () => speakFrom(index + 1, token);
    utterance.onerror = () => {
      if (token === speechTokenRef.current) setSpeechState("idle");
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const playSpeech = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
      return;
    }
    const queue = toSpeechChunks(readableContentRef.current?.());
    if (queue.length === 0) return;
    const token = ++speechTokenRef.current;
    window.speechSynthesis.cancel();
    speechQueueRef.current = queue;
    setSpeechState("speaking");
    speakFrom(0, token);
  }, [speechState, speakFrom]);

  const pauseSpeech = useCallback(() => {
    if (speechState !== "speaking") return;
    window.speechSynthesis?.pause();
    setSpeechState("paused");
  }, [speechState]);

  const exportData = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ prefs, favorites, reflectionHistory: getReflectionHistory() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-accessibility-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [prefs, favorites]);

  // Everything this app persists about a user, client-side -- prefs and
  // favorites (this context's own storage) plus Past Reflections (see
  // services/reflectionHistory.js, a separate localStorage key added after
  // this "delete everything" button already existed, which is why it was
  // missed here originally).
  const deleteAllData = useCallback(() => {
    stopSpeech();
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(FAVS_KEY);
    clearReflectionHistory();
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
    openPanel,
    closePanel,
    togglePanel,
    resetAllPrefs,
    registerReadableContent,
    canReadAloud,
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
