import { useEffect, useState } from "react";
import { fetchScenarios } from "./services/api.js";
import ScenarioPicker from "./components/ScenarioPicker.jsx";
import ChatScreen from "./components/ChatScreen.jsx";

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch((err) => setLoadError(err.message));
  }, []);

  if (activeScenario) {
    return (
      <ChatScreen
        key={activeScenario.id}
        scenario={activeScenario}
        onExit={() => setActiveScenario(null)}
      />
    );
  }

  return (
    <ScenarioPicker
      scenarios={scenarios}
      loadError={loadError}
      onSelect={setActiveScenario}
    />
  );
}
