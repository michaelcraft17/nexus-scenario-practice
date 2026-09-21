import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

/**
 * The single "Accessibility" pill -- rendered in both the
 * picker header and the chat header, both instances opening the same
 * shared panel via AccessibilityContext.
 * @param {string} [className] - Replaces (never combines with) the default
 *   `.a11y-button` styling, so callers can take on a surrounding header's
 *   look without a cascade fight over which class wins.
 * @param {boolean} [iconOnly] - Renders a short "Access" label instead of
 *   the "Accessibility" text, for tight header space -- the aria-label
 *   stays the full "Accessibility features" either way.
 */
export default function AccessibilityButton({ className, iconOnly = false }) {
  const { panelOpen, togglePanel } = useAccessibility();

  return (
    <button
      type="button"
      className={className || "a11y-button"}
      onClick={togglePanel}
      aria-pressed={panelOpen}
      aria-haspopup="dialog"
      aria-label="Accessibility features"
      title="Accessibility features (Ctrl+U)"
    >
      {!iconOnly && (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
        </svg>
      )}
      {iconOnly ? "Access" : "Accessibility"}
    </button>
  );
}
