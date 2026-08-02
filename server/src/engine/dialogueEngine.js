import { complete } from "./openaiClient.js";
import {
  buildExplainRequest,
  buildFeedbackRequest,
  buildHintRequest,
  buildNarratorSubtextRequest,
} from "./prompts.js";

/**
 * The dialogue engine is the seam between "what should be said" and "how it
 * gets said." Every function here takes plain data (scenario objects, plain
 * message arrays) and returns plain text -- nothing in this file knows about
 * HTTP, Express, or the shape of any particular client. When Phase 3 adds
 * voice (OpenAI Realtime API), the voice bridge can call these same
 * functions directly, swapping only the input capture (mic -> STT) and
 * output (TTS) around them.
 */

/**
 * Continue the in-character roleplay.
 *
 * Every call resends the full system prompt from scratch (the API is
 * stateless -- there's no server-side session), so prepending the scene
 * anchor here means it's re-included on every single turn automatically.
 * That's what makes it a real fallback against drift: even deep into an
 * open-ended, unscripted conversation, the model is re-grounded in who it's
 * playing and the situation every time it generates a reply, without that
 * grounding ever overriding or scripting how the user's side can go.
 *
 * @param {object} scenario - Full scenario object (including systemPrompt,
 *   narratorOpening, and narratorAtmosphere).
 * @param {{role: "user"|"assistant", content: string}[]} messages - Turn
 *   history so far, NOT including the scenario's static opener line (it's
 *   never sent as a real turn -- see the continuity addendum below).
 * @returns {Promise<string>} The AI's in-character reply.
 */
export async function generateReply(scenario, messages) {
  const sceneAnchor = `SCENE (stay grounded in this if the conversation starts to drift -- this is who you are and the situation you're in, no matter how the conversation goes): ${scenario.narratorOpening} ${scenario.narratorAtmosphere} This is a practice space for exploring different ways of communicating, not a test of one "correct" script -- let the user's approach vary naturally and react to it as a real person would.\n\n`;

  const continuityAddendum = `\n\nContext: The user has already read the Narrator's opening framing above and your opening line: "${scenario.opener}". Continue the roleplay in character from there -- do not repeat or re-send your opening line or re-describe the scene. Keep replies natural and conversational (1-3 sentences), like real spoken dialogue. Never mention that you are an AI or that this is a practice exercise. React to the actual content and intent of what the user says, not to whether their phrasing sounds "typical" or polished -- a blunt, plain, or unusually worded message should be responded to based on what it communicates, the same way you'd react to anyone who said that to you.`;

  return complete({
    system: sceneAnchor + scenario.systemPrompt + continuityAddendum,
    messages,
  });
}

/**
 * Break character and explain a single AI line: sarcasm/irony or literal,
 * literal vs. intended meaning, and why -- in plain, non-judgmental language.
 * @param {object} scenario - Full scenario object.
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far, up to and including the target line. May include
 *   the scenario's opener as the first (assistant) entry.
 * @param {string} targetMessage - The exact AI line to explain.
 * @returns {Promise<string>} The explanation.
 */
export async function explainMessage(scenario, contextMessages, targetMessage) {
  const { system, messages } = buildExplainRequest({
    aiRole: scenario.aiRole,
    contextMessages,
    targetMessage,
  });

  return complete({ system, messages, maxTokens: 512 });
}

/**
 * Give descriptive, non-numeric feedback on the full conversation.
 * @param {object} scenario - Full scenario object.
 * @param {{role: "user"|"assistant", content: string}[]} messages - Full
 *   transcript, including the scenario's opener as the first entry.
 * @returns {Promise<string>} The feedback text.
 */
export async function generateFeedback(scenario, messages) {
  const { system, messages: requestMessages } = buildFeedbackRequest({
    aiRole: scenario.aiRole,
    messages,
  });

  return complete({ system, messages: requestMessages, maxTokens: 512 });
}

/**
 * Break character and offer 1-2 gentle, non-scripted directions the user
 * could take their next reply -- for when they're stuck and don't know how
 * to continue, not a "correct answer" to copy-paste.
 * @param {object} scenario - Full scenario object.
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far. May include the scenario's opener as the first
 *   (assistant) entry.
 * @returns {Promise<string>} The hint text.
 */
export async function generateHint(scenario, contextMessages) {
  const { system, messages } = buildHintRequest({
    aiRole: scenario.aiRole,
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
 * @param {object} scenario - Full scenario object.
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far, including the reply that was just generated.
 * @returns {Promise<string|null>} The subtext note, or null if nothing was
 *   judged worth surfacing for this exchange.
 */
export async function generateNarratorSubtext(scenario, contextMessages) {
  const { system, messages } = buildNarratorSubtextRequest({
    aiRole: scenario.aiRole,
    contextMessages,
  });

  const result = await complete({ system, messages, maxTokens: 120 });
  const trimmed = result.trim();

  if (!trimmed || /^none\.?$/i.test(trimmed)) {
    return null;
  }
  return trimmed;
}
