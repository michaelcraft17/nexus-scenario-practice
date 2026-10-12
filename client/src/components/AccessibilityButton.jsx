import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { AccessibilityIcon } from "./icons.jsx";

/**
 * The single "Accessibility" button -- rendered in both the picker header and
 * the chat header, both instances opening the same shared panel via
 * AccessibilityContext. Always the universal accessibility figure plus the
 * word "Accessibility", so it reads the same everywhere.
 * @param {string} [className] - Replaces (never combines with) the default
 *   `.a11y-button` styling, so callers can take on a surrounding header's
 *   look without a cascade fight over which class wins.
 * @param {string} [labelClassName] - Class for the visible word, so a tight
 *   header can hide it at narrow widths. The accessible name stays
 *   "Accessibility" either way.
 */
export default function AccessibilityButton({ className, labelClassName }) {
  const { panelOpen, togglePanel } = useAccessibility();

  return (
    <button
      type="button"
      className={className || "a11y-button"}
      onClick={togglePanel}
      aria-expanded={panelOpen}
      aria-haspopup="dialog"
      aria-label="Accessibility"
      title="Accessibility (Ctrl+U)"
    >
      <AccessibilityIcon size={18} />
      <span className={labelClassName}>Accessibility</span>
    </button>
  );
}
