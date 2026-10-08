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
import MessageBubble, { NpcSpeaker } from "./MessageBubble.jsx";
import ReflectionPanel from "./ReflectionPanel.jsx";
import ResponseOptions from "./ResponseOptions.jsx";
import NarratorIntro from "./NarratorIntro.jsx";
import NarratorNote from "./NarratorNote.jsx";
import MissionBar from "./MissionBar.jsx";
import VoiceCallScreen from "./VoiceCallScreen.jsx";
import TutorialOverlay from "./TutorialOverlay.jsx";
import PracticeFocus from "./PracticeFocus.jsx";
import "./chat-v2.css";

let nextId = 1;
function makeId() {
  return `m${nextId++}`;
}

/** Matches chat-v2.css's breakpoint for showing the practice-focus side card. */
const WIDE_LAYOUT_QUERY = "(min-width: 1001px)";

/** Text-chat only, deliberately -- voice mode is its own separate live
 * experience (see ChatScreen's own startInVoiceMode gating below) and
 * doesn't need or get this walkthrough. The last step points at whichever
 * mission view is on screen: the side card on wide layouts, the sticky
 * badge otherwise. */
function chatTutorialSteps(focusCollapsed) {
  const wide = typeof window !== "undefined" && window.matchMedia(WIDE_LAYOUT_QUERY).matches;
  return [
    {
      target: ".narrator-card",
      title: "Read the scene",
      text: "The Narrator sets up the situation. Open \u201cRead full context\u201d for the backstory and the practice goal.",
    },
    {
      target: ".chat-screen__input",
      title: "Type your reply",
      text: "Write what you'd actually say. Press Enter to send, or Ctrl + Enter for a new line.",
    },
    {
      target: ".response-options",
      title: "Stuck on what to say?",
      text: "These starter replies show a few different ways to respond -- tap one to put it in the box, then edit it before you send.",
    },
    {
      target: ".chat-header__hint",
      title: "Need a nudge?",
      text: "Tap Hint any time for a couple of gentle example directions. \u201cNeed a hint?\u201d under the replies does the same.",
    },
    ...practiceFocusSteps(wide, focusCollapsed),
  ];
}

/** The practice-focus part of the walkthrough: what the task is, what the
 * mission objectives mean, and how to open/close the panel. On narrow
 * screens the sticky mission badge stands in for the side card. */
function practiceFocusSteps(wide, collapsed) {
  if (!wide) {
    return [
      {
        target: ".mission-badge",
        title: "Your task",
        text: "This is your mission for the conversation. Tap it to open the full list of objectives, and tap again to close it. The highlighted one is what to work on next.",
      },
    ];
  }
  if (collapsed) {
    return [
      {
        target: ".practice-focus__rail",
        placement: "left",
        title: "Your practice focus",
        text: "Your task and mission are tucked into this bar so the chat has the room. Click the bar or the arrow on its edge to open them again; the number shows how many objectives are done.",
      },
    ];
  }
  return [
    {
      target: ".practice-focus__card",
      placement: "left",
      title: "Your practice focus",
      text: "This is your task. The heading names the skill this scenario practices, and the Mission below breaks it into steps.",
    },
    {
      target: ".practice-focus__mission",
      placement: "left",
      title: "Your mission",
      text: "The highlighted objective is what to work on next. Each one ticks off as the conversation goes, and the counter shows how many are done.",
    },
    {
      target: ".practice-focus__toggle",
      title: "Make room for the chat",
      text: "Want to just talk? This arrow on the edge folds the panel into a slim bar on the right. Click the arrow again any time to bring it back.",
    },
  ];
}

const FOCUS_COLLAPSED_KEY = "nexus-practice-focus-collapsed";

function readFocusCollapsed() {
  try {
    return localStorage.getItem(FOCUS_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** White text fails contrast on the amber scenario color specifically --
 * same exception already made for its picker card CTA button (see
 * index.css's [data-scenario="unexpected-conversation"] block). Every
 * other scenario color is dark enough for white text to work fine. */
export const SCENARIO_ACCENT_CONTRAST = {
  "unexpected-conversation": "#3a2a0d",
};

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

export default function ChatScreen({ scenario, difficulty, difficultyGoal, startInVoiceMode = false, onExit }) {
  const { resolvedMotion, registerReadableContent, stopSpeech } = useAccessibility();
  const [messages, setMessages] = useState(() => [
    { id: makeId(), role: "assistant", content: scenario.opener, isOpener: true },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [reflection, setReflection] = useState({ open: false, status: "idle", data: null, errorMessage: "" });
  const [hint, setHint] = useState({ open: false, status: "idle", text: "" });
  // Set once from the mode-select screen's choice (App.jsx) -- ChatScreen
  // is freshly mounted whenever that choice is made (see its `key` in
  // App.jsx), so reading this only at initial state is correct; it never
  // needs to react to the prop changing afterward.
  const [voiceOpen, setVoiceOpen] = useState(startInVoiceMode);
  // Bumped by the header's Tutorial button to remount the walkthrough (it only
  // reads its "seen already?" flag once, at mount -- see TutorialOverlay).
  const [tutorialKey, setTutorialKey] = useState(0);
  // Template event ids the Narrator has already used this session, so the
  // same beat doesn't repeat turn after turn while others are available.
  const [firedEventIds, setFiredEventIds] = useState([]);
  // The mission panel's current state -- stage 1 to start, recomputed fresh
  // by the server every turn (see routes/api.js resolveMission) rather than
  // diffed incrementally client-side.
  const [mission, setMission] = useState(scenario.mission ?? null);
  // The desktop practice-focus panel, folded into a slim bar so the chat can
  // take the width. Remembered across scenarios.
  const [focusCollapsed, setFocusCollapsed] = useState(readFocusCollapsed);

  function toggleFocusCollapsed() {
    const next = !focusCollapsed;
    setFocusCollapsed(next);
    try {
      localStorage.setItem(FOCUS_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Ignore -- storage may be unavailable (private browsing etc.).
    }
  }

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const autoReflectedRef = useRef(false);
  const typingRef = useRef(null);
  // What's left to show after a reply lands -- the "Mission Updated" moment
  // and the Narrator's aside come in one at a time after it rather than all
  // at once. Each step is a function; its timer fires it, or flushReveals()
  // runs whatever's left straight away (on the next send, or on leaving).
  const revealRef = useRef({ steps: [], timers: [] });

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  // "Explain that" only sits under Priya's newest reply -- one button, on the
  // line the user is most likely puzzling over, instead of one per message.
  const latestAssistantId = messages.findLast((m) => m.role === "assistant")?.id;
  const npcName = scenario.aiRole.split(" (")[0];
  const npcRoleMatch = scenario.aiRole.match(/\(([^)]+)\)/);
  const npcRole = npcRoleMatch ? npcRoleMatch[1].charAt(0).toUpperCase() + npcRoleMatch[1].slice(1) : "";

  // Auto-grows the reply box with its content instead of staying pinned to
  // one line -- reset to "auto" first so it can shrink back down too (e.g.
  // after sending), not just grow. Capped in CSS (max-height + overflow-y)
  // so a very long draft scrolls internally rather than pushing the rest of
  // the screen around.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [inputValue]);

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
      return parts.filter(Boolean);
    });
  }, [messages, scenario, registerReadableContent, npcName, mission]);

  // Don't keep reading the conversation aloud after leaving this screen.
  useEffect(() => stopSpeech, [stopSpeech]);

  // Leaving mid-reveal: drop the timers rather than updating an unmounted screen.
  useEffect(() => () => revealRef.current.timers.forEach(clearTimeout), []);

  function flushReveals() {
    const { steps, timers } = revealRef.current;
    timers.forEach(clearTimeout);
    revealRef.current = { steps: [], timers: [] };
    steps.forEach((step) => step());
  }

  /** Runs each step `gap` ms after the previous one. */
  function scheduleReveals(steps, gap) {
    flushReveals();
    const pending = [...steps];
    revealRef.current.steps = pending;
    revealRef.current.timers = steps.map((step, i) =>
      setTimeout(() => {
        pending.splice(pending.indexOf(step), 1);
        step();
      }, gap * (i + 1))
    );
  }

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

  // Clearing the flag and remounting (via the key bump) is what actually
  // replays it, same as the picker's own Tutorial button.
  function replayTutorial() {
    try {
      localStorage.removeItem("nexus-tutorial-chat");
    } catch {
      // Ignore -- storage may be unavailable (private browsing etc.).
    }
    // Open the practice focus so the walkthrough can show what's in it.
    if (focusCollapsed) toggleFocusCollapsed();
    setTutorialKey((k) => k + 1);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;
    // Anything still waiting to appear from the last reply shows now, so it
    // lands above this message rather than after it.
    flushReveals();

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
      // The reply grows out of the typing bubble it replaces (see
      // MessageBubble's arriveFrom), so note that bubble's size first.
      const typingBox = typingRef.current?.getBoundingClientRect();
      const arriveFrom =
        typingBox && resolvedMotion !== "reduce" ? { width: typingBox.width, height: typingBox.height } : null;
      setMessages((prev) => {
        const next = [...prev];
        // A scene event (atmosphere shift, or another NPC chiming in) is
        // narrated *before* the reply it set up -- it's a pre-built beat
        // from the scenario's event library, not something the model
        // invented, and it gives the NPC's line a natural segue.
        if (event) {
          next.push({ id: makeId(), role: "narrator", content: event.text });
        }
        next.push({ id: makeId(), role: "assistant", content: reply, arriveFrom });
        return next;
      });
      if (event) {
        setFiredEventIds((prev) => [...prev, event.id]);
      }

      // Then, a beat apart so each can be read: the "Mission Updated" moment
      // when the mission moves to a new stage (with the side checklist
      // ticking over at the same time), and the Narrator's aside on the
      // reply. Neither this aside nor the event above ever leaks back into
      // /api/chat -- narrator-role entries are filtered out of every payload
      // the app sends. The mission-tracking call is a non-fatal
      // nice-to-have server-side -- on failure it comes back null, so keep
      // whatever mission state is already showing rather than clearing it.
      const missionAdvanced = updatedMission && updatedMission.stageId !== mission?.stageId;
      const steps = [];
      if (updatedMission) {
        steps.push(() => {
          if (missionAdvanced) {
            setMessages((prev) => [
              ...prev,
              { id: makeId(), role: "narrator", content: updatedMission.missionText, variant: "mission" },
            ]);
          }
          setMission(updatedMission);
        });
      }
      if (narratorNote) {
        steps.push(() => setMessages((prev) => [...prev, { id: makeId(), role: "narrator", content: narratorNote }]));
      }
      scheduleReveals(steps, 1300);
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

  /** @param {{role: "user"|"assistant", content: string}[]} [transcriptOverride] -
   *   Used by the voice call's own "want a reflection?" flow (see
   *   VoiceCallScreen's onClose below) to reflect on its own spoken
   *   transcript instead of this screen's typed `messages` state -- the
   *   text-mode auto-trigger call site (missionComplete effect) omits this,
   *   falling back to the normal typed-transcript behavior. */
  async function handleReflect(transcriptOverride) {
    setReflection({ open: true, status: "loading", data: null, errorMessage: "" });
    try {
      const transcript = transcriptOverride ?? toApiShape(messages.filter(isDialogueTurn));
      const data = await getReflection(scenario.id, transcript);
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
    <div
      className="chat-screen chat-screen--v2"
      data-light-accent={scenario.id in SCENARIO_ACCENT_CONTRAST ? "" : undefined}
      style={{
        "--scenario-accent": scenario.color,
        "--scenario-accent-contrast": SCENARIO_ACCENT_CONTRAST[scenario.id] ?? "#ffffff",
      }}
    >
      <div
        className="chat-screen__background"
        style={{ backgroundImage: `url(/images/scenarios/${scenario.id}.jpg)` }}
        aria-hidden="true"
      />

      <ChatHeader
        scenario={scenario}
        onExit={onExit}
        onHint={handleHint}
        onTalkLive={() => setVoiceOpen(true)}
        onTutorial={replayTutorial}
        typing={sending}
      />

      <div className={`chat-v2__layout${focusCollapsed ? " chat-v2__layout--focus-collapsed" : ""}`}>
        <section className="chat-v2__panel" aria-label="Practice conversation">
          <div className="chat-screen__scroll" ref={scrollRef}>
            <div className="chat-screen__messages">
              <MissionBar mission={mission} />

              <NarratorIntro
                setting={scenario.setting}
                opening={scenario.narratorOpening}
                atmosphere={scenario.narratorAtmosphere}
                difficultyGoal={difficultyGoal}
                compact={userTurnCount > 0}
              />

              <div className="chat-v2__begins">The conversation begins</div>

              {messages.map((message) =>
                message.role === "narrator" ? (
                  <NarratorNote key={message.id} text={message.content} variant={message.variant} />
                ) : (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    npcName={npcName}
                    npcRole={npcRole}
                    onExplain={handleExplain}
                    showExplain={message.id === latestAssistantId}
                  />
                )
              )}
              {sending && (
                <div className="bubble-row bubble-row--assistant chat-v2__typing-row">
                  <div className="bubble bubble--typing" role="status" ref={typingRef}>
                    <NpcSpeaker name={npcName} role={npcRole} />
                    <span className="chat-v2__typing-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="visually-hidden">{npcName} is typing…</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chat-v2__composer">
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

            {!hint.open && (
              <button type="button" className="chat-v2__hint-link" onClick={handleHint}>
                Need a hint?
              </button>
            )}

            <form className="chat-screen__input" onSubmit={handleSend}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  // Enter sends, like a chat app. Ctrl/Cmd+Enter inserts a newline
                  // (textareas don't do that natively), and Shift+Enter still
                  // does too, for anyone drafting a longer, multi-line reply.
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const caret = el.selectionStart + 1;
                    setInputValue(inputValue.slice(0, el.selectionStart) + "\n" + inputValue.slice(el.selectionEnd));
                    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
                  } else if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`What would you say to ${npcName}?`}
                disabled={sending}
                aria-label="Your reply"
                aria-describedby="chat-keyhint"
              />
              <button type="submit" disabled={sending || !inputValue.trim()}>
                Send
              </button>
            </form>
            <p className="chat-v2__keyhint" id="chat-keyhint">
              Enter to send · Ctrl + Enter for a new line
            </p>
          </div>
        </section>

        <PracticeFocus
          scenario={scenario}
          mission={mission}
          collapsed={focusCollapsed}
          onToggle={toggleFocusCollapsed}
        />
      </div>

      <ReflectionPanel
        open={reflection.open}
        status={reflection.status}
        data={reflection.data}
        errorMessage={reflection.errorMessage}
        npcName={npcName}
        onClose={() => setReflection((r) => ({ ...r, open: false }))}
        onFinish={onExit}
      />

      <VoiceCallScreen
        open={voiceOpen}
        scenarioId={scenario.id}
        npcName={npcName}
        voiceIntro={scenario.voiceIntro}
        opener={scenario.opener}
        practiceLabel={scenario.practiceLabel}
        accentColor={scenario.color}
        accentContrast={SCENARIO_ACCENT_CONTRAST[scenario.id] ?? "#ffffff"}
        // Called with the call's own spoken transcript if the user opted
        // into a reflection on the "want a reflection?" prompt VoiceCall
        // Screen shows after ending, or with nothing if they skipped it/
        // there was nothing to reflect on -- either way this always also
        // closes the call screen itself.
        onClose={(voiceTranscript) => {
          setVoiceOpen(false);
          if (voiceTranscript) {
            handleReflect(voiceTranscript);
          }
        }}
      />

      {/* Text mode only, per its own steps' target elements -- voice mode
          starts with voiceOpen already true (see startInVoiceMode), so this
          screen's own text UI never becomes the first thing shown in that
          case, and the walkthrough would have nothing correctly staged to
          point at anyway. */}
      <TutorialOverlay
        key={tutorialKey}
        storageKey="nexus-tutorial-chat"
        // First-run only in text mode (see above), but an explicit replay
        // request always runs -- including for someone who started in voice
        // mode and has since come back to the text chat.
        active={(!startInVoiceMode || tutorialKey > 0) && !voiceOpen}
        steps={chatTutorialSteps(focusCollapsed)}
      />
    </div>
  );
}
