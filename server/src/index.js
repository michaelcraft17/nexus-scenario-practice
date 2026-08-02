import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : {}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRouter);

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
