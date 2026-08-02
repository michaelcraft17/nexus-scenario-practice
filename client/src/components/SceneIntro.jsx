/**
 * Brief scene-direction paragraph shown once, before the AI's opening line
 * -- establishes who the user is playing, who the AI is playing, and the
 * immediate situation. Deliberately styled unlike a chat bubble (no speaker,
 * no tail) so it reads as narration, not dialogue.
 */
export default function SceneIntro({ text }) {
  if (!text) return null;

  return (
    <div className="scene-intro">
      <p>{text}</p>
    </div>
  );
}
