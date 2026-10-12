import { isReducedMotion } from "../a11y/motion.js";

// Deliberately slower message movement, as requested; other UI timings stay independent.
const SEND_MS = 750;
const REPLY_MS = 700;

/** Morph the bubble's outline, keeping its words at their final size. The
 * overlay escapes the thread's clipping and follows its destination during
 * scrolling. Only the real bubble participates in accessibility and layout. */
export function animateMessageArrival(bubble, from, { outgoing = false, extras = [], followNewest = true } = {}) {
  if (isReducedMotion()) return undefined;
  const scroll = bubble.closest(".chat-screen__scroll");
  // Settle the thread before measuring the landing point. Smooth scrolling
  // can otherwise outlast the flight and make the bubble jump on arrival.
  if (scroll && followNewest) scroll.scrollTop = scroll.scrollHeight;
  const target = bubble.getBoundingClientRect();
  if (!target.width || !target.height || !from.width || !from.height) return undefined;
  const viewport = scroll?.getBoundingClientRect();
  // A reply to a reader looking at older messages must not fly over them.
  if (viewport && (target.top >= viewport.bottom || target.bottom <= viewport.top)) return undefined;

  const host = bubble.closest(".chat-screen") || document.body;
  const overlay = document.createElement("div");
  overlay.className = `${bubble.parentElement.className} bubble-flight`;
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  Object.assign(overlay.style, {
    position: "fixed", left: "0", top: "0", margin: "0", padding: "0",
    display: "block", width: `${target.width}px`, height: `${target.height}px`,
    zIndex: "60", pointerEvents: "none", overflow: "hidden",
    borderRadius: getComputedStyle(bubble).borderRadius,
  });
  const shell = bubble.cloneNode(false);
  const words = bubble.cloneNode(true);
  for (const layer of [shell, words]) {
    Object.assign(layer.style, {
      position: "absolute", left: "0", top: "0", maxWidth: "none",
      margin: "0", boxSizing: "border-box", animation: "none", transition: "none",
    });
    overlay.appendChild(layer);
  }
  Object.assign(shell.style, { width: "100%", height: "100%", minHeight: "0", padding: "0" });
  Object.assign(words.style, { background: "transparent", borderColor: "transparent", boxShadow: "none" });
  host.appendChild(overlay);
  // html zoom changes the relationship between CSS and viewport pixels.
  const zoom = overlay.getBoundingClientRect().width / target.width || 1;
  words.style.width = `${target.width / zoom}px`;
  words.style.height = `${target.height / zoom}px`;

  const visibility = bubble.style.visibility;
  const extraOpacity = extras.map((el) => el.style.opacity);
  bubble.style.visibility = "hidden";
  const begin = performance.now();
  const duration = outgoing ? SEND_MS : REPLY_MS;
  let frameId = 0;
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frameId);
    overlay.remove();
    bubble.style.visibility = visibility;
    extras.forEach((el, i) => { el.style.opacity = extraOpacity[i]; });
  }
  function frame() {
    if (isReducedMotion() || !bubble.isConnected) { finish(); return; }
    const t = Math.min(1, (performance.now() - begin) / duration);
    // A gentle start as well as finish makes the longer movement calmer.
    const e = t * t * (3 - 2 * t);
    const to = bubble.getBoundingClientRect();
    const width = from.width + (to.width - from.width) * e;
    const height = from.height + (to.height - from.height) * e;
    const x = from.left + (to.left - from.left) * e;
    const y = from.top + (to.top - from.top) * e;
    Object.assign(overlay.style, {
      width: `${width / zoom}px`, height: `${height / zoom}px`,
      transform: `translate(${x / zoom}px, ${y / zoom}px)`,
    });
    // The outline grows independently; words fade without scaling or rewrap.
    const ink = outgoing ? 0.65 + 0.35 * e : Math.min(1, Math.max(0, (t - 0.2) / 0.7));
    words.style.opacity = String(ink);
    extras.forEach((el) => { el.style.opacity = String(ink); });
    if (t >= 1) finish();
    else frameId = requestAnimationFrame(frame);
  }
  frame();
  return finish;
}
