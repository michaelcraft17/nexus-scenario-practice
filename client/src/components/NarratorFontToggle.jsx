import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

/**
 * A small switch at the end of each "Explain that" answer that swaps just
 * those answers' calligraphy (italic EB Garamond) for the app's plain sans
 * -- the rest of the Narrator's text stays calligraphy. Shared by every
 * answer and remembered (prefs.explanationFont, mirrored to <html
 * data-explanation-font>). The Accessibility menu's "Easier Narrator Font"
 * switches all Narrator text at once; if that's on, these answers are plain
 * too, and switching one back to calligraphy turns that off as well.
 */
export default function NarratorFontToggle({ className = "" }) {
  const { prefs, setPref } = useAccessibility();
  const plain = prefs.explanationFont === "plain" || prefs.easierNarratorFont;

  function toggle() {
    if (plain) {
      setPref("explanationFont", "calligraphy");
      if (prefs.easierNarratorFont) setPref("easierNarratorFont", false);
    } else {
      setPref("explanationFont", "plain");
    }
  }

  return (
    <button
      type="button"
      className={`narrator-font-toggle ${className}`.trim()}
      aria-pressed={plain}
      title={plain ? "Switch back to the calligraphy font" : "Show these explanations in an easier-to-read font"}
      onClick={toggle}
    >
      <span className="narrator-font-toggle__glyph" aria-hidden="true">
        Aa
      </span>
      {plain ? "Calligraphy font" : "Easier font"}
    </button>
  );
}
