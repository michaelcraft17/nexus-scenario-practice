import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

/**
 * The single "Accessibility Features" pill -- rendered in both the
 * picker header and the chat header, both instances opening the same
 * shared panel via AccessibilityContext.
 * @param {string} [className] - Replaces (never combines with) the default
 *   `.a11y-button` styling, so callers can take on a surrounding header's
 *   look without a cascade fight over which class wins.
 * @param {boolean} [iconOnly] - Renders a short "Access" label instead of
 *   the full "Accessibility Features" text, for tight header space -- the
 *   aria-label stays the full phrase either way.
 */
export default function AccessibilityButton({ className, iconOnly = false }) {
  const { openPanel } = useAccessibility();

  return (
    <button
      type="button"
      className={className || "a11y-button"}
      onClick={openPanel}
      aria-label="Open accessibility features"
    >
      {iconOnly ? "Access" : "Accessibility Features"}
    </button>
  );
}
