# Progress

Living doc — update this across sessions this week rather than relying on
memory of what's been done. Last updated: 2026-08-02 (scene-setting framing
to reduce AI drift; see below). Earlier the same day: new scenario content +
Hint feature. Originally built 2026-08-01, then switched from Claude to
OpenAI the same day.

## What's built (Phase 1 — text prototype)

- [x] **Scene-setting framing (v3)**: two new fields per scenario in
      `scenarios.json` --
      `preview` (1-2 sentence hook shown on the picker card, so the user
      knows what they're walking into before clicking -- `ScenarioCard.jsx`)
      and `sceneSetting` (2-4 sentence scene-direction paragraph, not
      dialogue, shown once right before the AI's opening line via the new
      `SceneIntro.jsx` component -- establishes who the user is playing, who
      the AI is playing, and the immediate situation). `sceneSetting` does
      double duty: the *same* text is also prepended to the system prompt in
      `generateReply` (`dialogueEngine.js`) on every single `/api/chat` call.
      Since the API is stateless and the full system prompt is resent every
      turn, this makes it a genuine persistent anchor against drift, not a
      one-time instruction -- the model gets re-grounded in who it's playing
      and the situation on every reply, however long or unscripted the
      conversation gets, without constraining how the user's side can go.
- [x] Scenario content, v2: all 4 scenarios replaced in
      `server/src/data/scenarios.json` with content based on real first-person
      accounts from the autistic community -- The Missing Details, The
      Unexpected Conversation, Too Much Happening at Once, Asking for a
      Change. Each has a roleplay `systemPrompt` with explicit branches for
      how the AI character should react to different response styles (e.g.
      self-blaming vs. blaming vs. asking a clarifying question), plus a
      `responseOptions` array of a few example replies (not exhaustive).
- [x] Non-conformity framing: the app never coaches the user to "act normal"
      or evaluates responses on social conformity -- only on whether a need
      was communicated and understood. Applied in three places: user-facing
      copy (README, and worth adding to the picker screen -- see Open
      decisions), a shared `NON_CONFORMITY_FRAMING` string reused across the
      explain/feedback/hint system prompts (`server/src/engine/prompts.js`),
      a short clause in the roleplay continuity addendum
      (`dialogueEngine.js generateReply`) telling the AI character to react
      to content/intent, not to phrasing that sounds "typical," and an intro
      paragraph on the scenario picker screen (`ScenarioPicker.jsx`) so
      users see the framing before they ever start a scenario.
- [x] Express server skeleton (`server/src/index.js`) — CORS, JSON body
      parsing, central error handler that never leaks stack traces or the API
      key to the client.
- [x] Dialogue engine (`server/src/engine/`) — `dialogueEngine.js` has four
      pure-ish functions (`generateReply`, `explainMessage`, `generateHint`,
      `generateFeedback`) that take plain data and return plain text, with no
      HTTP/Express references. This is the intended seam for Phase 3 voice.
- [x] Shared prompt templates for "explain that", "hint", and "feedback"
      modes (`server/src/engine/prompts.js`) — scenario-agnostic, so one copy
      serves all 4 scenarios. `EXPLAIN_SYSTEM_PROMPT` was generalized beyond
      sarcasm/irony detection to cover vague, indirect, or unstated
      expectations too, since only 1 of the 4 new scenarios is sarcasm-heavy.
- [x] **New feature: "Need a hint?"** — always-visible button in the chat
      header. Calls `POST /api/hint` with the conversation so far (plus
      whatever's currently typed but not sent); returns 1-2 short example
      directions, explicitly not a copy-paste script. Shown in a dismissible
      bar above the input, never added to the message history sent back to
      `/api/chat` (same "can't corrupt the roleplay" pattern as "Explain
      that").
- [x] **New: response-option chips** — before the user's first reply in a
      scenario, `ResponseOptions` shows the scenario's example responses as
      tappable chips (no "recommended" labels shown -- that would spoil the
      practice). Tapping one fills the input for the user to send or edit;
      free text always works too, chips disappear after the first reply.
- [x] API routes: `GET /api/scenarios`, `POST /api/chat`, `POST
      /api/explain`, `POST /api/hint`, `POST /api/feedback`, all in
      `server/src/routes/api.js`, with input validation (400s) and
      unknown-scenario handling (404s).
- [x] `scenarioStore.js` — strips `systemPrompt` before scenario data reaches
      the client, and strips each response option's internal `note` field
      (which one is "recommended" and why) for the same spoiler reason.
- [x] React client scaffold (Vite) with a single `services/api.js` module —
      the only place that calls `fetch()`, matching the same decoupling
      intent as the backend engine.
- [x] Scenario picker screen — fetches from the backend, color-block
      placeholder reserving image space, title, `preview` hook, teaching
      point. (The old terse `setting` line was dropped from the card once
      `preview` covered the same orienting purpose better prose-wise;
      `setting` still exists in the data and is used as the small caption in
      the chat screen's colored scene band.)
- [x] Chat screen — colored scene band (short `setting` caption), then a new
      `SceneIntro` narration block (`sceneSetting`, see above), then the
      static opener rendered with no API call, then turn-by-turn chat.
      "Explain that" under every AI bubble (including the opener),
      always-visible "Exit scenario" button, "Need a hint?" button, "Get
      feedback" button opening a descriptive (never numeric) feedback panel.
      Header is two rows (Exit + title + Feedback on top, Hint below) to
      fit the extra button without crowding on narrow screens.
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
- **Response-option chips scope (interpretation call)**: the spec described
  A/B/C example responses as "options to offer" for each scenario's key
  decision moment. Implemented as tappable chips shown only before the
  user's *first* reply (the one moment common to all 4 scenarios), not
  re-offered at other points in the conversation -- e.g. scenario 3's
  sensory-overload need could realistically come up a few turns in, not
  just at the opener. If that's wanted, it'd mean either the roleplay model
  itself surfacing an "offer some options?" moment, or a second dedicated
  button -- worth a product decision, not just an engineering one.
- **Hint button placement (interpretation call)**: spec said "alongside
  Explain that and Exit scenario," which live in different places (per
  message vs. header). Placed Hint in the header as an always-visible
  second row, both because it's functionally closest to Exit scenario
  (an always-available support action) and because a per-message hint
  didn't fit the feature's purpose (helping with the *next*, unwritten
  reply). Easy to move if this isn't what was pictured.
- **Drift anchor scope**: `sceneSetting` is currently only prepended to the
  roleplay system prompt (`generateReply`) -- not passed into explain/hint/
  feedback, which already get the actual transcript as context and don't
  generate new in-character dialogue, so they didn't seem to need it. If
  explain/hint responses ever seem to lose track of the situation on a long
  transcript, that'd be the first place to add it.

## Resuming a session

1. `cd server && npm install && npm run dev` (needs `server/.env` with a
   real `OPENAI_API_KEY` — copy from `.env.example` if starting fresh).
2. `cd client && npm install && npm run dev`, open the printed localhost URL.
3. Check this file's "What's next" section before starting new work, and
   update the checklist above as you go.
