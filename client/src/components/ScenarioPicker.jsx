import ScenarioCard from "./ScenarioCard.jsx";

export default function ScenarioPicker({ scenarios, loadError, onSelect }) {
  return (
    <div className="picker">
      <header className="picker__header">
        <h1>Nexus</h1>
        <p>Practice everyday conversations in a low-stakes, judgment-free space. Pick a scenario and a difficulty to start.</p>
        <p className="picker__framing">
          You're playing as a neurodivergent person navigating everyday
          situations. The goal isn't to act "normal" -- it's to understand
          your needs, communicate them, and find what works for you and
          others.
        </p>
      </header>

      {loadError && (
        <p className="picker__error">
          Couldn't load scenarios: {loadError}. Is the server running?
        </p>
      )}

      {!loadError && scenarios.length === 0 && (
        <p className="picker__loading">Loading scenarios...</p>
      )}

      <div className="picker__grid">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
