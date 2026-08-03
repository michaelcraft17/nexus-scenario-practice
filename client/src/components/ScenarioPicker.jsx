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
      <div className="picker__a11y">
        <button className="picker__history-button" onClick={openHistory}>
          Past Reflections
        </button>
        <AccessibilityButton />
      </div>

      <header className="picker__header">
        <img className="picker__logo picker__logo--light" src="/logo-light.png" alt="" aria-hidden="true" />
        <img className="picker__logo picker__logo--dark" src="/logo-dark.png" alt="" aria-hidden="true" />
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
