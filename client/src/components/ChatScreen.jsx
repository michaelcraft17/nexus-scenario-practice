import { useRef, useState, useEffect } from "react";
import { sendChatMessage, explainMessage as apiExplainMessage, getFeedback } from "../services/api.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageBubble from "./MessageBubble.jsx";
import FeedbackPanel from "./FeedbackPanel.jsx";

let nextId = 1;
function makeId() {
  return `m${nextId++}`;
}

/** Strip UI-only fields down to the {role, content} shape the API expects. */
function toApiShape(messages) {
  return messages.map(({ role, content }) => ({ role, content }));
}

export default function ChatScreen({ scenario, onExit }) {
  const [messages, setMessages] = useState(() => [
    { id: makeId(), role: "assistant", content: scenario.opener, isOpener: true },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, status: "idle", text: "" });

  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;

    const userMessage = { id: makeId(), role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInputValue("");
    setSendError(null);
    setSending(true);

    try {
      // Exclude the opener -- it was never a real API turn, so the history
      // sent to /api/chat always starts with role "user" as required.
      const historyForApi = toApiShape(updated.filter((m) => !m.isOpener));
      const { message: reply } = await sendChatMessage(scenario.id, historyForApi);
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: reply }]);
    } catch (err) {
      setSendError(err.message || "Something went wrong. Try sending again.");
    } finally {
      setSending(false);
    }
  }

  async function handleExplain(message) {
    const index = messages.findIndex((m) => m.id === message.id);
    const contextMessages = toApiShape(messages.slice(0, index + 1));
    const { explanation } = await apiExplainMessage(scenario.id, contextMessages, message.content);
    return explanation;
  }

  async function handleGetFeedback() {
    setFeedback({ open: true, status: "loading", text: "" });
    try {
      const { feedback: text } = await getFeedback(scenario.id, toApiShape(messages));
      setFeedback({ open: true, status: "done", text });
    } catch (err) {
      setFeedback({ open: true, status: "error", text: err.message || "Couldn't get feedback right now." });
    }
  }

  const canGetFeedback = messages.some((m) => m.role === "user");

  return (
    <div className="chat-screen">
      <ChatHeader
        scenario={scenario}
        onExit={onExit}
        onGetFeedback={handleGetFeedback}
        feedbackDisabled={!canGetFeedback}
      />

      <div className="chat-screen__scroll" ref={scrollRef}>
        <div
          className="chat-screen__scene"
          style={{ backgroundColor: scenario.color }}
        >
          <div className="chat-screen__scene-text">{scenario.setting}</div>
        </div>

        <div className="chat-screen__messages">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              aiRole={scenario.aiRole}
              onExplain={handleExplain}
            />
          ))}
          {sending && (
            <div className="bubble-row bubble-row--assistant">
              <div className="bubble bubble--typing">...</div>
            </div>
          )}
        </div>
      </div>

      {sendError && <div className="chat-screen__error">{sendError}</div>}

      <form className="chat-screen__input" onSubmit={handleSend}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your reply..."
          disabled={sending}
          aria-label="Your reply"
        />
        <button type="submit" disabled={sending || !inputValue.trim()}>
          Send
        </button>
      </form>

      <FeedbackPanel
        open={feedback.open}
        status={feedback.status}
        feedback={feedback.text}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      />
    </div>
  );
}
