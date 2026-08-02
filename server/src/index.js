import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import apiRouter from "./routes/api.js";
import { apiRateLimiter, globalDailyCap } from "./middleware/costGuard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// A committed copy of `client`'s production build (see server/public/README.md
// for why it's committed rather than built on deploy), served directly so
// this one service is both the API and the website -- one URL, no CORS to
// configure. Railway's "root directory: server" setting scopes the actual
// build context to this folder alone, so a build step reaching out to
// ../client (a sibling the container never receives) isn't an option here.
// In local dev this directory doesn't exist unless manually built -- the
// client normally runs on its own Vite dev server instead (see
// client/vite.config.js's proxy) -- so everything below is skipped
// entirely rather than erroring.
const clientDist = join(__dirname, "../public");
const hasClientBuild = existsSync(clientDist);

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

if (hasClientBuild) {
  app.use(express.static(clientDist));
  // SPA fallback: this app has no client-side router (App.jsx just swaps
  // components on internal state, see PROGRESS.md), so there's nothing to
  // match against a URL -- this exists only so a hard refresh or a shared
  // link to "/" (the only real route) still resolves. /api and /health are
  // already handled above by the time a request reaches here.
  app.get("*", (req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

// Central error handler -- never leak stack traces or key material to the
// client. Registered last so it also catches anything thrown by the static/
// SPA-fallback handlers above, not just the /api routes.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong talking to the AI. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Nexus server listening on http://localhost:${PORT}`);
  console.log(hasClientBuild ? "Serving the built client from " + clientDist : "No client build found -- API-only mode (local dev).");
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is not set. /api/chat, /api/explain, and /api/reflection will fail until it is.");
  }
});
