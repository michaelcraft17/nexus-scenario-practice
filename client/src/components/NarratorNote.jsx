/**
 * A proactive aside from the Narrator, interspersed in the message list
 * after a notable exchange -- distinct from a character bubble (no speaker
 * name, no "Explain that" button) and from NarratorIntro (compact, appears
 * inline rather than as a top-of-conversation block).
 * @param {string} text
 * @param {"subtext"|"mission"} [variant] - "mission" is used for the inline
 *   "Mission Updated" moment when the mission panel advances to a new
 *   stage -- same narration voice, a small flag icon to distinguish it from
 *   an ordinary subtext aside.
 */
export default function NarratorNote({ text, variant = "subtext" }) {
  if (!text) return null;

  return (
    <div className={`narrator-box narrator-box--note ${variant === "mission" ? "narrator-box--mission" : ""}`}>
      {variant === "mission" && (
        <p className="narrator-box__mission-label">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 21V4" />
            <path d="M5 4h13l-3 4 3 4H5" />
          </svg>
          Mission Updated
        </p>
      )}
      <p>{text}</p>
    </div>
  );
}
