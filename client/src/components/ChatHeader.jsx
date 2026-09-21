import AccessibilityButton from "./AccessibilityButton.jsx";

/**
 * A single compact row -- exit, tutorial replay, live-call, title, and two
 * small actions on the right (hint, accessibility). No manual Reflection trigger anymore -- the Reflection
 * auto-opens once the whole mission is complete instead (see ChatScreen.jsx).
 * Icon-only buttons keep their full-text meaning in `aria-label`/`title` for
 * anyone not able to rely on the icon alone.
 */
export default function ChatHeader({ scenario, onExit, onHint, onTalkLive, onTutorial }) {
  return (
    <header className="chat-header">
      <div className="chat-header__row">
        <button
          className="chat-header__exit"
          onClick={onExit}
          aria-label="Exit scenario and return to the scenario picker"
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        {/* Where Hint used to sit -- the tutorial is the thing a newcomer
            reaches for first, and Hint moved over next to Accessibility on
            the right with the other in-the-moment helpers. On narrow screens
            only the "?" shows (the label drops, same as Talk Live's). */}
        <button
          className="chat-header__tutorial"
          onClick={onTutorial}
          aria-label="Replay the getting-started walkthrough"
          title="Getting started"
        >
          <span aria-hidden="true">?</span>
          <span className="chat-header__tutorial-label">Tutorial</span>
        </button>
        <button
          className="chat-header__voice"
          onClick={onTalkLive}
          aria-label="Start a live voice call with this character"
          title="Talk live"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
          </svg>
          <span className="chat-header__voice-label">Talk Live</span>
        </button>
        <div className="chat-header__title">{scenario.title}</div>
        <button className="chat-header__hint" onClick={onHint} aria-label="Need a hint?" title="Need a hint?">
          Hint
        </button>
        <AccessibilityButton className="chat-header__access" iconOnly />
      </div>
    </header>
  );
}
