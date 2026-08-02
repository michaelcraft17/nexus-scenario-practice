import { Router } from "express";
import { getAllPublic, getById } from "../data/scenarioStore.js";
import {
  generateReply,
  explainMessage,
  generateFeedback,
} from "../engine/dialogueEngine.js";

const router = Router();

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

router.get("/scenarios", (req, res) => {
  res.json(getAllPublic());
});

router.post("/chat", async (req, res, next) => {
  try {
    const { scenarioId, messages } = req.body ?? {};

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

    const message = await generateReply(scenario, messages);
    res.json({ message });
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

    const explanation = await explainMessage(scenario, contextMessages, targetMessage);
    res.json({ explanation });
  } catch (err) {
    next(err);
  }
});

router.post("/feedback", async (req, res, next) => {
  try {
    const { scenarioId, messages } = req.body ?? {};

    const scenario = getById(scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Unknown scenario." });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({ error: "messages must be a non-empty array of {role, content}." });
    }

    const feedback = await generateFeedback(scenario, messages);
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
