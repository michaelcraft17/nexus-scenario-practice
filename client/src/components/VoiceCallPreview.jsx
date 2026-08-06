import { useState } from "react";
import VoiceCallScreen from "./VoiceCallScreen.jsx";

/**
 * Dev-only art-style sandbox for the live-call screen -- reachable via
 * ?voicePreview on the URL (see App.jsx), never linked to from the real
 * app. Renders the actual production VoiceCallScreen (not a copy), just in
 * previewMode so it skips the real Realtime API session, WebRTC, and mic
 * permission entirely and fakes the audio-reactive amplitude instead --
 * lets you iterate on colors/motion/layout freely without spending API
 * calls or needing a network connection each time. Colors here are the
 * app's real per-NPC scenario colors (server/src/data/scenarios.json),
 * kept in sync by hand since this preview never calls the API to fetch
 * them live.
 */
const DEMO_CHARACTERS = [
  { name: "Priya", color: "#4F8A8B" },
  { name: "Dana", color: "#E4A34C" },
  { name: "Marcus", color: "#6C5B7B" },
  { name: "Ms. Alvarez", color: "#C1666B" },
];

// null means "let VoiceCallScreen auto-cycle through the whole vocabulary"
// (see its previewBodyState prop) -- any other value pins it there instead,
// for inspecting one pose closely.
const BODY_STATES = [null, "idle", "listening", "thinking", "speaking"];
const BODY_STATE_LABELS = {
  null: "Auto-cycle",
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

const controlBarStyle = {
  position: "fixed",
  top: "max(16px, env(safe-area-inset-top))",
  right: 16,
  zIndex: 50,
  display: "flex",
  gap: 8,
};

const buttonStyle = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(42, 38, 32, 0.15)",
  background: "rgba(255, 255, 255, 0.8)",
  color: "#2a2620",
  fontSize: "0.8rem",
  fontWeight: 600,
};

export default function VoiceCallPreview() {
  const [index, setIndex] = useState(0);
  const [bodyStateIndex, setBodyStateIndex] = useState(0);
  const character = DEMO_CHARACTERS[index];
  const bodyState = BODY_STATES[bodyStateIndex];

  function exitPreview() {
    window.location.href = window.location.pathname;
  }

  return (
    <>
      <VoiceCallScreen
        open
        previewMode
        previewBodyState={bodyState}
        scenarioId="preview"
        npcName={character.name}
        accentColor={character.color}
        accentContrast="#ffffff"
        onClose={exitPreview}
      />
      <div style={controlBarStyle}>
        <button
          type="button"
          onClick={() => setBodyStateIndex((i) => (i + 1) % BODY_STATES.length)}
          style={buttonStyle}
        >
          State: {BODY_STATE_LABELS[bodyState]}
        </button>
        <button type="button" onClick={() => setIndex((i) => (i + 1) % DEMO_CHARACTERS.length)} style={buttonStyle}>
          Next color ({character.name})
        </button>
      </div>
    </>
  );
}
