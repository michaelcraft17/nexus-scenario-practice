import { useEffect, useState } from "react";
import { fetchScenarios } from "./services/api.js";
import ScenarioPicker from "./components/ScenarioPicker.jsx";
import ModeSelect from "./components/ModeSelect.jsx";
import ChatScreen from "./components/ChatScreen.jsx";
import AccessibilityPanel from "./components/AccessibilityPanel.jsx";
import ReadingAid from "./components/ReadingAid.jsx";
import VoiceCallPreview from "./components/VoiceCallPreview.jsx";

// Dev-only art-style sandbox for the live-call screen, e.g.
// http://localhost:5173/?voicePreview -- see VoiceCallPreview.jsx.
// import.meta.env.DEV keeps this branch (and the check itself) out of the
// production build entirely, not just unlinked from the UI.
const VOICE_PREVIEW = import.meta.env.DEV && new URLSearchParams(window.location.search).has("voicePreview");

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [difficultyGoals, setDifficultyGoals] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeDifficulty, setActiveDifficulty] = useState("advanced");
  // Set once the user picks "Type a Chat" or "Talk Live" on ModeSelect --
  // null means a scenario is chosen but the mode isn't yet, which is what
  // routes to ModeSelect below instead of straight into ChatScreen.
  const [startMode, setStartMode] = useState(null);
  // True right after leaving a session, so the picker fades in to meet the
  // session's fade-out (see ChatScreen's leaveSession).
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    fetchScenarios()
      .then(({ scenarios, difficultyGoals }) => {
        setScenarios(scenarios);
        setDifficultyGoals(difficultyGoals);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  function handleSelect(scenario, difficulty) {
    setActiveScenario(scenario);
    setActiveDifficulty(difficulty);
    setStartMode(null);
    setReturning(false);
  }

  function handleExit() {
    setActiveScenario(null);
    setStartMode(null);
    setReturning(true);
  }

  // After all hooks (not before) -- an early return here is fine since
  // VOICE_PREVIEW is a module-level constant, stable for this component
  // instance's whole lifetime, so the hooks above always run in the same
  // order across its renders either way.
  if (VOICE_PREVIEW) {
    // The call screen has its own Accessibility button, so the menu it opens
    // needs to be here too.
    return (
      <>
        <VoiceCallPreview />
        <AccessibilityPanel />
      </>
    );
  }

  return (
    <>
      {activeScenario && startMode ? (
        <ChatScreen
          key={`${activeScenario.id}-${activeDifficulty}-${startMode}`}
          scenario={activeScenario}
          difficulty={activeDifficulty}
          difficultyGoal={difficultyGoals[activeDifficulty]}
          startInVoiceMode={startMode === "voice"}
          onExit={handleExit}
        />
      ) : activeScenario ? (
        <ModeSelect
          scenario={activeScenario}
          onChooseMode={setStartMode}
          onBack={() => setActiveScenario(null)}
        />
      ) : (
        <ScenarioPicker
          scenarios={scenarios}
          loadError={loadError}
          fadeIn={returning}
          onSelect={handleSelect}
        />
      )}
      <ReadingAid />
      <AccessibilityPanel />
    </>
  );
}
