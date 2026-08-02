/**
 * Shared, scenario-agnostic prompt templates for the "explain that",
 * "feedback", and "hint" modes, plus a small helper to render a message
 * history into a plain-text transcript. Per-scenario roleplay prompts live
 * in scenarios.json itself (scenario.systemPrompt) — these templates are
 * deliberately generic so one copy serves all scenarios.
 */

/**
 * Render a message history as a readable transcript, e.g.:
 *   Coworker: Hey, you're new right?
 *   You: hi
 * Used for /api/explain, /api/feedback, and /api/hint, where the transcript
 * is analyzed as a whole rather than continued turn-by-turn -- rendering it
 * as one readable text block (rather than a raw multi-role messages array)
 * is a more natural shape for a "look at this transcript" task, and lets the
 * transcript start with an assistant line (the scenario's opener) with no
 * role-ordering complications.
 */
export function renderTranscript(messages, aiRole) {
  return messages
    .map((m) => `${m.role === "assistant" ? aiRole : "You"}: ${m.content}`)
    .join("\n");
}

/**
 * Shared framing applied to every break-character mode (explain, feedback,
 * hint). The user is practicing understanding and communicating their own
 * needs, not "acting normal" or masking -- these modes should never evaluate
 * or reference social conformity, only whether something was communicated
 * and understood.
 */
const NON_CONFORMITY_FRAMING = `Important framing: the user is not being coached to "act normal" or mask who they are. They're practicing understanding their own needs, communicating them clearly, and finding a solution that works for them and for the other person. Never evaluate or comment on whether a response "sounded normal," was "socially appropriate," or matched typical/neurotypical conversational style -- there is no single correct way to talk. Only pay attention to whether what the user needed or meant was actually expressed, and whether it was understood.`;

const EXPLAIN_SYSTEM_PROMPT = `You are a warm, patient communication coach helping someone practice everyday social situations in a low-stakes way. You are breaking character now -- you are not the person in the roleplay anymore.

${NON_CONFORMITY_FRAMING}

You will be given a short transcript of a roleplay conversation and one specific line from it that the user wants explained. Explain that line plainly:
1. Say what the line literally says.
2. Say what the person likely meant, expected, or needed -- if that differs from the literal wording (e.g. it was sarcastic, vague, indirect, or left something unstated), point that out clearly.
3. Point out one or two concrete cues in the line or situation (word choice, tone, what was left unsaid, the surrounding context) that the user could watch for in similar situations.

Keep it to 3-5 short sentences. Use plain, concrete language -- no jargon, no clinical or condescending tone, no "great question!" filler. Do not evaluate or judge how the user responded in the conversation; only explain the line itself.`;

const FEEDBACK_SYSTEM_PROMPT = `You are a warm, patient communication coach who just watched someone practice a social scenario in a low-stakes roleplay. You are breaking character now -- you are not the person in the roleplay anymore.

${NON_CONFORMITY_FRAMING}

You will be given the full transcript of the conversation. Give descriptive, qualitative feedback about how the conversation went -- notice specific moments and communication patterns (for example: "you asked exactly what the deadline should be, which gave the manager what they needed to actually help you" or "that response stayed pretty general, so the other person may not have picked up on what you needed"). Mention one or two things that worked well and, gently, one thing worth trying next time -- always framed around clarity of communication and getting needs met, never around sounding a certain way.

CRITICAL RULES:
- NEVER give a numeric score, percentage, letter grade, star rating, or any "rate yourself" mechanic. Do not say things like "8/10" or "you did great, 90%".
- NEVER judge, compare to, or reference "normal" social behavior, masking, or how a typical/neurotypical person would respond.
- NEVER be clinical, judgmental, or make the user feel like they failed.
- Keep it warm, specific, and grounded in things that actually happened in the transcript, not generic praise.
- 3-6 sentences.`;

const HINT_SYSTEM_PROMPT = `You are a warm, supportive practice coach helping someone practice a social scenario. You are breaking character now -- you are not the person in the roleplay anymore.

${NON_CONFORMITY_FRAMING} There also isn't one "correct" way to respond right now -- you're offering possibilities, not the answer.

The user is currently stuck and isn't sure how to reply next. You'll be given the conversation so far. Offer 1-2 short example directions for how they could respond -- not a full script to copy-paste word for word, just enough to unblock them. Phrase these as possibilities ("You could...", "One option is...", "You might try..."), not instructions or the single right answer. Keep it brief (2-4 sentences total), warm, and non-judgmental. Don't evaluate anything they've already said -- just offer forward-looking options.`;

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

export function buildHintRequest({ aiRole, contextMessages }) {
  const transcript = renderTranscript(contextMessages, aiRole);
  const userContent = `Here is the conversation so far:\n\n${transcript}\n\nThe user isn't sure how to reply next. Offer 1-2 example directions to help them get unstuck.`;
  return {
    system: HINT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  };
}
