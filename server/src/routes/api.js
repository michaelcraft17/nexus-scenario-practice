import { Router } from "express";
import { getAllPublic, getById } from "../data/scenarioStore.js";
import { getById as getNpcById, formatAiRole } from "../data/npcStore.js";
import {
  generateReply,
  explainMessage,
  generateReflection,
  generateHint,
  generateNarratorUpdate,
} from "../engine/dialogueEngine.js";
import { computeConversationBalance } from "../engine/conversationStats.js";
import { buildSceneAnchor, renderNpcBlueprint, buildVoiceContinuityAddendum } from "../engine/npcPromptBuilder.js";
import { createRealtimeClientSecret } from "../engine/openaiClient.js";

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

/** Resolve the client-reported mission stage against this scenario's
 * authored stage list, falling back to the first stage for anything
 * missing/unrecognized (same defensive-default pattern as resolveDifficulty). */
function resolveStageIndex(missions, stageId) {
  const index = missions.findIndex((s) => s.id === stageId);
  return index === -1 ? 0 : index;
}

/** Merge the model's mission-tracking judgment with the client's known state
 * into the mission shape sent back to the client. Two guards against a
 * single flaky model call corrupting session state (the server is
 * stateless, so this recomputes fresh every turn rather than trusting an
 * incremental diff):
 * - Stage only ever moves forward: the resolved stage is whichever of the
 *   client's and the model's reported stage is *later* in the authored
 *   order, never earlier.
 * - Objectives only ever get checked, never unchecked: the resolved
 *   completed set is the union of what the client already knew and what
 *   the model reports now, filtered to the resolved stage's own objective
 *   ids (a stray id from a stage transition doesn't leak across stages). */
function resolveMission(missions, clientStageId, clientCompletedIds, update) {
  const clientIndex = resolveStageIndex(missions, clientStageId);
  const modelIndex = resolveStageIndex(missions, update.activeStageId);
  const resolvedIndex = Math.max(clientIndex, modelIndex);
  const resolvedStage = missions[resolvedIndex];

  const validIds = new Set(resolvedStage.objectives.map((o) => o.id));
  const completed = new Set(
    [...(Array.isArray(clientCompletedIds) ? clientCompletedIds : []), ...update.completedObjectiveIds].filter((id) =>
      validIds.has(id)
    )
  );

  return {
    stageId: resolvedStage.id,
    missionText: resolvedStage.missionText,
    objectives: resolvedStage.objectives.map(({ id, text }) => ({
      id,
      text,
      completed: completed.has(id),
    })),
    // The client uses this, paired with every objective being complete, to
    // know when the whole mission (not just the current stage) is done --
    // that's what auto-triggers the Reflection now (see ChatScreen.jsx).
    isFinalStage: resolvedIndex === missions.length - 1,
  };
}

router.get("/scenarios", (req, res) => {
  res.json(getAllPublic());
});

router.post("/chat", async (req, res, next) => {
  try {
    const { scenarioId, messages, difficulty, firedEventIds, activeMissionStageId, completedObjectiveIds } =
      req.body ?? {};

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

    // The Narrator's proactive update (subtext + mission tracking) is a
    // nice-to-have, not the critical path -- if it fails for any reason,
    // the chat reply still succeeds and narratorNote/mission are simply
    // omitted, rather than failing the whole turn.
    let narratorNote = null;
    let mission = null;
    try {
      const contextWithReply = [...messages, { role: "assistant", content: message }];
      const clientStageId = scenario.missions[resolveStageIndex(scenario.missions, activeMissionStageId)].id;
      const update = await generateNarratorUpdate(
        getAiRoleForScenario(scenario),
        contextWithReply,
        scenario.missions,
        clientStageId
      );
      narratorNote = update.subtext;
      mission = resolveMission(scenario.missions, clientStageId, completedObjectiveIds, update);
    } catch (narratorErr) {
      console.error("Narrator update failed (non-fatal):", narratorErr);
    }

    res.json({
      message,
      event: event ? { id: event.id, type: event.eventType, text: event.text } : null,
      narratorNote,
      mission,
    });
  } catch (err) {
    next(err);
  }
});

/** Mints a scoped, short-lived Realtime API credential for a live voice call
 * with this scenario's NPC -- same personality (scene anchor + NPC
 * blueprint) the text chat uses, folded into one instructions string, plus
 * that NPC's assigned voice. The browser takes this straight to OpenAI over
 * WebRTC; our server never sees or relays the call's audio. */
router.post("/realtime-session", async (req, res, next) => {
  try {
    const { scenarioId } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    const npc = getNpcById(scenario.npcId);
    const instructions =
      buildSceneAnchor(scenario, "advanced") +
      renderNpcBlueprint(npc) +
      buildVoiceContinuityAddendum(scenario);

    const session = await createRealtimeClientSecret({ instructions, voice: npc.voice });

    res.json({ ...session, npcName: npc.name });
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
