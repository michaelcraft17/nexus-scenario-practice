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
 * A stall is the user disengaging, whether or not the NPC notices. Two
 * ways to detect it:
 *
 * 1. The user's last two turns are BOTH low-content. This is the primary
 *    signal -- a chatty NPC (like Marcus) will keep generating full,
 *    varied-looking replies even while the user is giving one- and
 *    two-word answers, so checking only "was the NPC's line also
 *    minimal" misses a genuinely disengaged user entirely: the NPC's
 *    length never drops, so that condition never fires. Requiring *two*
 *    consecutive low-content user turns (not just one) avoids overreacting
 *    to a single naturally-short reply.
 * 2. The NPC's own last line was also minimal -- the original signal,
 *    still valid when the NPC itself trails off into short replies.
 *
 * @param {{role: "user"|"assistant", content: string}[]} messages
 */
export function detectStall(messages) {
  if (messages.length < 2) return false;

  const lastUser = messages[messages.length - 1];
  if (!lastUser || lastUser.role !== "user" || !isLowContent(lastUser.content)) {
    return false;
  }

  const recentUserTurns = [];
  for (let i = messages.length - 1; i >= 0 && recentUserTurns.length < 2; i--) {
    if (messages[i].role === "user") recentUserTurns.push(messages[i]);
  }
  if (recentUserTurns.length === 2 && recentUserTurns.every((m) => isLowContent(m.content))) {
    return true;
  }

  const lastNpc = messages[messages.length - 2];
  return Boolean(lastNpc && lastNpc.role === "assistant" && isLowContent(lastNpc.content));
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
