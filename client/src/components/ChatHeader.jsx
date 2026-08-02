export default function ChatHeader({ scenario, difficulty, onExit, onReflect, reflectDisabled, onHint }) {
  return (
    <header className="chat-header">
      <div className="chat-header__row">
        <button
          className="chat-header__exit"
          onClick={onExit}
          aria-label="Exit scenario and return to the scenario picker"
        >
          &larr; Exit scenario
        </button>
        <div className="chat-header__title">{scenario.title}</div>
        <button
          className="chat-header__feedback"
          onClick={onReflect}
          disabled={reflectDisabled}
        >
          Reflection
        </button>
      </div>
      <div className="chat-header__row chat-header__row--secondary">
        <button className="chat-header__hint" onClick={onHint}>
          &#128161; Need a hint?
        </button>
        {difficulty && <div className="chat-header__difficulty">{difficulty}</div>}
      </div>
    </header>
  );
}
