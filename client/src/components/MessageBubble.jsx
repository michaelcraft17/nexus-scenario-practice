import { useState } from "react";

export default function MessageBubble({ message, npcName, onExplain }) {
  const isAssistant = message.role === "assistant";
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
      <div className="bubble">
        {isAssistant && <div className="bubble__speaker">{npcName}</div>}
        <div className="bubble__text">{message.content}</div>
      </div>

      {isAssistant && (
        <div className="bubble__explain">
          <button className="bubble__explain-button" onClick={handleExplainClick}>
            {status === "loading" ? "Explaining..." : "Explain that"}
          </button>

          {expanded && status !== "loading" && (
            <div className={`bubble__explanation ${status === "error" ? "bubble__explanation--error" : ""}`}>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
