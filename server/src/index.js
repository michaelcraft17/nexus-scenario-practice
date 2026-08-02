import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";
import { apiRateLimiter, globalDailyCap } from "./middleware/costGuard.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Required for express-rate-limit to see each caller's real IP (not the
// load balancer's) when running behind a reverse proxy like Railway's.
app.set("trust proxy", 1);

app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : {}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Cost safeguards ahead of every /api route (all of them either call
// OpenAI directly or are cheap enough not to matter) -- see
// middleware/costGuard.js for why both a per-IP and a global limit exist.
app.use("/api", apiRateLimiter, globalDailyCap, apiRouter);

// Central error handler -- never leak stack traces or key material to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong talking to the AI. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Nexus server listening on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is not set. /api/chat, /api/explain, and /api/reflection will fail until it is.");
  }
});
