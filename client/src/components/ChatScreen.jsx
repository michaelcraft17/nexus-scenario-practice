import { useRef, useState, useEffect } from "react";
import {
  sendChatMessage,
  explainMessage as apiExplainMessage,
  getReflection,
  getHint,
} from "../services/api.js";
import { useAccessibility } from "../a11y/AccessibilityContext.jsx";
import { saveReflectionToHistory } from "../services/reflectionHistory.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageBubble from "./MessageBubble.jsx";
import ReflectionPanel from "./ReflectionPanel.jsx";
import ResponseOptions from "./ResponseOptions.jsx";
import NarratorIntro from "./NarratorIntro.jsx";
import NarratorNote from "./NarratorNote.jsx";
import MissionBar from "./MissionBar.jsx";

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

export default function ChatScreen({ scenario, difficulty, difficultyGoal, onExit }) {
  const { resolvedMotion, registerReadableContent } = useAccessibility();
  const [messages, setMessages] = useState(() => [
    { id: makeId(), role: "assistant", content: scenario.opener, isOpener: true },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [reflection, setReflection] = useState({ open: false, status: "idle", data: null, errorMessage: "" });
  const [hint, setHint] = useState({ open: false, status: "idle", text: "" });
  // Template event ids the Narrator has already used this session, so the
  // same beat doesn't repeat turn after turn while others are available.
  const [firedEventIds, setFiredEventIds] = useState([]);
  // The mission panel's current state -- stage 1 to start, recomputed fresh
  // by the server every turn (see routes/api.js resolveMission) rather than
  // diffed incrementally client-side.
  const [mission, setMission] = useState(scenario.mission ?? null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const autoReflectedRef = useRef(false);

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const npcName = scenario.aiRole.split(" (")[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: resolvedMotion === "reduce" ? "auto" : "smooth",
    });
  }, [messages, sending, resolvedMotion]);

  // "Read aloud" on this screen reads the scene setting plus the
  // conversation so far, in order -- the chat equivalent of the picker's
  // resource list. Narrator asides are included since they carry scene
  // context a screen-reader-style read-aloud shouldn't skip.
  useEffect(() => {
    return registerReadableContent(() => {
      const parts = [scenario.setting, scenario.narratorOpening, scenario.narratorAtmosphere];
      if (mission) {
        parts.push(`Current mission: ${mission.missionText}`);
        parts.push(...mission.objectives.map((o) => `${o.completed ? "Completed" : "Not yet done"}: ${o.text}`));
      }
      for (const m of messages) {
        if (m.role === "narrator") {
          parts.push(m.content);
        } else if (m.role === "assistant") {
          parts.push(m.isOpener ? m.content : `${npcName} said: ${m.content}`);
        } else if (m.role === "user") {
          parts.push(`You said: ${m.content}`);
        }
      }
      return parts.filter(Boolean).join(" ");
    });
  }, [messages, scenario, registerReadableContent, npcName, mission]);

  // Auto-open the Reflection once the whole mission is done -- the final
  // authored stage, every objective on it checked off -- rather than on a
  // fixed turn count or a manual button (there is no manual trigger
  // anymore; finishing the mission is the only way to see it). Guarded by
  // a ref so it only ever fires once per session.
  const missionComplete = Boolean(mission?.isFinalStage && mission.objectives.every((o) => o.completed));
  useEffect(() => {
    if (!autoReflectedRef.current && missionComplete) {
      autoReflectedRef.current = true;
      handleReflect();
    }
  }, [missionComplete]);

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
      const { message: reply, event, narratorNote, mission: updatedMission } = await sendChatMessage(
        scenario.id,
        historyForApi,
        {
          difficulty,
          firedEventIds,
          activeMissionStageId: mission?.stageId,
          completedObjectiveIds: mission?.objectives.filter((o) => o.completed).map((o) => o.id),
        }
      );
      // A new mission stage is its own "Mission Updated" moment in the chat
      // feed, on top of the persistent MissionBar refreshing -- surfaced
      // before the reply, same ordering reasoning as a scene event below.
      const missionAdvanced = updatedMission && updatedMission.stageId !== mission?.stageId;
      setMessages((prev) => {
        const next = [...prev];
        // A scene event (atmosphere shift, or another NPC chiming in) is
        // narrated *before* the reply it set up -- it's a pre-built beat
        // from the scenario's event library, not something the model
        // invented, and it gives the NPC's line a natural segue.
        if (event) {
          next.push({ id: makeId(), role: "narrator", content: event.text });
        }
        if (missionAdvanced) {
          next.push({ id: makeId(), role: "narrator", content: updatedMission.missionText, variant: "mission" });
        }
        next.push({ id: makeId(), role: "assistant", content: reply });
        // The Narrator's proactive aside, when offered, follows the reply
        // it's commenting on. Neither this nor the event above ever leaks
        // back into /api/chat -- narrator-role entries are filtered out of
        // every payload the app sends.
        if (narratorNote) {
          next.push({ id: makeId(), role: "narrator", content: narratorNote });
        }
        return next;
      });
      if (event) {
        setFiredEventIds((prev) => [...prev, event.id]);
      }
      // The mission-tracking call is a non-fatal nice-to-have server-side --
      // on failure it comes back null, so keep whatever mission state is
      // already showing rather than clearing the panel.
      if (updatedMission) {
        setMission(updatedMission);
      }
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

  async function handleReflect() {
    setReflection({ open: true, status: "loading", data: null, errorMessage: "" });
    try {
      const data = await getReflection(scenario.id, toApiShape(messages.filter(isDialogueTurn)));
      setReflection({ open: true, status: "done", data, errorMessage: "" });
      saveReflectionToHistory({ scenarioId: scenario.id, scenarioTitle: scenario.title, npcName, data });
    } catch (err) {
      setReflection({
        open: true,
        status: "error",
        data: null,
        errorMessage: err.message || "Couldn't put together a reflection right now.",
      });
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

  const showResponseOptions = userTurnCount === 0 && !sending;

  return (
    <div className="chat-screen">
      <div
        className="chat-screen__background"
        style={{ backgroundImage: `url(/images/scenarios/${scenario.id}.jpg)` }}
        aria-hidden="true"
      />

      <ChatHeader scenario={scenario} onExit={onExit} onHint={handleHint} />

      <div className="chat-screen__scroll" ref={scrollRef}>
        <div className="chat-screen__messages">
          <MissionBar mission={mission} />

          <NarratorIntro
            setting={scenario.setting}
            opening={scenario.narratorOpening}
            atmosphere={scenario.narratorAtmosphere}
            difficultyGoal={difficultyGoal}
          />

          {messages.map((message) =>
            message.role === "narrator" ? (
              <NarratorNote key={message.id} text={message.content} variant={message.variant} />
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
            {hint.status !== "loading" && <span>{hint.text}</span>}
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

      <ReflectionPanel
        open={reflection.open}
        status={reflection.status}
        data={reflection.data}
        errorMessage={reflection.errorMessage}
        npcName={npcName}
        onClose={() => setReflection((r) => ({ ...r, open: false }))}
        onFinish={onExit}
      />
    </div>
  );
}
