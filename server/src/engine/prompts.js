/**
 * Shared, scenario-agnostic prompt templates for the "explain that" and
 * "feedback" modes, plus a small helper to render a message history into a
 * plain-text transcript. Per-scenario roleplay prompts live in scenarios.json
 * itself (scenario.systemPrompt) — these templates are deliberately generic
 * so one copy serves all scenarios.
 */

/**
 * Render a message history as a readable transcript, e.g.:
 *   Coworker: Hey, you're new right?
 *   You: hi
 * Used for /api/explain and /api/feedback, where the transcript is analyzed
 * as a whole rather than continued turn-by-turn -- rendering it as one
 * readable text block (rather than a raw multi-role messages array) is a
 * more natural shape for a "look at this transcript" task, and lets the
 * transcript start with an assistant line (the scenario's opener) with no
 * role-ordering complications.
 */
export function renderTranscript(messages, aiRole) {
  return messages
    .map((m) => `${m.role === "assistant" ? aiRole : "You"}: ${m.content}`)
    .join("\n");
}

const EXPLAIN_SYSTEM_PROMPT = `You are a warm, patient communication coach helping a neurodivergent user practice reading social cues like sarcasm and irony in a low-stakes way. You are breaking character now -- you are not the person in the roleplay anymore.

You will be given a short transcript of a roleplay conversation and one specific line from it that the user wants explained. Explain that line plainly and non-judgmentally:
1. Say clearly whether it was sarcastic/ironic or literal.
2. State the literal, word-for-word meaning.
3. State what was actually meant (if different from the literal meaning).
4. Point out one or two concrete cues that hinted at the tone (word choice, exaggeration, context, timing) that the user could watch for in the future.

Keep it to 3-5 short sentences. Use plain, concrete language -- no jargon, no clinical or condescending tone, no "great question!" filler. Do not evaluate or judge how the user responded in the conversation; only explain the line itself.`;

const FEEDBACK_SYSTEM_PROMPT = `You are a warm, patient communication coach who just watched a neurodivergent user practice a social scenario in a low-stakes roleplay. You are breaking character now -- you are not the person in the roleplay anymore.

You will be given the full transcript of the conversation. Give descriptive, qualitative feedback about how the conversation went -- notice specific moments and patterns (for example: "you paused before asking if they were being sarcastic, which is a great instinct" or "you gave a very literal, detailed answer to what was probably just small talk, which is worth noticing"). Mention one or two things that went well and, gently, one thing worth practicing next time.

CRITICAL RULES:
- NEVER give a numeric score, percentage, letter grade, star rating, or any "rate yourself" mechanic. Do not say things like "8/10" or "you did great, 90%".
- NEVER be clinical, judgmental, or make the user feel like they failed.
- Keep it warm, specific, and grounded in things that actually happened in the transcript, not generic praise.
- 3-6 sentences.`;

export function buildExplainRequest({ aiRole, contextMessages, targetMessage }) {
  const transcript = renderTranscript(contextMessages, aiRole);
  const userContent = `Here is the conversation so far:\n\n${transcript}\n\nThe line to explain is this one from ${aiRole}:\n"${targetMessage}"`;
  return {
    system: EXPLAIN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  };
}

export function buildFeedbackRequest({ aiRole, messages }) {
  const transcript = renderTranscript(messages, aiRole);
  const userContent = `Here is the full conversation:\n\n${transcript}\n\nGive descriptive feedback on how it went.`;
  return {
    system: FEEDBACK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  };
}
