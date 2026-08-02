import { complete, completeJson } from "./openaiClient.js";
import {
  renderNpcBlueprint,
  buildSceneAnchor,
  buildEventInjection,
  buildContinuityAddendum,
} from "./npcPromptBuilder.js";
import { detectStall, selectTemplateEvent } from "./sceneDirector.js";
import {
  buildExplainRequest,
  buildReflectionRequest,
  buildHintRequest,
  buildNarratorSubtextRequest,
} from "./prompts.js";

/**
 * The dialogue engine is the seam between "what should be said" and "how it
 * gets said." Every function here takes plain data (scenario/NPC objects,
 * plain message arrays) and returns plain data -- nothing in this file knows
 * about HTTP, Express, or the shape of any particular client. When Phase 3
 * adds voice (OpenAI Realtime API), the voice bridge can call these same
 * functions directly, swapping only the input capture (mic -> STT) and
 * output (TTS) around them.
 */

/**
 * Continue the in-character roleplay -- performing a pre-built NPC, not
 * inventing a new one. This is the Narrator acting as social director: it
 * first decides (via sceneDirector, a plain heuristic -- no LLM call) whether
 * the conversation has stalled and, if so or if the dice say so, which
 * pre-built template event fires this turn; only then does it ask the model
 * for the NPC's actual line, with the NPC blueprint, scene anchor, and any
 * selected event all folded into one compact system prompt.
 *
 * Every call resends the full system prompt from scratch (the API is
 * stateless -- there's no server-side session), so prepending the scene
 * anchor here means it's re-included on every single turn automatically.
 * That's what makes it a real fallback against drift: even deep into an
 * open-ended, unscripted conversation, the model is re-grounded in who it's
 * playing and the situation every time it generates a reply, without that
 * grounding ever overriding or scripting how the user's side can go.
 *
 * @param {object} scenario - Full scenario object (narratorOpening,
 *   narratorAtmosphere, opener, templateEvents).
 * @param {object} npc - The primary NPC's full blueprint.
 * @param {{role: "user"|"assistant", content: string}[]} messages - Turn
 *   history so far, NOT including the scenario's static opener line (it's
 *   never sent as a real turn -- see the continuity addendum).
 * @param {object} [options]
 * @param {"beginner"|"intermediate"|"advanced"} [options.difficulty]
 * @param {string[]} [options.firedEventIds] - Template event ids already
 *   used this session (client-tracked), so the same beat doesn't repeat
 *   while other options remain.
 * @param {boolean} [options.hasSecondaryNpc] - Whether this scenario has an
 *   active secondary NPC (gates "secondaryNpcLine" events).
 * @returns {Promise<{text: string, event: object|null}>} The NPC's reply,
 *   plus the template event that fired this turn, if any.
 */
export async function generateReply(scenario, npc, messages, options = {}) {
  const { difficulty = "beginner", firedEventIds = [], hasSecondaryNpc = false } = options;

  const stalled = detectStall(messages);
  const event = selectTemplateEvent({
    events: scenario.templateEvents,
    difficulty,
    stalled,
    firedEventIds,
    hasSecondaryNpc,
  });

  const system =
    buildSceneAnchor(scenario, difficulty) +
    renderNpcBlueprint(npc) +
    buildEventInjection(event) +
    buildContinuityAddendum(scenario);

  const text = await complete({ system, messages });

  return { text, event };
}

/**
 * Break character and explain a single AI line: what it meant, what the
 * other person likely expected or needed, and why -- in plain,
 * non-judgmental language.
 * @param {string} aiRole - Display label for the character speaking, e.g.
 *   "Priya (manager)".
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far, up to and including the target line. May include
 *   the scenario's opener as the first (assistant) entry.
 * @param {string} targetMessage - The exact AI line to explain.
 * @returns {Promise<string>} The explanation.
 */
export async function explainMessage(aiRole, contextMessages, targetMessage) {
  const { system, messages } = buildExplainRequest({
    aiRole,
    contextMessages,
    targetMessage,
  });

  return complete({ system, messages, maxTokens: 512 });
}

/**
 * Generate the end-of-conversation Reflection: a warm, observational,
 * non-graded look at what was exchanged -- strengths shown, what the NPC
 * picked up about the user, connection moments, a descriptive (not
 * evaluative) conversation-style label, growth possibilities, and an
 * overall closing note. Returned as structured JSON (not prose) so the UI
 * can render each section distinctly.
 * @param {string} aiRole - Display label for the character in the scene.
 * @param {{role: "user"|"assistant", content: string}[]} messages - Full
 *   transcript, including the scenario's opener as the first entry.
 * @returns {Promise<{strengths: string[], npcPerspective: string, connectionMoments: string[], styleLabel: string, styleDescription: string, growthOpportunities: string[], overallEcho: string}>}
 */
export async function generateReflection(aiRole, messages) {
  const { system, messages: requestMessages } = buildReflectionRequest({
    aiRole,
    messages,
  });

  return completeJson({ system, messages: requestMessages, maxTokens: 700 });
}

/**
 * Break character and offer 1-2 gentle, non-scripted directions the user
 * could take their next reply -- for when they're stuck and don't know how
 * to continue, not a "correct answer" to copy-paste.
 * @param {string} aiRole - Display label for the character in the scene.
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far. May include the scenario's opener as the first
 *   (assistant) entry.
 * @returns {Promise<string>} The hint text.
 */
export async function generateHint(aiRole, contextMessages) {
  const { system, messages } = buildHintRequest({
    aiRole,
    contextMessages,
  });

  return complete({ system, messages, maxTokens: 256 });
}

/**
 * The Narrator's proactive third job: after a notable exchange, quietly
 * surface the hidden social dynamic behind it -- why the other character
 * responded the way they did -- without judgment and without prescribing
 * what the user "should" have said. Unlike explainMessage (on-demand, one
 * specific line, coach voice breaking character), this runs automatically
 * after every roleplay turn and the model itself decides whether anything
 * is actually worth surfacing; most turns won't have a note.
 * @param {string} aiRole - Display label for the character in the scene.
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far, including the reply that was just generated.
 * @returns {Promise<string|null>} The subtext note, or null if nothing was
 *   judged worth surfacing for this exchange.
 */
export async function generateNarratorSubtext(aiRole, contextMessages) {
  const { system, messages } = buildNarratorSubtextRequest({
    aiRole,
    contextMessages,
  });

  const result = await complete({ system, messages, maxTokens: 120 });
  const trimmed = result.trim();

  if (!trimmed || /^none\.?$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}
