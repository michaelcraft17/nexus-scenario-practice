/**
 * The only module in the client that calls fetch(). Every UI component goes
 * through these functions instead of hitting the network directly -- this is
 * the seam that lets a future voice input/output layer (Phase 3, OpenAI
 * Realtime API) reuse the same request/response shapes without components
 * needing to change.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

/** GET the list of scenarios (public fields only -- no system prompts). */
export function fetchScenarios() {
  return request("/scenarios");
}

/**
 * Continue the in-character roleplay.
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} messages - History
 *   so far (excluding the scenario's static opener), ending with the user's
 *   newest message.
 * @returns {Promise<{message: string}>}
 */
export function sendChatMessage(scenarioId, messages) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ scenarioId, messages }),
  });
}

/**
 * Break character and explain a single AI line.
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far, up to and including the target line.
 * @param {string} targetMessage - The exact line to explain.
 * @returns {Promise<{explanation: string}>}
 */
export function explainMessage(scenarioId, contextMessages, targetMessage) {
  return request("/explain", {
    method: "POST",
    body: JSON.stringify({ scenarioId, contextMessages, targetMessage }),
  });
}

/**
 * Get descriptive (never numeric) feedback on the full conversation.
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} messages - Full
 *   transcript, including the scenario's opener.
 * @returns {Promise<{feedback: string}>}
 */
export function getFeedback(scenarioId, messages) {
  return request("/feedback", {
    method: "POST",
    body: JSON.stringify({ scenarioId, messages }),
  });
}
