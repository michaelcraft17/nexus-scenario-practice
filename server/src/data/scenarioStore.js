import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getById as getNpcById, formatAiRole } from "./npcStore.js";
import { getAllDifficultyGoals } from "../engine/npcPromptBuilder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(
  readFileSync(join(__dirname, "scenarios.json"), "utf-8")
);

/**
 * Public scenario fields safe to send to the client, plus the shared
 * difficulty-level descriptions (identical across scenarios, so they're
 * returned once rather than duplicated per scenario). `npcId`,
 * `secondaryNpcId`, and `templateEvents` are deliberately excluded -- NPC
 * blueprints and the event library are the "prompt-engineering content" of
 * the app now, same reason `systemPrompt` never left the server before.
 * `responseOptions[].note` is excluded too -- it names which option is
 * "recommended," which would spoil the practice if shown up front.
 * `aiRole` is derived from the linked NPC's blueprint rather than stored
 * redundantly on the scenario, so there's one source of truth for it.
 * `missions` is excluded too, for the same reason as `templateEvents` --
 * only the first stage is exposed (as `mission`, below), and with
 * `advanceWhen` stripped, so later stages and their trigger conditions
 * aren't spoiled up front. Stage 2+ only ever arrives dynamically through
 * `/api/chat`'s `mission` field once the Narrator judges it's been reached.
 */
export function getAllPublic() {
  const publicScenarios = scenarios.map(
    ({
      id,
      title,
      preview,
      setting,
      npcId,
      opener,
      narratorOpening,
      narratorAtmosphere,
      voiceIntro,
      teachingPoint,
      practiceLabel,
      color,
      responseOptions,
      missions,
    }) => ({
      id,
      title,
      preview,
      setting,
      aiRole: formatAiRole(getNpcById(npcId)),
      opener,
      narratorOpening,
      narratorAtmosphere,
      voiceIntro,
      teachingPoint,
      practiceLabel,
      color,
      responseOptions: (responseOptions ?? []).map(({ id: optionId, text }) => ({
        id: optionId,
        text,
      })),
      mission: getInitialMission(missions),
    })
  );

  return { scenarios: publicScenarios, difficultyGoals: getAllDifficultyGoals() };
}

/** The mission panel's starting state -- stage 1, every objective unchecked,
 * `advanceWhen` stripped (it's the hidden trigger condition, never sent to
 * the client). Returns null for any scenario without authored missions.
 * `isFinalStage` tells the client whether this is the last authored stage
 * (never true for stage 1 today, since every scenario has 2 stages, but
 * computed generically rather than hardcoded) -- the client uses it, paired
 * with every objective being complete, to know when to auto-trigger the
 * Reflection (see routes/api.js's own `isFinalStage` on the same shape). */
function getInitialMission(missions) {
  const stage = missions?.[0];
  if (!stage) return null;
  return {
    stageId: stage.id,
    missionText: stage.missionText,
    objectives: stage.objectives.map(({ id, text }) => ({ id, text, completed: false })),
    isFinalStage: missions.length === 1,
  };
}

/** Full scenario object, including npcId/secondaryNpcId/templateEvents, for
 * internal engine use only. */
export function getById(id) {
  return scenarios.find((s) => s.id === id);
}
