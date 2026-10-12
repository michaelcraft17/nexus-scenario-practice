/**
 * The app's utility icons -- one family for navigation and controls.
 *
 * Grid: 24 x 24, ~2px live area margin. Stroke: 2 at 16px and 1.8 at 18px
 * and above (pass `size`/`stroke`), round caps and joins, no fills except
 * a small solid dot where a glyph needs one. Optical size is matched by
 * eye rather than by bounding box: circles run to r=9, squares to 16-17.
 * Inline SVG so each icon inherits currentColor and needs no request.
 *
 * The Accessibility menu's tiles use larger 32-grid versions of the same
 * construction (a11y/tiles.jsx); the Reflection section icons are a
 * related soft-fill family (ReflectionPanel.jsx).
 */
function Icon({ size = 16, stroke, className, children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke ?? (size >= 18 ? 1.8 : 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** The universal accessibility figure: a person with arms open, in a ring. */
export function AccessibilityIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="7.4" r="1.1" fill="currentColor" stroke="none" />
      <path d="M7.5 10.2l4.5 1 4.5-1M12 11.2v3M12 14.2l-2.3 4M12 14.2l2.3 4" />
    </Icon>
  );
}

/** Help / walkthrough: a question mark in a ring (drawn, not a font glyph). */
export function HelpIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.4 9.4a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.3-2.6 3.8" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** A gentle nudge: a lightbulb. */
export function HintIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17.5h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z" />
    </Icon>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <Icon {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Icon>
  );
}

export function MicIcon(props) {
  return (
    <Icon {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </Icon>
  );
}

/** "What did they mean?" -- a speech bubble with a question mark. */
export function ExplainIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 20.5 11.5z" />
      <path d="M10 9.6a2.1 2.1 0 0 1 4 .7c0 1.4-2 1.7-2 2.9" />
      <circle cx="12" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}
