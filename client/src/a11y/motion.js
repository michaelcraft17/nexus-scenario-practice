/**
 * One motion policy for everything JavaScript animates (message flights,
 * reply growth, staged narrator/mission reveals, panel closes). The CSS side
 * of the same policy is the --motion-* / --ease-* tokens in index.css and the
 * global [data-motion="reduce"] rule; keep these numbers in step with them.
 *
 * Read the preference at the moment motion would start -- not from a value
 * captured earlier in a closure -- so a change made while a reply is pending
 * still applies. Components that own running motion also watch
 * `resolvedMotion` from AccessibilityContext and finish it early when it
 * flips to "reduce".
 */
export const MOTION_MS = {
  /** Small state changes: hover, press, opacity swaps. */
  feedback: 140,
  /** Bubbles and inline content arriving. */
  content: 200,
  /** Panels, drawers and sheets. */
  panel: 220,
  /** Leaving a session / handing back to the picker. */
  handoff: 240,
  /** Gap between a reply and the narrator aside that follows it: each
   * arrives as the one before finishes fading in, with no extra wait. */
  revealGap: 200,
};

/** Restrained deceleration -- no overshoot anywhere in the app. */
export const EASE_OUT = "cubic-bezier(0.2, 0, 0, 1)";

export function isReducedMotion() {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-motion") === "reduce";
}
