/**
 * A single horizontally-scrollable row of suggestion chips, styled like a
 * typical chat app's quick-reply row rather than a stacked block of
 * full-width buttons -- takes one compact row of height no matter how many
 * options there are, leaving more of the screen for the conversation.
 */
export default function ResponseOptions({ options, onPick }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="response-options">
      <div className="response-options__label">Suggestions</div>
      <div className="response-options__chips">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="response-options__chip"
            onClick={() => onPick(option.text)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
