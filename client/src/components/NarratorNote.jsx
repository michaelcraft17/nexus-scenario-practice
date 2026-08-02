/**
 * A proactive aside from the Narrator, interspersed in the message list
 * after a notable exchange -- distinct from a character bubble (no speaker
 * name, no "Explain that" button) and from NarratorIntro (compact, appears
 * inline rather than as a top-of-conversation block).
 */
export default function NarratorNote({ text }) {
  if (!text) return null;

  return (
    <div className="narrator-box narrator-box--note">
      <p>{text}</p>
    </div>
  );
}
