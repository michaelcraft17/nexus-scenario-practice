# Progress

Living doc — update this across sessions this week rather than relying on
memory of what's been done. Last updated: 2026-08-01 (Phase 1 initial build,
then switched from Claude to OpenAI the same day -- see below).

## What's built (Phase 1 — text prototype)

- [x] Scenario content: all 4 scenarios written in `server/src/data/scenarios.json`
      (New Coworker Small Talk, Manager Uses Sarcasm, Declining a Group Invite,
      Misunderstanding Recovery), each with a roleplay `systemPrompt`.
- [x] Express server skeleton (`server/src/index.js`) — CORS, JSON body
      parsing, central error handler that never leaks stack traces or the API
      key to the client.
- [x] Dialogue engine (`server/src/engine/`) — `dialogueEngine.js` has three
      pure-ish functions (`generateReply`, `explainMessage`,
      `generateFeedback`) that take plain data and return plain text, with no
      HTTP/Express references. This is the intended seam for Phase 3 voice.
- [x] Shared prompt templates for "explain that" and "feedback" modes
      (`server/src/engine/prompts.js`) — scenario-agnostic, so one copy
      serves all 4 scenarios.
- [x] API routes: `GET /api/scenarios`, `POST /api/chat`, `POST
      /api/explain`, `POST /api/feedback`, all in `server/src/routes/api.js`,
      with input validation (400s) and unknown-scenario handling (404s).
- [x] `scenarioStore.js` — strips `systemPrompt` before scenario data reaches
      the client.
- [x] React client scaffold (Vite) with a single `services/api.js` module —
      the only place that calls `fetch()`, matching the same decoupling
      intent as the backend engine.
- [x] Scenario picker screen — fetches from the backend, color-block
      placeholder reserving image space, title, setting, teaching point.
- [x] Chat screen — static opener rendered with no API call, turn-by-turn
      chat, "Explain that" under every AI bubble (including the opener),
      always-visible "Exit scenario" button, "Get feedback" button opening a
      descriptive (never numeric) feedback panel.
- [x] Mobile-first CSS — `100dvh` layout, safe-area insets for the iPhone
      home indicator, ≥44px tap targets, `apple-mobile-web-app-*` meta tags
      for a better "Add to Home Screen" experience.
- [x] `.env.example` on both sides; `.env` gitignored.
- [x] README with local run instructions.
- [x] Switched the AI provider from Claude (Anthropic) to OpenAI
      (`server/src/engine/openaiClient.js`, using `chat.completions.create`
      with model `gpt-4o` by default). The original spec called for Claude;
      switched same-day at the user's request since they only had an OpenAI
      key on hand. Nothing outside `openaiClient.js` and the env
      var names (`OPENAI_API_KEY`/`OPENAI_MODEL`) had to change -- the
      dialogue engine's `complete({system, messages, maxTokens})` interface
      is provider-agnostic by design.

## What's next

- **Phase 2 (polish)**: test all 4 scenarios end-to-end in a real browser on
  a phone; tune scenario `systemPrompt`s based on how the model actually
  plays them; consider a small loading/typing indicator polish pass; consider
  replacing color-block placeholders with real (free-license) stock images
  once picked, without changing any layout code (the `aspect-ratio` box
  already reserves the space).
- **Phase 3 (voice, OpenAI Realtime API)**: wire a voice input/output layer
  behind the existing seams — `client/src/services/api.js` on the frontend,
  `server/src/engine/dialogueEngine.js` on the backend. See the open decision
  below on streaming.

## Open decisions

- **Prompt caching**: skipped for Phase 1 -- not worth the complexity for the
  timeline given how short the scenario prompts are. Revisit if the
  explain/feedback templates grow (e.g. with few-shot examples) or if
  per-turn latency/cost becomes a problem.
- **Streaming**: `/api/chat`, `/api/explain`, and `/api/feedback` are all
  non-streaming request/response for now (simplest to build and debug this
  week). If typing-indicator latency feels bad in testing, consider streaming
  `/api/chat` specifically.
- **Model**: defaults to `gpt-4o` via `OPENAI_MODEL`. If iterating quickly
  during testing gets expensive or slow, swap to `gpt-4o-mini` in
  `server/.env` — no code changes needed. If OpenAI ships a newer default
  model by the time you're reading this, check
  https://platform.openai.com/docs/models and update `OPENAI_MODEL`.
- **Voice architecture (Phase 3)**: now simpler than originally planned,
  since text chat is already on OpenAI too — the OpenAI Realtime API can
  likely reuse `scenario.systemPrompt` and the same scenario data directly.
  Still undecided whether `dialogueEngine` gains a streaming/session-oriented
  variant to pair with the Realtime API's own streaming model, or whether
  voice stays request/response with STT feeding into the existing
  `generateReply` and TTS wrapping its output. Worth revisiting once actually
  building Phase 3.
- **Feedback trigger**: currently a manual "Get feedback" button only
  (available any time there's at least one user reply). Explicitly not
  auto-triggered on "Exit scenario" per the original spec — exiting should
  stay a fast, no-friction accessibility action, not gated behind a feedback
  screen.

## Resuming a session

1. `cd server && npm install && npm run dev` (needs `server/.env` with a
   real `OPENAI_API_KEY` — copy from `.env.example` if starting fresh).
2. `cd client && npm install && npm run dev`, open the printed localhost URL.
3. Check this file's "What's next" section before starting new work, and
   update the checklist above as you go.
