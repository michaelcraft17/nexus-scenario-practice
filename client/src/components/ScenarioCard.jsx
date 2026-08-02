const DIFFICULTIES = [
  { level: "beginner", label: "Beginner" },
  { level: "intermediate", label: "Intermediate" },
  { level: "advanced", label: "Advanced" },
];

export default function ScenarioCard({ scenario, onSelect }) {
  return (
    <div className="scenario-card">
      <div
        className="scenario-card__image"
        style={{ backgroundColor: scenario.color }}
        aria-hidden="true"
      />
      <div className="scenario-card__body">
        <h2 className="scenario-card__title">{scenario.title}</h2>
        <p className="scenario-card__preview">{scenario.preview}</p>
        <p className="scenario-card__teaching-point">{scenario.teachingPoint}</p>

        <div className="scenario-card__difficulty" role="group" aria-label={`Choose a difficulty for ${scenario.title}`}>
          {DIFFICULTIES.map(({ level, label }) => (
            <button
              key={level}
              type="button"
              className="scenario-card__difficulty-button"
              onClick={() => onSelect(scenario, level)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
