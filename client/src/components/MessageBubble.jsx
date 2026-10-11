import { useLayoutEffect, useRef, useState } from "react";
import HoverWords from "./HoverWords.jsx";
import NarratorFontToggle from "./NarratorFontToggle.jsx";

const GROW_MS = 380;
const GROW_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const FLY_MS = 460;

/**
 * Your own message leaving the text box: a small copy of the bubble starts
 * over the box you typed in, then rises and swells into the bubble's real
 * place in the conversation. The copy is fixed-position over the whole
 * screen (the real bubble sits in a scrolling area that would clip it on
 * the way up), and it re-reads the real bubble's position every frame, so
 * it still lands right while the conversation scrolls down to make room.
 * The real bubble stays hidden until the copy arrives.
 * Returns a cleanup that ends the flight early.
 */
function flyFrom(bubble, from) {
  const host = bubble.closest(".chat-screen") || document.body;
  const target = bubble.getBoundingClientRect();
  if (!target.width || !target.height) return undefined;

  const ghostRow = document.createElement("div");
  ghostRow.className = `${bubble.parentElement.className} bubble-flight`;
  ghostRow.setAttribute("aria-hidden", "true");
  const ghost = bubble.cloneNode(true);
  ghostRow.appendChild(ghost);
  Object.assign(ghostRow.style, {
    position: "fixed",
    left: "0",
    top: "0",
    margin: "0",
    padding: "0",
    display: "block",
    width: `${target.width}px`,
    height: `${target.height}px`,
    zIndex: "60",
    pointerEvents: "none",
    transformOrigin: "center",
  });
  Object.assign(ghost.style, { width: "100%", height: "100%", maxWidth: "none", margin: "0", animation: "none" });
  host.appendChild(ghostRow);

  // The page is zoomed (html zoom), so CSS px and on-screen px differ --
  // measure the ratio once and convert every position through it.
  const k = ghostRow.getBoundingClientRect().width / target.width || 1;
  ghostRow.style.width = `${target.width / k}px`;
  ghostRow.style.height = `${target.height / k}px`;

  // Start: a small bubble over the right-hand part of the text box, where
  // your own messages end up.
  const startX = from.left + from.width * 0.7;
  const startY = from.top + from.height / 2;
  const s0 = Math.max(0.3, Math.min(0.55, (from.height * 0.9) / target.height));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

  bubble.style.visibility = "hidden";
  const begin = performance.now();
  let timer = 0;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    ghostRow.remove();
    bubble.style.visibility = "";
  }

  function frame() {
    const t = Math.min(1, (performance.now() - begin) / FLY_MS);
    const to = bubble.getBoundingClientRect();
    const toX = to.left + to.width / 2;
    const toY = to.top + to.height / 2;
    const e = easeOut(t);
    const x = startX + (toX - startX) * e;
    const y = startY + (toY - startY) * e;
    const scale = s0 + (1 - s0) * easeOutBack(t);
    ghostRow.style.transform = `translate(${(x - to.width / 2) / k}px, ${(y - to.height / 2) / k}px) scale(${scale})`;
    ghostRow.style.opacity = String(0.7 + 0.3 * Math.min(1, t * 2));
    if (t >= 1) finish();
    else timer = setTimeout(frame, 16);
  }

  frame();
  return finish;
}

/**
 * A reply arriving from the typing indicator: the bubble starts at the
 * typing bubble's size and grows to its own, then the words fade in. Scale
 * rather than width/height so nothing reflows mid-animation; the text stays
 * hidden while it's stretched.
 */
function growFrom(bubble, extras, from) {
  const to = bubble.getBoundingClientRect();
  if (!to.width || !to.height) return;
  const sx = Math.min(1, from.width / to.width);
  const sy = Math.min(1, from.height / to.height);
  bubble.animate([{ transform: `scale(${sx}, ${sy})` }, { transform: "none" }], {
    duration: GROW_MS,
    easing: GROW_EASING,
  });
  for (const el of extras) {
    el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 260,
      delay: GROW_MS - 80,
      easing: "ease-out",
      fill: "backwards",
    });
  }
}

/** Who's talking, on the character's own bubbles: initial avatar, name, and
 * their role in the scene (e.g. "Cashier"). */
export function NpcSpeaker({ name, role }) {
  return (
    <div className="bubble__speaker bubble__speaker--npc">
      <span className="bubble__avatar" aria-hidden="true">
        {name.charAt(0)}
      </span>
      <span className="bubble__name">{name}</span>
      {role && <span className="bubble__role">{role}</span>}
    </div>
  );
}

export default function MessageBubble({ message, npcName, npcRole, onExplain, showExplain = true }) {
  const isAssistant = message.role === "assistant";
  const bubbleRef = useRef(null);
  const explainRef = useRef(null);

  // Mount only: a reply grows out of the typing bubble it replaced (the
  // size ChatScreen measured just before swapping them).
  useLayoutEffect(() => {
    if (!message.arriveFrom || !bubbleRef.current?.animate) return;
    const bubble = bubbleRef.current;
    growFrom(bubble, [...bubble.children, explainRef.current].filter(Boolean), message.arriveFrom);
  }, []);

  // Mount only: your own message flies up out of the text box (ChatScreen
  // measured the box just before sending).
  useLayoutEffect(() => {
    if (!message.launchFrom || !bubbleRef.current) return undefined;
    return flyFrom(bubbleRef.current, message.launchFrom);
  }, []);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [explanation, setExplanation] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function handleExplainClick() {
    if (status === "done") {
      setExpanded((e) => !e);
      return;
    }

    setStatus("loading");
    setExpanded(true);
    try {
      const text = await onExplain(message);
      setExplanation(text);
      setStatus("done");
    } catch (err) {
      setExplanation(err.message || "Couldn't get an explanation right now.");
      setStatus("error");
    }
  }

  return (
    <div className={`bubble-row ${isAssistant ? "bubble-row--assistant" : "bubble-row--user"}`}>
      <div className={`bubble${message.arriveFrom ? " bubble--arriving" : ""}`} ref={bubbleRef}>
        {isAssistant ? <NpcSpeaker name={npcName} role={npcRole} /> : <div className="bubble__speaker">You</div>}
        <div className="bubble__text">{message.content}</div>
      </div>

      {isAssistant && showExplain && (
        <div className="bubble__explain" ref={explainRef}>
          <button
            className="bubble__explain-button"
            onClick={handleExplainClick}
            aria-expanded={status === "done" || status === "error" ? expanded : undefined}
          >
            {/* Speech bubble with a question mark: "what did they mean?" */}
            <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.8A8.4 8.4 0 1 1 21 11.5z" />
              <path d="M9.6 9.2a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2.2-2.4 3.4" />
              <path d="M12 16.4h.01" />
            </svg>
            {status === "loading" ? "Explaining..." : "Explain that"}
          </button>

          {expanded && status !== "loading" && (
            <div className={`bubble__explanation ${status === "error" ? "bubble__explanation--error" : ""}`}>
              {status === "error" ? (
                explanation
              ) : (
                <>
                  <HoverWords text={explanation} /> <NarratorFontToggle className="narrator-font-toggle--inline" />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
