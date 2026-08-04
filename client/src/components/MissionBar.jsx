import { useState } from "react";

/**
 * The mission panel -- a small floating badge pinned to the top-right of
 * the conversation (sticky within the scrollable message region, so it
 * stays put while scrolling without needing a fixed pixel offset tied to
 * the header's height). Styled like a game quest tracker: a short label
 * plus the single next incomplete objective, not the full mission text --
 * tap to expand for the full mission and every objective as a ☑/☐ row.
 * Objective completion and stage progression are both decided server-side
 * (see server/src/engine/dialogueEngine.js generateNarratorUpdate) -- this
 * component only ever renders the mission object it's given, it never
 * computes completion itself.
 */
export default function MissionBar({ mission }) {
  const [expanded, setExpanded] = useState(false);

  if (!mission) return null;

  const completedCount = mission.objectives.filter((o) => o.completed).length;
  const nextObjective = mission.objectives.find((o) => !o.completed);

  return (
    <div className="mission-badge">
      <button
        type="button"
        className="mission-badge__toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={`Current mission, ${completedCount} of ${mission.objectives.length} objectives complete. Tap to ${expanded ? "collapse" : "expand"}.`}
      >
        <div className="mission-badge__label">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 21V4" />
            <path d="M5 4h13l-3 4 3 4H5" />
          </svg>
          Mission
          <span className="mission-badge__progress">
            {completedCount}/{mission.objectives.length}
          </span>
        </div>
        <div className="mission-badge__next">
          {nextObjective && (
            <svg className="mission-badge__next-checkbox" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
            </svg>
          )}
          {nextObjective ? nextObjective.text : "All objectives complete"}
        </div>
      </button>

      {expanded && (
        <div className="mission-badge__details">
          <p className="mission-badge__text">{mission.missionText}</p>
          <ul className="mission-badge__objectives">
            {mission.objectives.map((objective) => (
              <li
                key={objective.id}
                className={`mission-badge__objective ${
                  objective.completed ? "mission-badge__objective--done" : ""
                }`}
              >
                <span className="mission-badge__checkbox" aria-hidden="true">
                  {objective.completed ? "☑" : "☐"}
                </span>
                {objective.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
