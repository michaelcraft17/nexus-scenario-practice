/**
 * A simple, deterministic word-count ratio between the user's turns and the
 * NPC's turns -- computed in code, not asked of the model. Language models
 * are unreliable at exact counting, and the spec explicitly asked for
 * something simple ("word/turn count ratio is fine"), so there's no reason
 * to spend a model call, or risk an inaccurate one, on plain arithmetic.
 * @param {{role: "user"|"assistant", content: string}[]} messages
 * @param {string} npcLabel - Display label for the NPC side, e.g. "Marcus".
 * @returns {{userLabel: string, npcLabel: string, userPercent: number, npcPercent: number}}
 */
export function computeConversationBalance(messages, npcLabel) {
  let userWords = 0;
  let npcWords = 0;

  for (const m of messages) {
    const wordCount = m.content.trim().split(/\s+/).filter(Boolean).length;
    if (m.role === "user") userWords += wordCount;
    else if (m.role === "assistant") npcWords += wordCount;
  }

  const total = userWords + npcWords;
  const userPercent = total === 0 ? 50 : Math.round((userWords / total) * 100);

  return {
    userLabel: "You",
    npcLabel,
    userPercent,
    npcPercent: 100 - userPercent,
  };
}
