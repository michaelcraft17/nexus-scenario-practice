/**
 * The Narrator's opening framing -- the scene caption, goal/mission
 * framing, the sensory/social atmosphere, and the current difficulty's
 * practice goal -- shown as a single incoming message from "Narrator",
 * the same bubble-row/speaker-label layout MessageBubble uses for an NPC's
 * lines, rather than a separate freestanding info panel. Still visually
 * distinct from real character dialogue (tint background, italic
 * EB Garamond via --font-narrator, a fixed blue/green accent left edge --
 * see --color-narrator-accent in index.css) so it reads as narration, not
 * something the NPC said.
 */
export default function NarratorIntro({ setting, opening, atmosphere, difficultyGoal }) {
  if (!setting && !opening && !atmosphere && !difficultyGoal) return null;

  return (
    <div className="bubble-row bubble-row--assistant">
      <div className="bubble bubble--narrator">
        <div className="bubble__speaker">Narrator</div>
        {setting && <p>{setting}</p>}
        {opening && <p>{opening}</p>}
        {atmosphere && <p>{atmosphere}</p>}
        {difficultyGoal && <p>{difficultyGoal}</p>}
      </div>
    </div>
  );
}
