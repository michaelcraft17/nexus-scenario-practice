import { useRef, useState, useEffect } from "react";
import {
  sendChatMessage,
  explainMessage as apiExplainMessage,
  getFeedback,
  getHint,
} from "../services/api.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageBubble from "./MessageBubble.jsx";
import FeedbackPanel from "./FeedbackPanel.jsx";
import ResponseOptions from "./ResponseOptions.jsx";
import NarratorIntro from "./NarratorIntro.jsx";
import NarratorNote from "./NarratorNote.jsx";

let nextId = 1;
function makeId() {
  return `m${nextId++}`;
}

/** Real roleplay turns only -- excludes the Narrator's proactive asides,
 * which never go back to the API (their role isn't "user"/"assistant", so
 * the backend's message validation would reject them anyway). */
function isDialogueTurn(m) {
  return m.role === "user" || m.role === "assistant";
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
  const [hint, setHint] = useState({ open: false, status: "idle", text: "" });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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
      const historyForApi = toApiShape(updated.filter((m) => !m.isOpener && isDialogueTurn(m)));
      const { message: reply, narratorNote } = await sendChatMessage(scenario.id, historyForApi);
      setMessages((prev) => {
        const next = [...prev, { id: makeId(), role: "assistant", content: reply }];
        // The Narrator's proactive aside, when offered, follows the reply
        // it's commenting on. It's a separate message-list entry (not part
        // of the roleplay history) so it can never leak back into /api/chat.
        if (narratorNote) {
          next.push({ id: makeId(), role: "narrator", content: narratorNote });
        }
        return next;
      });
    } catch (err) {
      setSendError(err.message || "Something went wrong. Try sending again.");
    } finally {
      setSending(false);
    }
  }

  async function handleExplain(message) {
    const index = messages.findIndex((m) => m.id === message.id);
    const contextMessages = toApiShape(messages.slice(0, index + 1).filter(isDialogueTurn));
    const { explanation } = await apiExplainMessage(scenario.id, contextMessages, message.content);
    return explanation;
  }

  async function handleGetFeedback() {
    setFeedback({ open: true, status: "loading", text: "" });
    try {
      const { feedback: text } = await getFeedback(scenario.id, toApiShape(messages.filter(isDialogueTurn)));
      setFeedback({ open: true, status: "done", text });
    } catch (err) {
      setFeedback({ open: true, status: "error", text: err.message || "Couldn't get feedback right now." });
    }
  }

  async function handleHint() {
    setHint({ open: true, status: "loading", text: "" });
    try {
      // Includes whatever the user has already typed but not sent, so a
      // hint requested mid-draft still reflects where they're stuck.
      const draft = inputValue.trim()
        ? [...messages, { role: "user", content: inputValue.trim() }]
        : messages;
      const { hint: text } = await getHint(scenario.id, toApiShape(draft.filter(isDialogueTurn)));
      setHint({ open: true, status: "done", text });
    } catch (err) {
      setHint({ open: true, status: "error", text: err.message || "Couldn't get a hint right now." });
    }
  }

  function handlePickResponseOption(text) {
    setInputValue(text);
    inputRef.current?.focus();
  }

  const canGetFeedback = messages.some((m) => m.role === "user");
  const showResponseOptions = !messages.some((m) => m.role === "user") && !sending;

  return (
    <div className="chat-screen">
      <ChatHeader
        scenario={scenario}
        onExit={onExit}
        onGetFeedback={handleGetFeedback}
        feedbackDisabled={!canGetFeedback}
        onHint={handleHint}
      />

      <div className="chat-screen__scroll" ref={scrollRef}>
        <div
          className="chat-screen__scene"
          style={{ backgroundColor: scenario.color }}
        >
          <div className="chat-screen__scene-text">{scenario.setting}</div>
        </div>

        <NarratorIntro opening={scenario.narratorOpening} atmosphere={scenario.narratorAtmosphere} />

        <div className="chat-screen__messages">
          {messages.map((message) =>
            message.role === "narrator" ? (
              <NarratorNote key={message.id} text={message.content} />
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                aiRole={scenario.aiRole}
                onExplain={handleExplain}
              />
            )
          )}
          {sending && (
            <div className="bubble-row bubble-row--assistant">
              <div className="bubble bubble--typing">...</div>
            </div>
          )}
        </div>
      </div>

      {hint.open && (
        <div className={`hint-bar ${hint.status === "error" ? "hint-bar--error" : ""}`}>
          <div className="hint-bar__body">
            {hint.status === "loading" && <span>Thinking of a few directions...</span>}
            {hint.status !== "loading" && <span>&#128161; {hint.text}</span>}
          </div>
          <button
            className="hint-bar__close"
            onClick={() => setHint((h) => ({ ...h, open: false }))}
            aria-label="Dismiss hint"
          >
            &times;
          </button>
        </div>
      )}

      {sendError && <div className="chat-screen__error">{sendError}</div>}

      {showResponseOptions && (
        <ResponseOptions options={scenario.responseOptions} onPick={handlePickResponseOption} />
      )}

      <form className="chat-screen__input" onSubmit={handleSend}>
        <input
          ref={inputRef}
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
