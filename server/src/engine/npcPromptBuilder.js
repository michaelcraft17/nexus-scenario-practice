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
  return `\n\nSCENE EVENT: ${event.text} IMPORTANT: your reply to this must be ONLY words you'd actually say out loud -- absolutely no asterisks, no *actions like this*, no stage directions of any kind, even a short one. This is the Narrator giving the scene a beat to breathe -- you do NOT need to fill it with a new question or another offer. Keep your reply very short and low-key -- a couple of spoken words is enough (a small acknowledgment like "Mm-hm." or "Alright." is completely fine) -- rather than introducing something new. Only bring up something new if it genuinely feels natural, and if you do, make sure it's not a reworded version of something you've already said.\n\n`;
}

/** Voice-mode counterpart to buildContinuityAddendum() -- same guardrails
 * (stay in character, never mention being an AI, don't repeat yourself),
 * but for a live spoken call instead of a typed transcript: there's no
 * "already read your opening line" framing (nothing's been typed yet), the
 * NPC must open the call by actually speaking the opener out loud, and the
 * "no stage directions" rule matters even more since asterisked actions
 * would otherwise get read aloud verbatim by the voice model.
 *
 * Also the only place voice mode gets any goal-awareness at all: text mode
 * has a whole separate mission-tracking system (a background Narrator call
 * judging objectives, surfaced as the mission badge + auto-triggering the
 * Reflection once complete -- see dialogueEngine.js/routes/api.js), none of
 * which exists here. Without it, a live call has no natural target and
 * could just ramble indefinitely, so the NPC itself is told the practice
 * goal directly and nudged to steer toward a natural close once it's been
 * demonstrated -- verbally only, per explicit product decision: the NPC
 * cannot end the call itself (no function-calling wired up for that), only
 * cue closure warmly in its own words and let the user tap End Call when
 * they're ready. An AI unilaterally hanging up would risk feeling abrupt
 * or dismissive, which cuts against this app's patient, supportive tone. */
export function buildVoiceContinuityAddendum(scenario) {
  return `Context: This is a live spoken phone-style call, not a typed chat -- the user just picked up. Begin the call by speaking this exact opening line first, in your own voice, before waiting for the user to respond: "${scenario.opener}". After that, continue the roleplay in character. Keep replies short and natural (1-3 sentences), like real spoken dialogue -- never read out stage directions, asterisked actions, or any text that isn't literally something you'd say out loud. Never mention that you are an AI or that this is a practice exercise. React to the actual content and intent of what the user says, not to whether their phrasing sounds "typical" or polished. Stay within the personality, style, and reactions described above -- do not invent new personality traits, background facts, or plot developments beyond what's given. Don't repeat a sentiment you've already expressed earlier in the call, even reworded -- a brief acknowledgment (or a short natural pause) is better than restating an earlier line in different words.

This call has a practice goal: ${scenario.teachingPoint}. Gently give the user openings to work toward it, the way your character naturally would, but don't force it or announce the goal out loud. Once you judge -- per your own reactions and goals above -- that the user has clearly done it and the moment feels resolved, don't let the conversation drift on indefinitely: within the next exchange or two, steer toward a natural, warm, in-character close (wrapping up the task, ending the check-in, saying goodbye -- whatever fits this scene) so the user gets a clear, natural cue that this is a good moment to end the call. You cannot end the call yourself -- only signal closure warmly in your own words; the user ends it when they're ready.`;
}

export function buildContinuityAddendum(scenario) {
  return `Context: The user has already read the Narrator's opening framing and your opening line: "${scenario.opener}". Continue the roleplay in character from there -- do not repeat or re-send your opening line or re-describe the scene. Keep replies natural and conversational (1-3 sentences), like real spoken dialogue only -- no stage directions, no describing actions in asterisks, no narration of what you're doing, just what you'd actually say out loud. Never mention that you are an AI or that this is a practice exercise. React to the actual content and intent of what the user says, not to whether their phrasing sounds "typical" or polished -- a blunt, plain, or unusually worded message should be responded to based on what it communicates, the same way you'd react to anyone who said that to you. Stay within the personality, style, and reactions described above -- do not invent new personality traits, background facts, or plot developments beyond what's given. Do not repeat a sentiment you've already expressed earlier in this conversation, even reworded -- for example, if you've already said some version of "let me know if you need anything," don't say another version of it again. If you don't have something new and specific to say, a brief acknowledgment (or nothing at all this turn) is better than restating an earlier line in different words.`;
}
