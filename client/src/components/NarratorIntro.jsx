/**
 * The Narrator's opening framing, shown once before the AI character's
 * opening line: goal/mission framing first, then the sensory/social
 * atmosphere, then the current difficulty's practice goal. Deliberately
 * styled unlike a chat bubble (no speaker, no tail) so it reads as
 * narration, not dialogue -- the same visual language as NarratorNote and
 * the "Explain that" panel, since it's the same voice.
 */
export default function NarratorIntro({ opening, atmosphere, difficultyGoal }) {
  if (!opening && !atmosphere && !difficultyGoal) return null;

  return (
    <div className="narrator-box narrator-box--intro">
      {opening && <p>{opening}</p>}
      {atmosphere && <p>{atmosphere}</p>}
      {difficultyGoal && <p>{difficultyGoal}</p>}
    </div>
  );
}
