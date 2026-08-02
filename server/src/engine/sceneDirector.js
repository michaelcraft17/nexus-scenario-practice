/**
 * The Narrator acting as social director: decides when the scene needs a
 * nudge (a stall) and which pre-built template event, if any, fires this
 * turn. Deliberately a plain heuristic, not an LLM call -- selecting from a
 * fixed data library is exactly the "template events, not freely generated
 * plot beats" architecture this is meant to enforce, and it keeps this
 * decision free (no added token cost) on every single turn.
 */

const FILLER_WORDS = new Set([
  "yeah", "yep", "yup", "ok", "okay", "k", "sure", "nice", "cool", "fine",
  "idk", "hm", "hmm", "oh", "right", "mmm", "alright",
]);

function isLowContent(text) {
  const trimmed = text.trim().replace(/[.!?]+$/, "");
  if (!trimmed) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return true;
  return words.length <= 4 && FILLER_WORDS.has(words[0].toLowerCase());
}

/**
 * A stall is when the NPC's last line and the user's new reply are both
 * low-content -- neither side is giving the conversation anywhere to go,
 * which is exactly when the Narrator should step in with a beat rather than
 * let the NPC awkwardly re-ask a question.
 * @param {{role: "user"|"assistant", content: string}[]} messages
 */
export function detectStall(messages) {
  if (messages.length < 2) return false;
  const lastUser = messages[messages.length - 1];
  const lastNpc = messages[messages.length - 2];
  if (!lastUser || !lastNpc) return false;
  if (lastUser.role !== "user" || lastNpc.role !== "assistant") return false;
  return isLowContent(lastNpc.content) && isLowContent(lastUser.content);
}

function pickFrom(pool, firedEventIds) {
  if (pool.length === 0) return null;
  const unused = pool.filter((e) => !firedEventIds.includes(e.id));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const RANDOM_EVENT_CHANCE = 0.2;

/**
 * Pick a template event for this turn, if any.
 * - On a stall, always try to pick a "stall" trigger event -- that's the
 *   whole point, giving the NPC a graceful way out of dead air.
 * - Otherwise, above beginner difficulty, there's a small per-turn chance
 *   of a "random" flavor event for scene richness.
 * - "secondaryNpcLine" events additionally require both an active
 *   secondary NPC in this scenario AND advanced difficulty -- group
 *   dynamics are explicitly an advanced-tier skill.
 */
export function selectTemplateEvent({ events, difficulty, stalled, firedEventIds, hasSecondaryNpc }) {
  const eligible = (events ?? []).filter((e) => {
    if (e.requiresSecondaryNpc && !(hasSecondaryNpc && difficulty === "advanced")) return false;
    if (e.difficulty && !e.difficulty.includes(difficulty)) return false;
    return true;
  });

  if (stalled) {
    return pickFrom(eligible.filter((e) => e.trigger === "stall"), firedEventIds);
  }

  if (difficulty === "beginner") return null;
  if (Math.random() > RANDOM_EVENT_CHANCE) return null;

  return pickFrom(eligible.filter((e) => e.trigger === "random"), firedEventIds);
}
