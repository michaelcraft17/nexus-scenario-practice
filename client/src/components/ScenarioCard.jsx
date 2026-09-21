import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

export default function ScenarioCard({ scenario, onSelect }) {
  const { isFavorite, toggleFavorite } = useAccessibility();
  const favorite = isFavorite(scenario.id);

  return (
    <div className="scenario-card" data-scenario={scenario.id}>
      <div
        className="scenario-card__image"
        style={{
          backgroundColor: scenario.color,
          backgroundImage: `url(/images/scenarios/${scenario.id}.jpg)`,
        }}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`scenario-card__favorite ${favorite ? "scenario-card__favorite--active" : ""}`}
        onClick={() => toggleFavorite(scenario.id)}
        aria-pressed={favorite}
        aria-label={favorite ? `Remove ${scenario.title} from favorites` : `Add ${scenario.title} to favorites`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
        </svg>
      </button>
      <div className="scenario-card__body">
        <div className="scenario-card__title-row">
          <span className="scenario-card__dot" aria-hidden="true" />
          <h2 className="scenario-card__title">{scenario.title}</h2>
        </div>

        <p className="scenario-card__intro">{scenario.preview}</p>

        {scenario.practiceLabel && (
          <div className="scenario-card__practice">Practice: {scenario.practiceLabel}</div>
        )}

        <div className="scenario-card__difficulty">
          <button
            type="button"
            className="scenario-card__difficulty-button"
            onClick={() => onSelect(scenario, "advanced")}
          >
            Start scenario
          </button>
        </div>
      </div>
    </div>
  );
}
