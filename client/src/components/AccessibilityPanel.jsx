import {
  useAccessibility,
  COLOR_SCHEME_OPTIONS,
  THEME_OPTIONS,
  TEXT_SIZE_OPTIONS,
  TYPEFACE_OPTIONS,
  CONTRAST_OPTIONS,
  MOTION_OPTIONS,
  SPEECH_RATE_OPTIONS,
} from "../a11y/AccessibilityContext.jsx";

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="a11y-field">
      <div className="a11y-field__label">{label}</div>
      <div className="a11y-field__options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`a11y-option ${value === opt.value ? "a11y-option--active" : ""}`}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The slide-in panel opened by AccessibilityButton. Every control here
 * reads/writes the one consolidated prefs object in AccessibilityContext
 * (persisted to localStorage as a11y_prefs) -- there's no local state of
 * its own beyond the panel's own open/closed flag, which also lives in
 * the context so both header buttons stay in sync with it.
 */
export default function AccessibilityPanel() {
  const {
    prefs,
    setPref,
    panelOpen,
    closePanel,
    speechState,
    speechRate,
    setSpeechRate,
    voices,
    voiceURI,
    setVoiceURI,
    playSpeech,
    pauseSpeech,
    stopSpeech,
    exportData,
    deleteAllData,
  } = useAccessibility();

  if (!panelOpen) return null;

  function handleDeleteAll() {
    if (window.confirm("Delete all saved accessibility preferences, favorites, and past reflections? This can't be undone.")) {
      deleteAllData();
    }
  }

  return (
    <div className="a11y-overlay" role="presentation" onClick={closePanel}>
      <div
        className="a11y-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Accessibility features"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="a11y-panel__header">
          <h2>Accessibility Features</h2>
          <button className="a11y-panel__close" onClick={closePanel} aria-label="Close accessibility panel">
            &times;
          </button>
        </div>

        <div className="a11y-panel__body">
          <OptionGroup
            label="Color scheme"
            options={COLOR_SCHEME_OPTIONS}
            value={prefs.colorScheme}
            onChange={(v) => setPref("colorScheme", v)}
          />
          <OptionGroup
            label="Theme"
            options={THEME_OPTIONS}
            value={prefs.theme}
            onChange={(v) => setPref("theme", v)}
          />
          <OptionGroup
            label="Text size"
            options={TEXT_SIZE_OPTIONS}
            value={prefs.textSize}
            onChange={(v) => setPref("textSize", v)}
          />
          <OptionGroup
            label="Typeface"
            options={TYPEFACE_OPTIONS}
            value={prefs.typeface}
            onChange={(v) => setPref("typeface", v)}
          />
          <OptionGroup
            label="Contrast"
            options={CONTRAST_OPTIONS}
            value={prefs.contrast}
            onChange={(v) => setPref("contrast", v)}
          />
          <OptionGroup
            label="Motion"
            options={MOTION_OPTIONS}
            value={prefs.motion}
            onChange={(v) => setPref("motion", v)}
          />

          <div className="a11y-field">
            <div className="a11y-field__label">Reading aloud</div>
            <p className="a11y-field__hint">
              Reads whatever list is currently on screen -- the scenario picker, or the conversation so far.
            </p>
            <div className="a11y-field__options">
              <button type="button" className="a11y-option" onClick={playSpeech} disabled={speechState === "speaking"}>
                &#9654; Play
              </button>
              <button type="button" className="a11y-option" onClick={pauseSpeech} disabled={speechState !== "speaking"}>
                &#10073;&#10073; Pause
              </button>
              <button type="button" className="a11y-option" onClick={stopSpeech} disabled={speechState === "idle"}>
                &#9632; Stop
              </button>
            </div>
            <div className="a11y-field__options a11y-field__options--spaced">
              {SPEECH_RATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`a11y-option ${speechRate === opt.value ? "a11y-option--active" : ""}`}
                  aria-pressed={speechRate === opt.value}
                  onClick={() => setSpeechRate(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {voices.length > 0 && (
              <select
                className="a11y-select"
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                aria-label="Voice for reading aloud"
              >
                <option value="">Default voice</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="a11y-field">
            <div className="a11y-field__label">Your data</div>
            <div className="a11y-field__options">
              <button type="button" className="a11y-option" onClick={exportData}>
                Export as JSON
              </button>
              <button type="button" className="a11y-option a11y-option--danger" onClick={handleDeleteAll}>
                Delete all data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
