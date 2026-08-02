import AccessibilityButton from "./AccessibilityButton.jsx";

/**
 * A single compact row -- exit, title, and two icon-sized actions (hint,
 * accessibility). No manual Reflection trigger anymore -- the Reflection
 * auto-opens once the whole mission is complete instead (see ChatScreen.jsx).
 * Icon-only buttons keep their full-text meaning in `aria-label`/`title` for
 * anyone not able to rely on the icon alone.
 */
export default function ChatHeader({ scenario, onExit, onHint }) {
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
        <div className="chat-header__title">{scenario.title}</div>
        <button className="chat-header__icon" onClick={onHint} aria-label="Need a hint?" title="Need a hint?">
          Hint
        </button>
        <AccessibilityButton className="chat-header__icon" iconOnly />
      </div>
    </header>
  );
}
