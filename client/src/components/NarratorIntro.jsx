/**
 * The Narrator's opening framing, shown once before the AI character's
 * opening line: goal/mission framing first, then the sensory/social
 * atmosphere. Deliberately styled unlike a chat bubble (no speaker, no
 * tail) so it reads as narration, not dialogue -- the same visual language
 * as NarratorNote and the "Explain that" panel, since it's the same voice.
 */
export default function NarratorIntro({ opening, atmosphere }) {
  if (!opening && !atmosphere) return null;

  return (
    <div className="narrator-box narrator-box--intro">
      {opening && <p>{opening}</p>}
      {atmosphere && <p>{atmosphere}</p>}
    </div>
  );
}
