import { SCENARIO_ACCENT_CONTRAST } from "./ChatScreen.jsx";

/**
 * Sits between picking a scenario and actually starting it -- lets the user
 * choose a typed chat or a live spoken call before ChatScreen ever mounts,
 * rather than defaulting silently into one. Same scenario-accent CSS
 * variable formula as ChatScreen (scenario.color drives --scenario-accent),
 * so the two screens read as one continuous flow, not a visual jump.
 */
export default function ModeSelect({ scenario, onChooseMode, onBack }) {
  const npcName = scenario.aiRole.split(" (")[0];

  return (
    <div
      className="mode-select"
      style={{
        "--scenario-accent": scenario.color,
        "--scenario-accent-contrast": SCENARIO_ACCENT_CONTRAST[scenario.id] ?? "#ffffff",
      }}
    >
      {/* Reuses .chat-screen__background wholesale (same dark-theme/
          high-contrast handling already tuned there) rather than a
          near-duplicate class, since it's the identical scenario-photo
          backdrop treatment. */}
      <div
        className="chat-screen__background"
        style={{ backgroundImage: `url(/images/scenarios/${scenario.id}.jpg)` }}
        aria-hidden="true"
      />

      <button className="mode-select__back" onClick={onBack} aria-label="Back to scenario picker">
        <span aria-hidden="true">&larr;</span>
      </button>

      <div className="mode-select__content">
        <div className="mode-select__dot" aria-hidden="true" />
        <h1 className="mode-select__title">{scenario.title}</h1>
        <p className="mode-select__intro">{scenario.preview}</p>
        {scenario.practiceLabel && (
          <div className="mode-select__practice">Practice: {scenario.practiceLabel}</div>
        )}

        <p className="mode-select__prompt">How do you want to practice with {npcName}?</p>

        <div className="mode-select__options">
          <button
            type="button"
            className="mode-select__option"
            onClick={() => onChooseMode("text")}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a8 8 0 1 1-3.4-6.5" />
              <path d="M21 4v5h-5" />
            </svg>
            <span className="mode-select__option-title">Type a Chat</span>
            <span className="mode-select__option-desc">Read and type replies at your own pace.</span>
          </button>

          <button
            type="button"
            className="mode-select__option mode-select__option--voice"
            onClick={() => onChooseMode("voice")}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
            </svg>
            <span className="mode-select__option-title">Talk Live</span>
            <span className="mode-select__option-desc">A real spoken conversation, out loud.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
