import { useEffect, useRef, useState } from "react";
import {
  useAccessibility,
  COLOR_SCHEME_OPTIONS,
  THEME_OPTIONS,
  SPEECH_RATE_OPTIONS,
} from "../a11y/AccessibilityContext.jsx";
import { A11Y_TILES, describeTile, nextTileValue, ResetIcon, CloseIcon } from "../a11y/tiles.jsx";

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

/** Color scheme choices with a live swatch of each scheme's own colors.
 * The swatch element carries the same data-color-scheme/data-theme
 * attributes index.css already keys its variable blocks on, so it picks up
 * that scheme's real --color-primary/--color-accent (in the current
 * light/dark theme) without duplicating any hex values here. */
function ColorSchemeGroup({ value, theme, onChange }) {
  return (
    <div className="a11y-field">
      <div className="a11y-field__label">Color scheme</div>
      <div className="a11y-scheme-grid">
        {COLOR_SCHEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`a11y-scheme ${value === opt.value ? "a11y-scheme--active" : ""}`}
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            <span className="a11y-scheme__swatches" data-color-scheme={opt.value} data-theme={theme} aria-hidden="true">
              <span className="a11y-scheme__dot a11y-scheme__dot--primary" />
              <span className="a11y-scheme__dot a11y-scheme__dot--accent" />
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The accessibility menu: a right-hand drawer opened by AccessibilityButton
 * (or Ctrl+U). Ported from the Accessibility Mapper's menu -- a grid of
 * tiles, each cycling through its own steps (see a11y/tiles.jsx), with the
 * finer-grained settings (color scheme, theme, read-aloud, your data) under
 * "More settings". Deliberately not modal: there's no backdrop, so the page
 * stays visible and every change can be seen as it's made.
 *
 * Every control reads/writes the one consolidated prefs object in
 * AccessibilityContext. The only local state here is the two-step "delete
 * all data" confirmation.
 */
export default function AccessibilityPanel() {
  const {
    prefs,
    setPref,
    resetAllPrefs,
    resolvedTheme,
    favorites,
    panelOpen,
    closePanel,
    canReadAloud,
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

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const closeButtonRef = useRef(null);

  // While open: Escape closes, focus moves into the menu, and focus goes
  // back to whatever opened it when it closes. (These hooks sit above the
  // early return below so their order never changes between renders.)
  useEffect(() => {
    if (!panelOpen) {
      setConfirmingDelete(false);
      return;
    }
    const opener = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  function handleDeleteAll() {
    deleteAllData();
    setConfirmingDelete(false);
  }

  const playLabel = speechState === "speaking" ? "Pause" : speechState === "paused" ? "Resume" : "Play";

  return (
    <div role="dialog" aria-label="Accessibility menu" className={`a11y-menu${prefs.oversized ? " a11y-menu--big" : ""}`}>
      <div className="a11y-menu__head">
        <span>Accessibility Menu (CTRL+U)</span>
        <button
          ref={closeButtonRef}
          type="button"
          className="a11y-menu__close"
          onClick={closePanel}
          aria-label="Close accessibility menu"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="a11y-menu__body">
        <div className="a11y-menu__row">
          <span id="a11y-oversized-label">Oversized Widget</span>
          <button
            type="button"
            role="switch"
            className="a11y-switch"
            aria-checked={!!prefs.oversized}
            aria-labelledby="a11y-oversized-label"
            onClick={() => setPref("oversized", !prefs.oversized)}
          />
        </div>

        <div className="a11y-tiles">
          {A11Y_TILES.map((tile) => {
            const current = prefs[tile.key];
            const { on, stepIndex, label, icon, tone } = describeTile(tile, current);
            const multiStep = tile.steps.length > 1;
            return (
              <button
                key={tile.key}
                type="button"
                className="a11y-tile"
                aria-pressed={on}
                style={tone ? { "--tc": tone } : undefined}
                aria-label={multiStep ? `${label}${on ? `, step ${stepIndex + 1} of ${tile.steps.length}` : ", off"}` : label}
                onClick={() => setPref(tile.key, nextTileValue(tile, current))}
              >
                {icon}
                <span>{label}</span>
                {on && multiStep && (
                  <span className="a11y-tile__steps" aria-hidden="true">
                    {tile.steps.map((_, n) => (
                      <i key={n} className={n <= stepIndex ? "on" : ""} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button type="button" className="a11y-menu__wide" onClick={resetAllPrefs}>
          <ResetIcon /> Reset All Accessibility Settings
        </button>

        <div className="a11y-menu__more">More settings</div>

        <ColorSchemeGroup
          value={prefs.colorScheme}
          theme={resolvedTheme}
          onChange={(v) => setPref("colorScheme", v)}
        />
        <OptionGroup
          label="Theme"
          options={THEME_OPTIONS}
          value={prefs.theme}
          onChange={(v) => setPref("theme", v)}
        />

        <div className="a11y-field">
          <div className="a11y-field__label">Reading aloud</div>
          <p className="a11y-field__hint">
            {canReadAloud
              ? "Reads whatever is on screen -- the scenario list, or the conversation so far."
              : "Nothing to read on this screen. Reading aloud works on the scenario list and in a chat."}
          </p>
          <div className="a11y-field__options">
            <button
              type="button"
              className={`a11y-option ${speechState !== "idle" ? "a11y-option--active" : ""}`}
              onClick={speechState === "speaking" ? pauseSpeech : playSpeech}
              disabled={!canReadAloud}
            >
              {playLabel}
            </button>
            <button type="button" className="a11y-option" onClick={stopSpeech} disabled={speechState === "idle"}>
              Stop
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
                disabled={!canReadAloud}
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
              disabled={!canReadAloud}
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
          <p className="a11y-field__hint">
            {favorites.length} saved scenario{favorites.length === 1 ? "" : "s"}. Your preferences, favorites, and
            past reflections are saved only in this browser, on this device.
          </p>
          <div className="a11y-field__options">
            <button type="button" className="a11y-option" onClick={exportData}>
              Export as JSON
            </button>
            {!confirmingDelete && (
              <button type="button" className="a11y-option a11y-option--danger" onClick={() => setConfirmingDelete(true)}>
                Delete all data
              </button>
            )}
          </div>
          {confirmingDelete && (
            <div className="a11y-confirm" role="alertdialog" aria-label="Confirm deleting all data">
              <p className="a11y-confirm__text">
                This clears your saved preferences, favorites, and past reflections from this device. It can't be
                undone.
              </p>
              <div className="a11y-field__options">
                <button type="button" className="a11y-option a11y-option--danger-solid" onClick={handleDeleteAll}>
                  Yes, delete everything
                </button>
                <button type="button" className="a11y-option" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
