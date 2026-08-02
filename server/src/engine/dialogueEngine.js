import { complete } from "./claudeClient.js";
import { buildExplainRequest, buildFeedbackRequest } from "./prompts.js";

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
 * @param {object} scenario - Full scenario object (including systemPrompt).
 * @param {{role: "user"|"assistant", content: string}[]} messages - Turn
 *   history so far, NOT including the scenario's static opener line. Must
 *   start with role "user" (the Anthropic Messages API requires this).
 * @returns {Promise<string>} The AI's in-character reply.
 */
export async function generateReply(scenario, messages) {
  const continuityAddendum = `\n\nContext: The user has already read your opening line: "${scenario.opener}". Continue the roleplay in character from there -- do not repeat or re-send your opening line. Keep replies natural and conversational (1-3 sentences), like real spoken dialogue. Never mention that you are an AI or that this is a practice exercise.`;

  return complete({
    system: scenario.systemPrompt + continuityAddendum,
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
