/** Roughly-relative phrasing ("Today", "Yesterday", "3 days ago") reads
 * more naturally in a short list than a raw date/time stamp would. */
function formatRelativeDate(isoString) {
  const date = new Date(isoString);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * A list of past Reflections (see services/reflectionHistory.js), opened
 * from the scenario picker. Tapping an entry hands its stored data to the
 * same ReflectionPanel used right after finishing a scenario -- see
 * ScenarioPicker.jsx, which renders that reused panel alongside this one.
 */
export default function ReflectionHistoryPanel({ open, entries, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="reflection-overlay" role="dialog" aria-modal="true" aria-label="Past reflections">
      <div className="reflection-panel">
        <div className="reflection-panel__header">
          <h2>Past Reflections</h2>
          <button className="reflection-panel__close" onClick={onClose} aria-label="Close past reflections">
            &times;
          </button>
        </div>

        <div className="reflection-panel__body">
          {entries.length === 0 ? (
            <p className="reflection-history__empty">
              Nothing here yet -- finish a scenario's mission and its Reflection will be saved here to look back on later.
            </p>
          ) : (
            <ul className="reflection-history__list">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button className="reflection-history__item" onClick={() => onSelect(entry)}>
                    <span className="reflection-history__item-title">{entry.scenarioTitle}</span>
                    <span className="reflection-history__item-date">{formatRelativeDate(entry.completedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
