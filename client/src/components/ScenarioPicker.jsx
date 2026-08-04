import { useEffect, useState } from "react";
import ScenarioCard from "./ScenarioCard.jsx";
import AccessibilityButton from "./AccessibilityButton.jsx";
import ReflectionHistoryPanel from "./ReflectionHistoryPanel.jsx";
import ReflectionPanel from "./ReflectionPanel.jsx";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { getReflectionHistory } from "../services/reflectionHistory.js";

export default function ScenarioPicker({ scenarios, loadError, onSelect }) {
  const { registerReadableContent } = useAccessibility();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // "Read aloud" on this screen reads the list of scenario cards -- the
  // picker's "resource list" equivalent.
  useEffect(() => {
    return registerReadableContent(() =>
      scenarios
        .map((s) => `${s.title}. ${s.preview} ${s.teachingPoint}`)
        .join(" ")
    );
  }, [scenarios, registerReadableContent]);

  function openHistory() {
    setHistoryEntries(getReflectionHistory());
    setHistoryOpen(true);
  }

  function selectEntry(entry) {
    setSelectedEntry(entry);
    setHistoryOpen(false);
  }

  // The "x" on a selected entry's detail view goes back to the list (it's
  // one step of navigation, not a full exit); the footer "Close" button
  // closes the whole history flow, mirroring the live in-scenario
  // Reflection's own x-vs-footer-button distinction.
  function backToList() {
    setSelectedEntry(null);
    setHistoryOpen(true);
  }

  function closeHistoryFlow() {
    setSelectedEntry(null);
    setHistoryOpen(false);
  }

  return (
    <div className="picker">
      <div className="picker__background" aria-hidden="true" />

      {/* Desktop-only decorative rail (hidden below 1180px via CSS) --
          fills the empty gutters either side of the centered content column
          with the same four scenario accent colors used on the cards below,
          rather than leaving them visually flat. Purely decorative. */}
      <div className="picker__rails" aria-hidden="true">
        <div className="picker__rail picker__rail--left" />
        <div className="picker__rail picker__rail--right" />
        <div className="picker__rail-dots">
          <span className="picker__rail-dot" style={{ background: "#4F8A8B" }} />
          <span className="picker__rail-dot" style={{ background: "#E4A34C" }} />
          <span className="picker__rail-dot" style={{ background: "#6C5B7B" }} />
          <span className="picker__rail-dot" style={{ background: "#C1666B" }} />
        </div>
      </div>

      <div className="picker__content">
        <div className="picker__a11y">
          <button className="picker__history-button" onClick={openHistory}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            Past Reflections
          </button>
          <AccessibilityButton />
        </div>

        <header className="picker__header">
          <div className="picker__hero">
            <div className="picker__hero-boxes" aria-hidden="true">
              <span className="picker__hero-box" style={{ background: "#f2cf4a", top: "4%", left: "8%", width: "30%", height: "50%", transform: "rotate(-6deg)" }} />
              <span className="picker__hero-box" style={{ background: "#9fd447", top: "8%", left: "32%", width: "27%", height: "46%", transform: "rotate(4deg)" }} />
              <span className="picker__hero-box" style={{ background: "#57c2c2", top: "0%", left: "51%", width: "27%", height: "52%", transform: "rotate(-3deg)" }} />
              <span className="picker__hero-box" style={{ background: "#f0964a", top: "12%", left: "70%", width: "29%", height: "48%", transform: "rotate(5deg)" }} />
              <span className="picker__hero-box" style={{ background: "#3fae8f", top: "48%", left: "3%", width: "27%", height: "48%", transform: "rotate(4deg)" }} />
              <span className="picker__hero-box" style={{ background: "#e8598a", top: "52%", left: "27%", width: "27%", height: "46%", transform: "rotate(-4deg)" }} />
              <span className="picker__hero-box" style={{ background: "#f2c14e", top: "50%", left: "50%", width: "25%", height: "44%", transform: "rotate(3deg)" }} />
              <span className="picker__hero-box" style={{ background: "#9b6fd6", top: "46%", left: "70%", width: "29%", height: "50%", transform: "rotate(-5deg)" }} />
            </div>
            <img className="picker__hero-hands picker__hero-hands--light" src="/logo-light.png" alt="" aria-hidden="true" />
            <img className="picker__hero-hands picker__hero-hands--dark" src="/logo-dark.png" alt="" aria-hidden="true" />
            <h1 className="picker__hero-title">Nexus</h1>
          </div>
          <p>Practice everyday conversations in a low-stakes, judgment-free space. Pick a scenario to start.</p>
          <p className="picker__framing">
            You're playing as a neurodivergent person navigating everyday
            situations -- the goal is to understand your needs, not to act
            "normal."
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

      <ReflectionHistoryPanel
        open={historyOpen}
        entries={historyEntries}
        onSelect={selectEntry}
        onClose={() => setHistoryOpen(false)}
      />

      {selectedEntry && (
        <ReflectionPanel
          open
          status="done"
          data={selectedEntry.data}
          npcName={selectedEntry.npcName}
          subtitle={`${selectedEntry.scenarioTitle} -- ${new Date(selectedEntry.completedAt).toLocaleDateString()}`}
          finishLabel="Close"
          onClose={backToList}
          onFinish={closeHistoryFlow}
        />
      )}
    </div>
  );
}
