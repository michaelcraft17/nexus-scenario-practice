import { Router } from "express";
import { getAllPublic, getById } from "../data/scenarioStore.js";
import { getById as getNpcById, formatAiRole } from "../data/npcStore.js";
import {
  generateReply,
  explainMessage,
  generateReflection,
  generateHint,
  generateNarratorSubtext,
} from "../engine/dialogueEngine.js";
import { computeConversationBalance } from "../engine/conversationStats.js";

const router = Router();

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];

function isValidMessages(messages) {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
  );
}

/** Falls back to "advanced" for anything missing/invalid, rather than 400ing --
 * difficulty shapes tone, not correctness, so it's not worth rejecting a request over.
 * "advanced" is the only level the client UI offers now (beginner/intermediate were
 * removed as picker options), so that's the sane default rather than "beginner". */
function resolveDifficulty(value) {
  return DIFFICULTY_LEVELS.includes(value) ? value : "advanced";
}

/** Every route needs the scenario's display label for the character it's
 * talking about (transcript labels, explain/reflection/hint framing) --
 * derive it once here from the linked NPC blueprint. */
function getAiRoleForScenario(scenario) {
  return formatAiRole(getNpcById(scenario.npcId));
}

router.get("/scenarios", (req, res) => {
  res.json(getAllPublic());
});

router.post("/chat", async (req, res, next) => {
  try {
    const { scenarioId, messages, difficulty, firedEventIds } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({ error: "messages must be a non-empty array of {role, content}." });
    }
    if (messages[0].role !== "user") {
      return res.status(400).json({ error: "messages must start with role \"user\"." });
    }

    const npc = getNpcById(scenario.npcId);
    const { text: message, event } = await generateReply(scenario, npc, messages, {
      difficulty: resolveDifficulty(difficulty),
      firedEventIds: Array.isArray(firedEventIds) ? firedEventIds : [],
      hasSecondaryNpc: Boolean(scenario.secondaryNpcId),
    });

    // The Narrator's proactive subtext is a nice-to-have, not the critical
    // path -- if it fails for any reason, the chat reply still succeeds and
    // narratorNote is simply omitted, rather than failing the whole turn.
    let narratorNote = null;
    try {
      const contextWithReply = [...messages, { role: "assistant", content: message }];
      narratorNote = await generateNarratorSubtext(getAiRoleForScenario(scenario), contextWithReply);
    } catch (narratorErr) {
      console.error("Narrator subtext failed (non-fatal):", narratorErr);
    }

    res.json({
      message,
      event: event ? { id: event.id, type: event.eventType, text: event.text } : null,
      narratorNote,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/explain", async (req, res, next) => {
  try {
    const { scenarioId, contextMessages, targetMessage } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    if (!isValidMessages(contextMessages)) {
      return res.status(400).json({ error: "contextMessages must be a non-empty array of {role, content}." });
    }
    if (typeof targetMessage !== "string" || targetMessage.trim().length === 0) {
      return res.status(400).json({ error: "targetMessage is required." });
    }

    const explanation = await explainMessage(getAiRoleForScenario(scenario), contextMessages, targetMessage);
    res.json({ explanation });
  } catch (err) {
    next(err);
  }
});

router.post("/hint", async (req, res, next) => {
  try {
    const { scenarioId, contextMessages } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    if (!isValidMessages(contextMessages)) {
      return res.status(400).json({ error: "contextMessages must be a non-empty array of {role, content}." });
    }

    const hint = await generateHint(getAiRoleForScenario(scenario), contextMessages);
    res.json({ hint });
  } catch (err) {
    next(err);
  }
});

router.post("/reflection", async (req, res, next) => {
  try {
    const { scenarioId, messages } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({ error: "messages must be a non-empty array of {role, content}." });
    }

    const npc = getNpcById(scenario.npcId);
    const aiRole = formatAiRole(npc);
    const reflection = await generateReflection(aiRole, messages);
    // The balance label is just a participant name (e.g. "Marcus"), not
    // the fuller "Marcus (hairstylist)" used in the transcript sent to the
    // model -- the role annotation isn't needed for a simple percent split.
    const balance = computeConversationBalance(messages, npc.name);

    res.json({ ...reflection, balance });
  } catch (err) {
    next(err);
  }
});

export default router;
