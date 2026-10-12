import { useId, useState } from "react";

/**
 * Suggested opening replies, as a row of chips. On wide screens they're
 * simply there. Where space is short (a phone, or bigger text) they sit
 * behind a "Reply ideas" button instead, so the character's opening line
 * stays on screen; the button says how many there are and opens them in
 * place (see .response-options--collapsible in chat-v2.css).
 */
export default function ResponseOptions({ options, onPick }) {
  const [open, setOpen] = useState(false);
  const chipsId = useId();
  if (!options || options.length === 0) return null;

  return (
    <div className={`response-options response-options--collapsible${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="response-options__toggle"
        aria-expanded={open}
        aria-controls={chipsId}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={open ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
        </svg>
        {open ? "Hide reply ideas" : `Reply ideas (${options.length})`}
      </button>
      <div id={chipsId} className="response-options__chips" role="group" aria-label="Suggested replies">
        {options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            className="response-options__chip"
            style={{ "--i": i }}
            onClick={() => onPick(option.text)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
