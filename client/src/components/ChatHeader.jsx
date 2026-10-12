import { useEffect, useState } from "react";
import AccessibilityButton from "./AccessibilityButton.jsx";
import { ArrowLeftIcon, HelpIcon, HintIcon, MicIcon } from "./icons.jsx";

/**
 * Full screen for the practice: the browser's own fullscreen mode, which
 * hides its tab strip and address bar so only the conversation is on
 * screen. Esc (or this button again) leaves it. Not rendered where the
 * browser can't do it (e.g. iPhone Safari).
 */
function FullscreenButton() {
  const supported = typeof document !== "undefined" && document.fullscreenEnabled;
  const [isFull, setIsFull] = useState(() => supported && Boolean(document.fullscreenElement));

  useEffect(() => {
    if (!supported) return undefined;
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [supported]);

  if (!supported) return null;

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  const label = isFull ? "Exit full screen" : "Full screen";
  return (
    <button
      type="button"
      className="chat-header__fullscreen"
      onClick={toggle}
      aria-pressed={isFull}
      aria-label={label}
      title={isFull ? "Exit full screen (Esc)" : "Full screen"}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isFull ? (
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        ) : (
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        )}
      </svg>
    </button>
  );
}

/**
 * One compact row in three parts -- brand, exit, tutorial replay and live-call
 * on the left; the scenario title centered; hint, accessibility and full
 * screen (outermost) on the right. No manual Reflection trigger anymore -- the Reflection auto-opens
 * once the whole mission is complete instead (see ChatScreen.jsx).
 * Every button pairs one icon from the shared set (icons.jsx) with a short
 * word. Where the row runs out of room -- a phone, or bigger text -- the words
 * (.chat-header__label) drop and the icons stay; each button's accessible
 * name is its full meaning either way.
 */
export default function ChatHeader({ scenario, onExit, onHint, onTalkLive, onTutorial, typing = false }) {
  return (
    <header className="chat-header">
      <div className="chat-header__row">
        <div className="chat-header__group chat-header__group--left">
          <div className="chat-header__brand" aria-hidden="true">
            <img className="chat-header__logo chat-header__logo--light" src="/logo-light.png" alt="" />
            <img className="chat-header__logo chat-header__logo--dark" src="/logo-dark.png" alt="" />
            <span className="chat-header__brand-name">nexus</span>
          </div>
          <button
            type="button"
            className="chat-header__exit"
            onClick={onExit}
            aria-label="Exit scenario and return to the scenario picker"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <button
            type="button"
            className="chat-header__tutorial"
            onClick={onTutorial}
            aria-label="Replay the getting-started walkthrough"
            title="Getting started"
          >
            <HelpIcon />
            <span className="chat-header__label chat-header__tutorial-label">Tutorial</span>
          </button>
          <button
            type="button"
            className="chat-header__voice"
            onClick={onTalkLive}
            aria-label="Start a live voice call with this character"
            title="Talk live"
          >
            <MicIcon />
            <span className="chat-header__label chat-header__voice-label">Talk Live</span>
          </button>
        </div>
        <div className="chat-header__title">
          {scenario.title}
          {/* The mode, under the title; its dot breathes while a reply is
              being written (the typing bubble itself announces that). */}
          <span className={`chat-v2__mode${typing ? " is-typing" : ""}`}>
            <span className="chat-v2__dot" aria-hidden="true" />
            Text practice
          </span>
        </div>
        <div className="chat-header__group chat-header__group--right">
          <button type="button" className="chat-header__hint" onClick={onHint} aria-label="Need a hint?" title="Need a hint?">
            <HintIcon />
            <span className="chat-header__label">Hint</span>
          </button>
          <AccessibilityButton className="chat-header__access" labelClassName="chat-header__label" />
          <FullscreenButton />
        </div>
      </div>
    </header>
  );
}
