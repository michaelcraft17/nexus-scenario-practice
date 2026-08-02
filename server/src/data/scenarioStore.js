import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(
  readFileSync(join(__dirname, "scenarios.json"), "utf-8")
);

/**
 * Public scenario fields safe to send to the client. `systemPrompt` is
 * deliberately excluded -- it's the prompt-engineering "content" of the app
 * and should never leave the server.
 */
export function getAllPublic() {
  return scenarios.map(
    ({ id, title, setting, aiRole, opener, teachingPoint, color }) => ({
      id,
      title,
      setting,
      aiRole,
      opener,
      teachingPoint,
      color,
    })
  );
}

/** Full scenario object, including systemPrompt, for internal engine use only. */
export function getById(id) {
  return scenarios.find((s) => s.id === id);
}
