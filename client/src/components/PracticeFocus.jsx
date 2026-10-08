import { useRef } from "react";

/**
 * Per-scenario heading and framing line for the practice-focus card. Only
 * scenarios with authored copy get a custom heading; the rest fall back to
 * the scenario's own practiceLabel and teachingPoint.
 */
const FOCUS_COPY = {
  "missing-details": {
    heading: "Make room for clarity.",
    lead: "You don’t have to guess what someone needs. A question is a useful next step.",
  },
};

function fallbackHeading(scenario) {
  const label = scenario.practiceLabel || "";
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}.` : scenario.title;
}

/**
 * The folded bar's emblem: an arrow in a target, painted in the app's
 * watercolor style -- a warm clay wash behind a cream ring edged in brown, a
 * red ring, and a brown bullseye, with a dark-brown arrow and red fletching.
 * Ring centres sit a hair off each other so it reads hand-painted.
 */
function TargetMark() {
  return (
    <svg className="practice-focus__mark" viewBox="0 0 44 44" width="34" height="34" aria-hidden="true">
      <path
        className="practice-focus__mark-wash"
        d="M21 4.5c7.6-.6 15.2 4.3 17.4 11.6 2.3 7.6-1.1 16.4-8.3 20.4-7.4 4.2-17.8 2.6-22.9-4.1C2.4 25.9 3 16 8.6 10 11.9 6.6 16.3 4.9 21 4.5z"
      />
      <circle cx="21.5" cy="23" r="14" fill="#fbf3e6" stroke="#8b5a3c" strokeWidth="2" />
      <circle cx="21.2" cy="23.3" r="9.4" fill="#c95a44" stroke="#9a3f2c" strokeWidth="1.4" />
      <circle cx="21.5" cy="22.9" r="5" fill="#fbf3e6" />
      <circle cx="21.6" cy="22.8" r="2.9" fill="#7a4528" />
      <g className="practice-focus__mark-arrow">
        <path d="M32.6 12L33.1 6.9 35.3 4.7 37.2 7.4z" fill="#c95a44" />
        <path d="M32.6 12L37.7 11.5 39.9 9.3 37.2 7.4z" fill="#e39577" />
        <path d="M22 22.6L37.2 7.4" stroke="#5a3520" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Desktop side card: the scenario's practice focus plus the live mission as
 * a checklist -- the next incomplete objective highlighted, finished ones
 * ticked. The scenario's lead (its teaching point) sits in the quieter note
 * under the card instead of inside it. Like MissionBar, it only renders the
 * mission it's given; objective completion and stage progression are
 * decided server-side. Below the
 * desktop breakpoint this card is hidden and MissionBar's sticky badge takes
 * over (see chat-v2.css).
 *
 * `collapsed` folds it into a slim bar at the right edge so the chat gets the
 * room; the bar still shows mission progress. One arrow button sits on the
 * seam between the chat and this panel in both states, so hiding and showing
 * happen from the same spot (and keyboard focus stays on it).
 */
export default function PracticeFocus({ scenario, mission, collapsed = false, onToggle }) {
  const toggleRef = useRef(null);

  function toggle() {
    onToggle?.();
    // The rail unmounts when it's clicked; keep focus on the seam button.
    // preventScroll: the column is still animating its width, and a scroll
    // into view here would leave the card scrolled sideways.
    requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
  }

  const copy = FOCUS_COPY[scenario.id] ?? {
    heading: fallbackHeading(scenario),
    lead: scenario.teachingPoint,
  };
  const objectives = mission?.objectives ?? [];
  const doneCount = objectives.filter((o) => o.completed).length;
  const currentIndex = objectives.findIndex((o) => !o.completed);

  const seamToggle = onToggle && (
    <button
      ref={toggleRef}
      type="button"
      className="practice-focus__toggle"
      aria-expanded={!collapsed}
      aria-controls="practice-focus-content"
      aria-label={
        collapsed
          ? `Show your practice focus${objectives.length ? `, ${doneCount} of ${objectives.length} objectives complete` : ""}`
          : "Hide your practice focus"
      }
      title={collapsed ? "Show your practice focus" : "Hide to focus on the chat"}
      onClick={toggle}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={collapsed ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );

  if (collapsed) {
    return (
      <aside className="practice-focus practice-focus--collapsed" aria-label="Your practice focus">
        {seamToggle}
        {/* Mouse convenience: the whole bar reopens the panel too. The seam
            button above is the accessible control, so this stays out of the
            tab order and the accessibility tree. */}
        <div className="practice-focus__rail" aria-hidden="true" onClick={toggle} title="Show your practice focus">
          <TargetMark />
          {objectives.length > 0 && (
            <span className="practice-focus__rail-count">
              {doneCount}/{objectives.length}
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="practice-focus" aria-label="Your practice focus">
      {seamToggle}
      <div className="practice-focus__scroll" id="practice-focus-content">
        <div className="practice-focus__card">
          <span className="practice-focus__eyebrow">Your practice focus</span>
          <h2 className="practice-focus__heading">{copy.heading}</h2>

          {mission && (
            <div className="practice-focus__mission">
              <div className="practice-focus__mission-head">
                <span className="practice-focus__mission-label">
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 21V4" />
                    <path d="M5 4h13l-3 4 3 4H5" />
                  </svg>
                  Mission
                </span>
                <span className="practice-focus__mission-count" aria-live="polite">
                  {doneCount}/{objectives.length}
                  <span className="visually-hidden"> objectives complete</span>
                </span>
              </div>
              <div className="practice-focus__bar" aria-hidden="true">
                {objectives.map((o, i) => (
                  <i key={o.id} className={i < doneCount ? "is-on" : ""} />
                ))}
              </div>
              <ol className="practice-focus__objectives" aria-label="Mission objectives">
                {objectives.map((o, i) => {
                  const state = o.completed ? "done" : i === currentIndex ? "current" : "todo";
                  return (
                    <li key={o.id} className={`practice-focus__objective practice-focus__objective--${state}`}>
                      <span className="practice-focus__check" aria-hidden="true" />
                      <span>{o.text}</span>
                      <span className="visually-hidden">
                        {state === "done" ? " (done)" : state === "current" ? " (current)" : " (not yet)"}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {objectives.length > 0 && currentIndex === -1 && (
                <p className="practice-focus__complete">All objectives complete — nice work.</p>
              )}
            </div>
          )}
        </div>

        <div className="practice-focus__note">
          <strong>Tips</strong>
          {copy.lead
            ? copy.lead.replace(/ -- /g, " — ")
            : "There’s more than one way to respond. Try words that feel natural to you."}
        </div>
      </div>
    </aside>
  );
}
