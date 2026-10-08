import { useLayoutEffect, useRef, useState } from "react";
import HoverWords from "./HoverWords.jsx";
import NarratorFontToggle from "./NarratorFontToggle.jsx";

const GROW_MS = 380;
const GROW_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

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
