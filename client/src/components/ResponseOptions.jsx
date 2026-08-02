export default function ResponseOptions({ options, onPick }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="response-options">
      <div className="response-options__label">
        Not sure what to say? Here are a few directions -- or just type your own below.
      </div>
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
