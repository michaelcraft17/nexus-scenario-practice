import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const npcs = JSON.parse(readFileSync(join(__dirname, "npcs.json"), "utf-8"));

/** Full NPC blueprint, for internal engine use only -- never sent to the client. */
export function getById(id) {
  return npcs.find((n) => n.id === id);
}

/** Short display label used both for the client (speaker names) and for
 * transcript rendering in explain/hint/reflection/narrator-subtext prompts. */
export function formatAiRole(npc) {
  return `${npc.name} (${npc.relationalRole})`;
}
