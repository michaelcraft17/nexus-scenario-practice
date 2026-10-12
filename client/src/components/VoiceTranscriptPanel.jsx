import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { AccessibilityIcon } from "./icons.jsx";
import "./VoiceTranscript.css";

// How close to the bottom (px) still counts as "following along" -- new
// lines only auto-scroll the log while the user hasn't scrolled up to reread.
const STICK_THRESHOLD = 48;

// The transcript's own reading settings, on top of the app-wide text size:
// a plain font for the Narrator's calligraphy lines, and a size step.
const STYLE_KEY = "nexus-voice-transcript-style";
const SIZE_STEPS = [0.9, 1, 1.15, 1.3, 1.5];
const DEFAULT_SIZE = 1;

function readStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(STYLE_KEY) || "{}");
    const size = Number.isInteger(saved.size) && SIZE_STEPS[saved.size] ? saved.size : DEFAULT_SIZE;
    return { plain: saved.plain === true, size };
  } catch {
    return { plain: false, size: DEFAULT_SIZE };
  }
}

// Smooth reveal: the Realtime API often sends a line's words in bursts (a
// whole sentence in one event), so the panel types them out instead of
// dropping them in. The speed scales with how far behind it is -- a big
// burst catches up within about a third of a second, easing off as it
// closes in, and never slower than MIN_REVEAL_CPS.
const MIN_REVEAL_CPS = 40;
const CATCH_UP_PER_SEC = 3;

/**
 * One transcript line's text, revealed smoothly up to `text` as it grows.
 * `instant` (Reduce motion) shows every update at once; `startFull` (a line
 * already there when the panel opened) starts with what's been said so far
 * and types only what comes after. Screen readers get the full text in one piece --
 * the typed-out copy is aria-hidden so it isn't announced letter by letter.
 */
function SmoothText({ text, instant, startFull, onGrow }) {
  const [shown, setShown] = useState(instant || startFull ? text.length : 0);
  const shownRef = useRef(shown);
  const onGrowRef = useRef(onGrow);
  onGrowRef.current = onGrow;

  useEffect(() => {
    // Text can be replaced, not only extended (a transcription's final
    // version) -- keep what still matches and type from there.
    if (shownRef.current > text.length) shownRef.current = text.length;
    if (instant || shownRef.current >= text.length) {
      shownRef.current = text.length;
      setShown(text.length);
      return undefined;
    }
    // A ~60fps timer rather than requestAnimationFrame, which stalls while
    // the tab or pane is hidden (the same reason syncTranscriptView batches
    // on a timer); a hidden tab just catches up in bigger steps.
    let timer = 0;
    let last = performance.now();
    let carry = 0;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const behind = text.length - shownRef.current;
      carry += Math.max(MIN_REVEAL_CPS, behind * CATCH_UP_PER_SEC) * dt;
      const step = Math.floor(carry);
      if (step > 0) {
        carry -= step;
        shownRef.current = Math.min(text.length, shownRef.current + step);
        setShown(shownRef.current);
      }
      if (shownRef.current < text.length) timer = setTimeout(tick, 16);
    };
    timer = setTimeout(tick, 16);
    return () => clearTimeout(timer);
  }, [text, instant]);

  // Keep the log pinned to the bottom as the typed text wraps onto new rows.
  useLayoutEffect(() => {
    onGrowRef.current?.();
  }, [shown]);

  return (
    <>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      <span className="visually-hidden">{text}</span>
    </>
  );
}

/**
 * The live call's words, as they're spoken -- opened from the Transcript
 * pill next to Reduce motion (see VoiceCallScreen). A right-hand side panel
 * on wide screens, a sheet above the call controls on narrow ones (see
 * VoiceTranscript.css).
 *
 * Purely a record of what was said: no highlighting, no "good line"
 * markers, nothing evaluative -- same rule as everywhere else in the app.
 *
 * @param {{id: string, role: "assistant"|"user"|"narrator", text: string, pending: boolean}[]} lines
 *   Built by VoiceCallScreen's syncTranscriptView. `pending` = still being
 *   spoken/transcribed; those are hidden from screen readers until they
 *   land, so the log isn't announced one partial word at a time.
 * @param {boolean} [motionLocked] - The device asks for reduced motion, so
 *   the header's Reduce motion button can't turn it back on.
 * @param {() => void} onToggleMotion - Same setting as the call screen's
 *   Reduce motion pill, which hides while this panel is open.
 * @param {boolean} [closing] - Plays the slide-out before VoiceCallScreen
 *   unmounts the panel.
 */
export default function VoiceTranscriptPanel({
  id,
  lines,
  npcName,
  npcRole,
  reduceMotion,
  motionLocked = false,
  onToggleMotion,
  closing = false,
  onClose,
}) {
  const { prefs, setPref, panelOpen, togglePanel } = useAccessibility();
  const [style, setStyle] = useState(readStyle);
  // The Access menu's "Easier Narrator Font" already makes every Narrator
  // line plain, so the transcript reads as plain too while that's on.
  const plain = style.plain || prefs.easierNarratorFont;
  const logRef = useRef(null);
  const stickRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  // Lines already spoken before the panel opened appear in full -- only
  // words arriving while it's open are typed out.
  const initialIdsRef = useRef(null);
  if (initialIdsRef.current === null) initialIdsRef.current = new Set(lines.map((l) => l.id));

  // Follow new words while the user is at the bottom; leave them alone if
  // they've scrolled up to reread something. Instant rather than smooth --
  // this fires many times a second while a line streams in.
  function followIfStuck() {
    const log = logRef.current;
    if (log && stickRef.current) {
      log.scrollTop = log.scrollHeight;
      lastScrollTopRef.current = log.scrollTop;
    }
  }

  useLayoutEffect(followIfStuck, [lines]);

  // Only scrolling *up* stops the follow -- a smooth "Jump to latest" fires
  // scroll events on its way down that would otherwise read as "not at the
  // bottom" and unstick it mid-animation.
  function handleScroll() {
    const log = logRef.current;
    if (!log) return;
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight <= STICK_THRESHOLD;
    const movedUp = log.scrollTop < lastScrollTopRef.current - 1;
    lastScrollTopRef.current = log.scrollTop;
    if (atBottom) {
      stickRef.current = true;
      setShowJump(false);
    } else if (movedUp) {
      stickRef.current = false;
      setShowJump(true);
    }
  }

  function jumpToLatest() {
    const log = logRef.current;
    if (!log) return;
    stickRef.current = true;
    setShowJump(false);
    log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function updateStyle(patch) {
    setStyle((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STYLE_KEY, JSON.stringify(next));
      } catch {
        // Storage blocked -- still applies for this visit.
      }
      return next;
    });
  }

  function toggleFont() {
    if (plain) {
      updateStyle({ plain: false });
      if (prefs.easierNarratorFont) setPref("easierNarratorFont", false);
    } else {
      updateStyle({ plain: true });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  }

  return (
    <aside
      id={id}
      className={`voice-transcript${plain ? " voice-transcript--plain" : ""}${closing ? " voice-transcript--closing" : ""}`}
      style={{ "--transcript-scale": SIZE_STEPS[style.size] }}
      aria-label="Live transcript"
      onKeyDown={handleKeyDown}
    >
      <div className="voice-transcript__header">
        <p className="voice-transcript__title">Transcript</p>
        {/* The call screen's Accessibility and Reduce motion pills, as icons,
            while the panel is open (the corner hides them to save room). */}
        <button
          type="button"
          className="voice-transcript__icon-btn"
          onClick={togglePanel}
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
          aria-label="Accessibility"
          title="Accessibility (Ctrl+U)"
        >
          <AccessibilityIcon size={18} />
        </button>
        <button
          type="button"
          className="voice-transcript__icon-btn"
          onClick={onToggleMotion}
          aria-pressed={reduceMotion}
          disabled={motionLocked}
          aria-label="Reduce motion"
          title={
            motionLocked
              ? "Your device is set to reduce motion"
              : reduceMotion
                ? "Turn motion back on"
                : "Calm the animations"
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="7" />
            <path d="M9.5 10v4M14.5 10v4" />
          </svg>
        </button>
        <button
          type="button"
          className="voice-transcript__close"
          onClick={onClose}
          aria-label="Hide transcript"
          title="Hide transcript"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="voice-transcript__tools" role="group" aria-label="Transcript display">
        <button
          type="button"
          className="narrator-font-toggle voice-transcript__font"
          aria-pressed={plain}
          title={
            plain ? "Switch the Narrator back to the calligraphy font" : "Show the Narrator in an easier-to-read font"
          }
          onClick={toggleFont}
        >
          <span className="narrator-font-toggle__glyph" aria-hidden="true">
            Aa
          </span>
          {plain ? "Calligraphy font" : "Easier font"}
        </button>
        <div className="voice-transcript__size">
          <span className="voice-transcript__size-label" aria-hidden="true">
            Size
          </span>
          <button
            type="button"
            className="voice-transcript__size-btn"
            onClick={() => updateStyle({ size: style.size - 1 })}
            disabled={style.size === 0}
            aria-label="Smaller transcript text"
            title="Smaller text"
          >
            A<span aria-hidden="true">&minus;</span>
          </button>
          <button
            type="button"
            className="voice-transcript__size-btn voice-transcript__size-btn--up"
            onClick={() => updateStyle({ size: style.size + 1 })}
            disabled={style.size === SIZE_STEPS.length - 1}
            aria-label="Larger transcript text"
            title="Larger text"
          >
            A<span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <div
        className="voice-transcript__log"
        ref={logRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        tabIndex={0}
      >
        {lines.length === 0 ? (
          <p className="voice-transcript__empty">Words will appear here as you talk.</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={`voice-transcript__line voice-transcript__line--${line.role}${line.pending ? " voice-transcript__line--pending" : ""}`}
              aria-hidden={line.pending || undefined}
            >
              {line.role === "assistant" ? (
                <div className="voice-transcript__speaker voice-transcript__speaker--npc">
                  <span className="voice-transcript__avatar" aria-hidden="true">
                    {npcName.charAt(0)}
                  </span>
                  <span>{npcName}</span>
                  {npcRole && <span className="voice-transcript__role">{npcRole}</span>}
                </div>
              ) : (
                <div className="voice-transcript__speaker">{line.role === "user" ? "You" : "Narrator"}</div>
              )}
              <p className="voice-transcript__text">
                {line.text ? (
                  <SmoothText
                    text={line.text}
                    instant={reduceMotion}
                    startFull={initialIdsRef.current.has(line.id)}
                    onGrow={followIfStuck}
                  />
                ) : (
                  <span className="voice-transcript__dots" aria-label="Transcribing">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </p>
            </div>
          ))
        )}
      </div>

      {showJump && (
        <button type="button" className="voice-transcript__jump" onClick={jumpToLatest}>
          Jump to latest
        </button>
      )}
    </aside>
  );
}
