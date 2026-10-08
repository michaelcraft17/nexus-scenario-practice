import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

// 8, not more: neighbouring header buttons are only 8px apart, and a bigger
// frame around Hint would overlap Accessibility next to it.
const PADDING = 8;
// Keep the spotlight this far inside the screen edge, so a wide target
// (a full-width reply box) gets a frame that's visible on both sides
// instead of one that runs off the screen.
const EDGE_INSET = 6;
const MAX_CORNER_RADIUS = 28;
const CALLOUT_WIDTH = 280;
const CALLOUT_MARGIN = 16;
// The ripples that pulse out from the spotlight: how far each travels, and
// how many are in flight at once.
const WAVE_SPREAD = 18;
const WAVE_COUNT = 3;
const WAVE_SECONDS = 2.1;
// Room left between a side-placed callout and its target, for the wavy
// pointer (and the ripples) to show in.
const SIDE_GAP = 76;

/**
 * A gently wavy line from (x1, y1) to (x2, y2) -- the callout's pointer. The
 * wave fades out toward both ends (a sine envelope), so it leaves the callout
 * cleanly and the arrowhead at the target end still points straight in.
 */
function wavyPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const nx = -dy / length;
  const ny = dx / length;
  const amplitude = Math.min(6, length / 10);
  const waves = Math.max(1, Math.round(length / 26));
  const points = [];
  const samples = Math.max(12, Math.round(length / 3));
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const offset = amplitude * Math.sin(Math.PI * t) * Math.sin(2 * Math.PI * waves * t);
    points.push(`${(x1 + dx * t + nx * offset).toFixed(1)} ${(y1 + dy * t + ny * offset).toFixed(1)}`);
  }
  return `M ${points.join(" L ")}`;
}

/**
 * A dashed-circle-and-arrow coach-mark walkthrough -- spotlights one real
 * DOM element at a time (found live via CSS selector, not a screenshot or
 * a copy of the UI), dims everything else, and points a dashed arrow from
 * a text callout at it. Generic/reusable: ScenarioPicker and ChatScreen
 * each pass their own step list and localStorage key, so "first-run
 * onboarding" isn't duplicated per screen.
 *
 * Only ever shows once per storageKey (persisted in localStorage) unless
 * explicitly replayed -- see each caller's own "?" replay trigger.
 *
 * Step options beyond target/title/text:
 *   opensAccessibilityMenu -- opens the Accessibility menu for this step
 *     (and closes it again on the way out), so the walkthrough can show it.
 *   placement: "left" -- put the callout beside the target rather than
 *     above/below it; for tall targets like that full-height menu.
 */
export default function TutorialOverlay({ steps, storageKey, active }) {
  const { resolvedMotion, openPanel, closePanel } = useAccessibility();
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });
  const [rect, setRect] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  // The callout's real rendered height (real screen pixels), measured after
  // layout. Its text length varies by step and grows with the user's text-size
  // setting, so placement can't assume a fixed height -- doing that pushed the
  // Next button off the bottom of the screen once a step's text got long.
  const calloutRef = useRef(null);
  const [calloutHeight, setCalloutHeight] = useState(0);

  const running = active && !dismissed;
  const step = steps[stepIndex];

  const opensMenu = running && Boolean(step?.opensAccessibilityMenu);
  useEffect(() => {
    if (!opensMenu) return undefined;
    openPanel();
    return () => closePanel();
  }, [opensMenu, stepIndex, openPanel, closePanel]);

  // Polls for the target element rather than assuming it's already in the
  // DOM -- scenario cards/mission badge/etc. all depend on data that loads
  // asynchronously, so the very first step's target often doesn't exist
  // yet at mount.
  useEffect(() => {
    if (!running || !step) return undefined;
    setRect(null);

    let cancelled = false;
    function measure() {
      if (cancelled) return;
      const el = document.querySelector(step.target);
      if (el) {
        // Each step scrolls its own target into view -- without this, a
        // target below the fold (e.g. the "Start scenario" button on a
        // tall card) would spotlight a spot the user can't actually see.
        // The scroll listener below keeps re-measuring as it animates, so
        // the ring visibly travels into place along with it.
        el.scrollIntoView({ block: "center", behavior: resolvedMotion === "reduce" ? "auto" : "smooth" });
        setRect(el.getBoundingClientRect());
        // Follow a target that's still sliding into place (the
        // Accessibility menu animates in) for a moment after it appears.
        const settleUntil = performance.now() + 500;
        const follow = () => {
          if (cancelled) return;
          setRect(el.getBoundingClientRect());
          if (performance.now() < settleUntil) requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);
      } else {
        setTimeout(measure, 150);
      }
    }
    measure();

    function onViewportChange() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const el = document.querySelector(step.target);
      if (el) setRect(el.getBoundingClientRect());
    }
    onViewportChange();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [running, step]);

  useLayoutEffect(() => {
    const el = calloutRef.current;
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    setCalloutHeight((prev) => (Math.abs(prev - height) > 1 ? height : prev));
  }, [running, rect, stepIndex, viewport.width, viewport.height]);

  function finish() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore -- worst case the tutorial reappears next visit, not fatal.
    }
    setDismissed(true);
  }

  function next() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  if (!running || !rect) return null;

  // The spotlight is a rounded rectangle hugging the target (padded, floored
  // so a tiny target still gets a legible frame, and clamped to stay on
  // screen). It used to be an ellipse sized from the target's half-width and
  // half-height, which for anything wide and flat -- the reply box, the row
  // of starter replies -- turned into a huge flattened oval that ran off both
  // screen edges. Small targets like the Hint button still come out pill-shaped:
  // the corner radius is capped by half the frame's shorter side.
  const halfW = Math.max(rect.width / 2 + PADDING, 30);
  const halfH = Math.max(rect.height / 2 + PADDING, 30);
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const hlLeft = Math.max(EDGE_INSET, centerX - halfW);
  const hlRight = Math.min(viewport.width - EDGE_INSET, centerX + halfW);
  const hlTop = Math.max(EDGE_INSET, centerY - halfH);
  const hlBottom = Math.min(viewport.height - EDGE_INSET, centerY + halfH);
  const cx = (hlLeft + hlRight) / 2;
  const cy = (hlTop + hlBottom) / 2;
  const rx = (hlRight - hlLeft) / 2;
  const ry = (hlBottom - hlTop) / 2;
  const cornerRadius = Math.min(MAX_CORNER_RADIUS, rx, ry);

  // Before the first measurement, fall back to the old fixed guess (a layout
  // effect re-runs this synchronously, before paint, once the real height is
  // known). Then: prefer whichever side has room for the whole callout, and
  // always clamp so it stays fully on screen whatever side it ends up on.
  const calloutH = calloutHeight || 200;
  const placeLeft = step.placement === "left" && hlLeft - SIDE_GAP >= CALLOUT_WIDTH + CALLOUT_MARGIN;
  const roomBelow = viewport.height - (cy + ry);
  const placeBelow = placeLeft || roomBelow > calloutH + 18 || cy - ry < calloutH + 18;
  const calloutTopRaw = placeLeft
    ? Math.max(CALLOUT_MARGIN, Math.min(viewport.height * 0.38 - calloutH / 2, viewport.height - calloutH - CALLOUT_MARGIN))
    : placeBelow
      ? Math.max(CALLOUT_MARGIN, Math.min(cy + ry + 18, viewport.height - calloutH - CALLOUT_MARGIN))
      : undefined;
  const calloutBottomRaw = placeBelow
    ? undefined
    : Math.max(CALLOUT_MARGIN, Math.min(viewport.height - (cy - ry) + 18, viewport.height - calloutH - CALLOUT_MARGIN));
  const calloutLeftRaw = placeLeft
    ? hlLeft - SIDE_GAP - CALLOUT_WIDTH
    : Math.max(CALLOUT_MARGIN, Math.min(cx - CALLOUT_WIDTH / 2, viewport.width - CALLOUT_WIDTH - CALLOUT_MARGIN));

  // getBoundingClientRect() (what `rect`/cx/cy/rx/ry above come from) reports
  // true post-zoom screen pixels. But this app runs with `zoom` set on
  // <html> by default (see AccessibilityContext.jsx -- "default" text size
  // is already 1.15, not 1, and it's meant to scale everything, not just
  // text), and the browser separately re-multiplies almost anything sized
  // or positioned in raw CSS pixels by that same factor again when it
  // renders -- so numbers already measured in real screen pixels need to be
  // *divided* by zoom before being handed back to the browser as a size or
  // offset, or they land 15-45% further down/right (or bigger) than
  // intended. This is the same --zoom-factor compensation this app already
  // uses for other things (see .chat-screen's 100dvh height), applied here
  // to two different targets:
  const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zoom-factor")) || 1;
  // 1) the callout's own inline top/left/bottom (a position:fixed element's
  //    offsets get re-multiplied on render):
  const calloutTop = calloutTopRaw === undefined ? undefined : calloutTopRaw / zoom;
  const calloutBottom = calloutBottomRaw === undefined ? undefined : calloutBottomRaw / zoom;
  const calloutLeft = calloutLeftRaw / zoom;
  // 2) the <svg>'s own width/height attributes below (without this, the
  //    SVG's rendered box itself ends up zoom% bigger than intended while
  //    its viewBox-mapped coordinate space stays at the un-zoomed numbers,
  //    silently stretching every cx/cy/rx/ry in it by the same factor --
  //    confirmed empirically: the ring landed ~130px too low on a 900px
  //    screen before this was added, invisibly below the fold).

  let arrowStartX = calloutLeftRaw + CALLOUT_WIDTH / 2;
  let arrowStartY = placeBelow ? (calloutTopRaw ?? 0) - 2 : viewport.height - (calloutBottomRaw ?? 0) + 2;
  let arrowEndY = placeBelow ? cy + ry : cy - ry;
  // Land the arrow on the frame's edge as directly below/above the callout as
  // the frame allows, rather than swooping to the middle of a wide frame.
  let arrowEndX = Math.min(Math.max(arrowStartX, hlLeft + cornerRadius), hlRight - cornerRadius);
  if (placeLeft) {
    // Beside the target: from the callout's right edge straight across.
    arrowStartX = calloutLeftRaw + CALLOUT_WIDTH + 2;
    arrowStartY = (calloutTopRaw ?? 0) + Math.min(calloutH / 2, 60);
    arrowEndX = hlLeft - 4;
    arrowEndY = Math.min(Math.max(arrowStartY, hlTop + cornerRadius), hlBottom - cornerRadius);
  }
  // On a narrow screen a tall target (the Accessibility menu) leaves no room
  // beside or around it, so the callout ends up sitting on it -- no pointer
  // then; it would just dangle off the callout's edge.
  const calloutTopEdge = calloutTopRaw ?? viewport.height - (calloutBottomRaw ?? 0) - calloutH;
  const calloutOnTarget =
    calloutLeftRaw < hlRight &&
    calloutLeftRaw + CALLOUT_WIDTH > hlLeft &&
    calloutTopEdge < hlBottom &&
    calloutTopEdge + calloutH > hlTop;
  const animateWaves = resolvedMotion !== "reduce";

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Getting started walkthrough">
      {/* width/height are zoom-divided (see the `zoom` compensation above)
          so the rendered box is exactly viewport.width x viewport.height
          real pixels; viewBox then maps that same range of *logical* units
          onto it 1:1, so cx/cy/rx/ry below -- all real screen pixels from
          getBoundingClientRect() -- land exactly where they're measured to
          be, regardless of zoom. */}
      <svg
        className="tutorial-overlay__svg"
        width={viewport.width / zoom}
        height={viewport.height / zoom}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        <defs>
          <mask id={`${storageKey}-spotlight`}>
            <rect x="0" y="0" width={viewport.width} height={viewport.height} fill="white" />
            <rect x={hlLeft} y={hlTop} width={hlRight - hlLeft} height={hlBottom - hlTop} rx={cornerRadius} fill="black" />
          </mask>
          <marker id={`${storageKey}-arrowhead`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8" fill="none" stroke="var(--tutorial-accent, var(--color-primary))" strokeWidth="1.6" />
          </marker>
        </defs>
        <rect
          x="0"
          y="0"
          width={viewport.width}
          height={viewport.height}
          fill="rgba(20, 18, 27, 0.5)"
          mask={`url(#${storageKey}-spotlight)`}
          className="tutorial-overlay__scrim"
        />
        <rect
          x={hlLeft}
          y={hlTop}
          width={hlRight - hlLeft}
          height={hlBottom - hlTop}
          rx={cornerRadius}
          fill="none"
          stroke="var(--tutorial-accent, var(--color-primary))"
          strokeWidth="2.5"
          strokeDasharray="7 7"
          className="tutorial-overlay__ring"
        />
        {/* Waves: rounded frames that ripple out from the spotlight and
            fade, like rings on water, to draw the eye to it. A single
            still ring stands in for them with reduced motion. */}
        {animateWaves
          ? Array.from({ length: WAVE_COUNT }, (_, i) => (
              <rect
                key={i}
                className="tutorial-overlay__wave"
                x={hlLeft}
                y={hlTop}
                width={hlRight - hlLeft}
                height={hlBottom - hlTop}
                rx={cornerRadius}
                fill="none"
                stroke="var(--tutorial-accent, var(--color-primary))"
                opacity="0"
              >
                {[
                  ["x", hlLeft, hlLeft - WAVE_SPREAD],
                  ["y", hlTop, hlTop - WAVE_SPREAD],
                  ["width", hlRight - hlLeft, hlRight - hlLeft + WAVE_SPREAD * 2],
                  ["height", hlBottom - hlTop, hlBottom - hlTop + WAVE_SPREAD * 2],
                  ["rx", cornerRadius, cornerRadius + WAVE_SPREAD],
                  ["opacity", 0.75, 0],
                  ["stroke-width", 3, 0.6],
                ].map(([attr, from, to]) => (
                  <animate
                    key={attr}
                    attributeName={attr}
                    values={`${from};${to}`}
                    dur={`${WAVE_SECONDS}s`}
                    begin={`${(i * WAVE_SECONDS) / WAVE_COUNT}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.2 0.6 0.35 1"
                    keyTimes="0;1"
                  />
                ))}
              </rect>
            ))
          : (
              <rect
                x={hlLeft - WAVE_SPREAD / 2}
                y={hlTop - WAVE_SPREAD / 2}
                width={hlRight - hlLeft + WAVE_SPREAD}
                height={hlBottom - hlTop + WAVE_SPREAD}
                rx={cornerRadius + WAVE_SPREAD / 2}
                fill="none"
                stroke="var(--tutorial-accent, var(--color-primary))"
                strokeWidth="1.2"
                opacity="0.45"
              />
            )}
        {!calloutOnTarget && (
          <path
            className="tutorial-overlay__pointer"
            d={wavyPath(arrowStartX, arrowStartY, arrowEndX, arrowEndY)}
            fill="none"
            stroke="var(--tutorial-accent, var(--color-primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 6"
            markerEnd={`url(#${storageKey}-arrowhead)`}
          />
        )}
      </svg>

      <div
        ref={calloutRef}
        className="tutorial-overlay__callout"
        style={{
          // If even the clamped callout can't fit (a very small screen or a
          // very large text size), scroll inside it rather than run off.
          maxHeight: (viewport.height - CALLOUT_MARGIN * 2) / zoom,
          overflowY: "auto",
          left: calloutLeft,
          top: calloutTop,
          bottom: calloutBottom,
          // Same zoom compensation as left/top/bottom above -- width is
          // just as much an inline pixel value on this position:fixed
          // element, and gets re-multiplied by zoom on render the same way.
          width: CALLOUT_WIDTH / zoom,
        }}
      >
        <p className="tutorial-overlay__count">
          {stepIndex + 1} of {steps.length}
        </p>
        <h3 className="tutorial-overlay__title">{step.title}</h3>
        <p className="tutorial-overlay__text">{step.text}</p>
        <div className="tutorial-overlay__nav">
          <button type="button" className="tutorial-overlay__skip" onClick={finish}>
            Skip
          </button>
          <button type="button" className="tutorial-overlay__next" onClick={next}>
            {stepIndex === steps.length - 1 ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
