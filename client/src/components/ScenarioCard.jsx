export default function ScenarioCard({ scenario, onSelect }) {
  return (
    <button className="scenario-card" onClick={() => onSelect(scenario)}>
      <div
        className="scenario-card__image"
        style={{ backgroundColor: scenario.color }}
        aria-hidden="true"
      />
      <div className="scenario-card__body">
        <h2 className="scenario-card__title">{scenario.title}</h2>
        <p className="scenario-card__setting">{scenario.setting}</p>
        <p className="scenario-card__teaching-point">{scenario.teachingPoint}</p>
      </div>
    </button>
  );
}
