import { useEffect, useState } from "react";
import HoverWords from "./HoverWords.jsx";

/** "a -- b" in the scenario data reads better as a real em dash on screen. */
function tidy(text) {
  return text ? text.replace(/ -- /g, " — ") : text;
}

/** First sentence stays visible; everything after it moves into the fold. */
function splitFirstSentence(text) {
  const match = text?.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  return match ? [match[1], match[2]] : [text, ""];
}

/**
 * The Narrator's opening framing, as a full-width card above the
 * conversation rather than a chat bubble -- there's a lot of text here, so
 * it gets the whole column. Only the scene caption and the first sentence of
 * the opening show up front; the rest of the opening, the sensory/social
 * atmosphere, and the current difficulty's practice goal sit behind "Read
 * full context". Still visually distinct from character dialogue (tint
 * background, italic EB Garamond via --font-narrator, a fixed blue/green
 * accent left edge -- see --color-narrator-accent in index.css) so it reads
 * as narration, not something the NPC said.
 */
export default function NarratorIntro({ setting, opening, atmosphere, difficultyGoal, compact = false }) {
  // Once the user has replied the scene has done its job, so it folds down
  // to one line; "Show scene" reopens it and "Hide scene" folds it again.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [compact]);

  if (!setting && !opening && !atmosphere && !difficultyGoal) return null;

  const [lead, rest] = splitFirstSentence(opening);
  const more = [rest, atmosphere, difficultyGoal].filter(Boolean);

  if (compact && !open) {
    return (
      <button
        type="button"
        className="narrator-card narrator-card--compact"
        aria-expanded="false"
        onClick={() => setOpen(true)}
      >
        <span className="narrator-card__label">Narrator</span>
        <span className="narrator-card__summary">{tidy(setting || lead)}</span>
        <span className="narrator-card__toggle">Show scene</span>
      </button>
    );
  }

  return (
    <div className="narrator-card">
      <div className="narrator-card__head">
        <div className="narrator-card__label">Narrator</div>
        {compact && (
          <button
            type="button"
            className="narrator-card__toggle"
            aria-expanded="true"
            onClick={() => setOpen(false)}
          >
            Hide scene
          </button>
        )}
      </div>
      {setting && <p className="narrator-card__setting"><HoverWords text={tidy(setting)} /></p>}
      {lead && <p><HoverWords text={tidy(lead)} /></p>}
      {more.length > 0 && (
        <details className="narrator-card__more">
          <summary>Read full context</summary>
          {more.map((text, i) => (
            <p key={i}>{tidy(text)}</p>
          ))}
        </details>
      )}
    </div>
  );
}
