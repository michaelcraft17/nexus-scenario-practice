import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

/**
 * The single "Accessibility Features" pill -- rendered in both the
 * picker header and the chat header, both instances opening the same
 * shared panel via AccessibilityContext.
 */
export default function AccessibilityButton({ className }) {
  const { openPanel } = useAccessibility();

  return (
    <button
      type="button"
      className={className || "a11y-button"}
      onClick={openPanel}
      aria-label="Open accessibility features"
    >
      Accessibility Features
    </button>
  );
}
