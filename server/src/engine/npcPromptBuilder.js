/**
 * Assembles the roleplay system prompt from structured data -- an NPC
 * blueprint, the scenario's scene framing, the chosen difficulty, and
 * (optionally) a template event for this turn -- rather than a hand-written
 * freeform paragraph. This is the core of the "pre-built social simulation"
 * shift: the AI performs a pre-built character from data, it doesn't
 * improvise a new personality each turn.
 */

const DIFFICULTY_GOALS = {
  beginner: "Right now, the practice goal is simple: respond naturally, practice short exchanges, and notice common social cues as they come up.",
  intermediate: "Right now, the practice goal is to build a little connection: share something about yourself, ask a follow-up question or two, and see if the conversation can go a bit longer than usual.",
  advanced: "Right now, the practice goal is to stay flexible: the conversation may shift topics unexpectedly, hit an awkward moment, or pull in someone else -- notice how it goes and adapt.",
};

export function getDifficultyGoal(level) {
  return DIFFICULTY_GOALS[level] || DIFFICULTY_GOALS.beginner;
}

export function getAllDifficultyGoals() {
  return { ...DIFFICULTY_GOALS };
}

/**
 * Render an NPC blueprint into a compact, bulleted system-prompt block.
 * Assembling from structured fields (rather than prose) keeps the prompt
 * short (lower token cost) and keeps the character's traits, style, and
 * reactions consistent turn to turn instead of the model re-deriving a
 * personality from scratch each time.
 */
export function renderNpcBlueprint(npc) {
  const traits = npc.personalityTraits.join(", ");
  const background = npc.background.map((b) => `- ${b}`).join("\n");
  const reactions = npc.scenarioReactions
    .map((r) => `- If ${r.trigger}: ${r.reaction}`)
    .join("\n");
  const goals = npc.goals.map((g) => `- ${g}`).join("\n");

  return `You are ${npc.name}, ${npc.age}, ${npc.occupation} -- the user's ${npc.relationalRole}. Perform this character consistently; do not invent new personality traits or background facts beyond what's given here.

Personality: ${traits}.
Communication style: ${npc.communicationStyle.formality}, humor: ${npc.communicationStyle.usesHumor ? "yes, sometimes" : "rarely"}, follow-up questions: ${npc.communicationStyle.asksFollowUps}. ${npc.communicationStyle.notes}

Background:
${background}

General reactions:
- If the user gives short answers: ${npc.socialBehaviorRules.shortAnswers}
- If the user seems engaged: ${npc.socialBehaviorRules.engaged}
- If the user goes quiet: ${npc.socialBehaviorRules.quiet}

Specific reactions for this scenario:
${reactions}

Your goals right now:
${goals}

`;
}

/** The Narrator's opening framing, re-sent every turn as a persistent
 * anchor against drift (see dialogueEngine.generateReply). */
export function buildSceneAnchor(scenario, difficulty) {
  return `SCENE (stay grounded in this if the conversation starts to drift -- this is the situation, no matter how the conversation goes): ${scenario.narratorOpening} ${scenario.narratorAtmosphere} ${getDifficultyGoal(difficulty)} This is a practice space for exploring different ways of communicating, not a test of one "correct" script -- let the user's approach vary naturally and react to it as a real person would.\n\n`;
}

/** Fold a selected template event into the prompt so the NPC can react to
 * or use it as a natural segue, without ever having to invent the beat
 * itself -- the event's text is fixed template content, not generated. */
export function buildEventInjection(event) {
  if (!event) return "";
  if (event.eventType === "secondaryNpcLine") {
    return `\n\nSCENE EVENT: ${event.text} React to this naturally if it makes sense for your character, without taking over their line.\n\n`;
  }
  return `\n\nSCENE EVENT: ${event.text} Let this naturally give you a reason to shift the conversation or bring up something new, rather than repeating an earlier question or line.\n\n`;
}

export function buildContinuityAddendum(scenario) {
  return `Context: The user has already read the Narrator's opening framing and your opening line: "${scenario.opener}". Continue the roleplay in character from there -- do not repeat or re-send your opening line or re-describe the scene. Keep replies natural and conversational (1-3 sentences), like real spoken dialogue only -- no stage directions, no describing actions in asterisks, no narration of what you're doing, just what you'd actually say out loud. Never mention that you are an AI or that this is a practice exercise. React to the actual content and intent of what the user says, not to whether their phrasing sounds "typical" or polished -- a blunt, plain, or unusually worded message should be responded to based on what it communicates, the same way you'd react to anyone who said that to you. Stay within the personality, style, and reactions described above -- do not invent new personality traits, background facts, or plot developments beyond what's given.`;
}
