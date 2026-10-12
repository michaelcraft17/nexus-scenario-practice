import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { ExplainIcon } from "./icons.jsx";
import { isReducedMotion } from "../a11y/motion.js";
import { animateMessageArrival } from "./messageArrival.js";
import HoverWords from "./HoverWords.jsx";
import NarratorFontToggle from "./NarratorFontToggle.jsx";

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

export default function MessageBubble({ message, npcName, npcRole, onExplain, showExplain = true, followNewest = true }) {
  const isAssistant = message.role === "assistant";
  const { resolvedMotion } = useAccessibility();
  const bubbleRef = useRef(null);
  const explainRef = useRef(null);
  // Ends whichever arrival animation is still running, at its final state.
  const finishMotionRef = useRef(null);

  // Mount only: a reply grows out of the typing bubble it replaced (the
  // position and size ChatScreen measured just before swapping them), or your own
  // message rises out of the text box (ChatScreen measured the box just
  // before sending). The preference is re-read here, at the moment the
  // motion would start, not taken from when the message was sent.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble || isReducedMotion()) return undefined;
    if (message.arriveFrom) {
      finishMotionRef.current = animateMessageArrival(bubble, message.arriveFrom, {
        extras: [explainRef.current].filter(Boolean), followNewest,
      });
    } else if (message.launchFrom) {
      finishMotionRef.current = animateMessageArrival(bubble, message.launchFrom, { outgoing: true, followNewest });
    }
    return () => finishMotionRef.current?.();
  }, []);

  // Reduce motion switched on while this bubble was still arriving: jump to
  // the end now rather than finishing the flourish.
  useEffect(() => {
    if (resolvedMotion === "reduce") finishMotionRef.current?.();
  }, [resolvedMotion]);
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
            <ExplainIcon />
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
