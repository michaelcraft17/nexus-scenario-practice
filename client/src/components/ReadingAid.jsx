import { useEffect, useRef } from "react";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";

const BAND_HEIGHT = 120;

// The Reading Guide's geometry, in px (mirrored in a11y.css's .ra-guide):
// a 512x12 bar -- a 506x6 black core plus a 3px yellow ring on every side --
// centred on the pointer and sitting GUIDE_LIFT above it. On a screen too
// narrow for that (phones), the bar shrinks to fit with GUIDE_MARGIN on each
// side and stays centred, tracking only the pointer's height: following the
// finger sideways would just push most of a near-full-width bar off-screen.
const GUIDE_WIDTH = 512;
const GUIDE_RING = 3;
const GUIDE_LIFT = 15;
const GUIDE_MARGIN = 8;

/**
 * Reading Mask (dims everything except a band around the pointer) and
 * Reading Guide (a black bar with a yellow outline and an arrow, centred on
 * and just above the pointer) -- the two "Cursor" tile steps that need a
 * live overlay rather than just CSS. Restyled to match the Accessibility
 * Mapper's guide (commit 0b636f4), itself modelled on UserWay's.
 * Follows the mouse, or the finger on touch screens. Styling lives in
 * a11y/a11y.css (.ra-mask, .ra-guide).
 */
export default function ReadingAid() {
  const { prefs } = useAccessibility();
  const mode = prefs.cursor;
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const guideRef = useRef(null);

  useEffect(() => {
    if (mode !== "mask" && mode !== "guide") return;
    const move = (x, y) => {
      if (mode === "mask" && topRef.current && bottomRef.current) {
        topRef.current.style.height = `${Math.max(0, y - BAND_HEIGHT / 2)}px`;
        bottomRef.current.style.top = `${y + BAND_HEIGHT / 2}px`;
      } else if (mode === "guide" && guideRef.current) {
        // transform (not top/left) keeps this cheap on every mouse move.
        // The element is the black core; the ring is a box-shadow outside
        // it, so the outer box's top-left is (RING) up and left of it.
        const outerWidth = Math.min(GUIDE_WIDTH, window.innerWidth - GUIDE_MARGIN * 2);
        const left = outerWidth < GUIDE_WIDTH ? (window.innerWidth - outerWidth) / 2 : x - outerWidth / 2;
        guideRef.current.style.transform = `translate(${left + GUIDE_RING}px, ${y - GUIDE_LIFT + GUIDE_RING}px)`;
      }
    };
    const onMouse = (e) => move(e.clientX, e.clientY);
    const onTouch = (e) => {
      if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
    };
    move(window.innerWidth / 2, window.innerHeight / 2);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [mode]);

  // Each mode's elements get their own keys so switching modes remounts them.
  // Without that, React reuses the mask's first <div> for the guide (same
  // element type, same position), and the height the mask set on it directly
  // via ref sticks around as an inline style -- turning the guide into a
  // huge box.
  if (mode === "mask") {
    return (
      <>
        <div key="mask-top" ref={topRef} className="ra-mask" style={{ top: 0 }} aria-hidden="true" />
        <div key="mask-bottom" ref={bottomRef} className="ra-mask" style={{ bottom: 0 }} aria-hidden="true" />
      </>
    );
  }
  if (mode === "guide") {
    return <div key="guide" ref={guideRef} className="ra-guide" aria-hidden="true" />;
  }
  return null;
}
