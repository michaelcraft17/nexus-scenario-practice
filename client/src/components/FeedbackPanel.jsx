export default function FeedbackPanel({ open, status, feedback, onClose }) {
  if (!open) return null;

  return (
    <div className="feedback-overlay" role="dialog" aria-modal="true" aria-label="Conversation feedback">
      <div className="feedback-panel">
        <div className="feedback-panel__header">
          <h2>How it went</h2>
          <button className="feedback-panel__close" onClick={onClose} aria-label="Close feedback">
            &times;
          </button>
        </div>

        <div className="feedback-panel__body">
          {status === "loading" && <p>Looking back over the conversation...</p>}
          {status === "error" && <p className="feedback-panel__error">{feedback}</p>}
          {status === "done" && <p>{feedback}</p>}
        </div>
      </div>
    </div>
  );
}
