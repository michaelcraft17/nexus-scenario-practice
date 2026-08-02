export default function ChatHeader({ scenario, onExit, onGetFeedback, feedbackDisabled }) {
  return (
    <header className="chat-header">
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
        onClick={onGetFeedback}
        disabled={feedbackDisabled}
      >
        Get feedback
      </button>
    </header>
  );
}
