/**
 * Past Reflections, persisted client-side (localStorage) -- the backend is
 * stateless by design (see services/api.js), so this is the only place a
 * completed reflection lives once its conversation ends. Capped at
 * MAX_ENTRIES, newest first, so this can't grow unbounded across many
 * scenarios over time.
 */

const KEY = "nexus_reflection_history";
const MAX_ENTRIES = 20;

let nextId = 1;
function makeId() {
  return `rh${Date.now()}_${nextId++}`;
}

/**
 * @param {{scenarioId: string, scenarioTitle: string, npcName: string, data: object}} entry
 */
export function saveReflectionToHistory(entry) {
  const history = getReflectionHistory();
  history.unshift({ id: makeId(), completedAt: new Date().toISOString(), ...entry });
  try {
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage full or unavailable (e.g. private browsing) -- losing history
    // silently is preferable to breaking the reflection the user is
    // actively looking at.
  }
}

/** @returns {{id: string, scenarioId: string, scenarioTitle: string, npcName: string, completedAt: string, data: object}[]} */
export function getReflectionHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearReflectionHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
