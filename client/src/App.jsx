import { useEffect, useState } from "react";
import { fetchScenarios } from "./services/api.js";
import ScenarioPicker from "./components/ScenarioPicker.jsx";
import ChatScreen from "./components/ChatScreen.jsx";

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [difficultyGoals, setDifficultyGoals] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeDifficulty, setActiveDifficulty] = useState("beginner");

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
  }

  if (activeScenario) {
    return (
      <ChatScreen
        key={`${activeScenario.id}-${activeDifficulty}`}
        scenario={activeScenario}
        difficulty={activeDifficulty}
        difficultyGoal={difficultyGoals[activeDifficulty]}
        onExit={() => setActiveScenario(null)}
      />
    );
  }

  return (
    <ScenarioPicker
      scenarios={scenarios}
      loadError={loadError}
      onSelect={handleSelect}
    />
  );
}
