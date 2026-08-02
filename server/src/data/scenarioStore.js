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
      teachingPoint,
      color,
      responseOptions,
    }) => ({
      id,
      title,
      preview,
      setting,
      aiRole: formatAiRole(getNpcById(npcId)),
      opener,
      narratorOpening,
      narratorAtmosphere,
      teachingPoint,
      color,
      responseOptions: (responseOptions ?? []).map(({ id: optionId, text }) => ({
        id: optionId,
        text,
      })),
    })
  );

  return { scenarios: publicScenarios, difficultyGoals: getAllDifficultyGoals() };
}

/** Full scenario object, including npcId/secondaryNpcId/templateEvents, for
 * internal engine use only. */
export function getById(id) {
  return scenarios.find((s) => s.id === id);
}
