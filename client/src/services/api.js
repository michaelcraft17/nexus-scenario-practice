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

/**
 * GET the list of scenarios (public fields only -- no NPC blueprints or
 * template events) plus the shared difficulty-level descriptions.
 * @returns {Promise<{scenarios: object[], difficultyGoals: {beginner: string, intermediate: string, advanced: string}}>}
 */
export function fetchScenarios() {
  return request("/scenarios");
}

/**
 * Continue the in-character roleplay.
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} messages - History
 *   so far (excluding the scenario's static opener), ending with the user's
 *   newest message.
 * @param {object} [options]
 * @param {"beginner"|"intermediate"|"advanced"} [options.difficulty]
 * @param {string[]} [options.firedEventIds] - Template event ids already
 *   used this session, so the Narrator doesn't repeat a beat while others
 *   are still available.
 * @returns {Promise<{message: string, event: {id: string, type: string, text: string}|null, narratorNote: string|null}>}
 */
export function sendChatMessage(scenarioId, messages, { difficulty, firedEventIds } = {}) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ scenarioId, messages, difficulty, firedEventIds }),
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
 * Get the end-of-conversation Reflection -- a warm, observational,
 * non-graded look at what was exchanged (never a numeric score).
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} messages - Full
 *   transcript, including the scenario's opener.
 * @returns {Promise<{
 *   strengths: string[],
 *   npcPerspective: string,
 *   connectionMoments: string[],
 *   styleLabel: string,
 *   styleDescription: string,
 *   growthOpportunities: string[],
 *   overallEcho: string,
 *   balance: {userLabel: string, npcLabel: string, userPercent: number, npcPercent: number}
 * }>}
 */
export function getReflection(scenarioId, messages) {
  return request("/reflection", {
    method: "POST",
    body: JSON.stringify({ scenarioId, messages }),
  });
}

/**
 * Get 1-2 gentle example directions for what to say next -- for when the
 * user is stuck, not a script to copy-paste.
 * @param {string} scenarioId
 * @param {{role: "user"|"assistant", content: string}[]} contextMessages -
 *   Conversation so far.
 * @returns {Promise<{hint: string}>}
 */
export function getHint(scenarioId, contextMessages) {
  return request("/hint", {
    method: "POST",
    body: JSON.stringify({ scenarioId, contextMessages }),
  });
}
