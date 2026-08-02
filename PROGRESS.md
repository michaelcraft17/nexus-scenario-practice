# Progress

Living doc — update this across sessions this week rather than relying on
memory of what's been done. Last updated: 2026-08-02 (renamed the app to
Nexus; added the Narrator as a distinct architectural layer, replacing the
earlier scene-setting paragraph -- see below). Earlier the same day: scene-
setting framing to reduce AI drift, then before that, new scenario content +
Hint feature. Originally built 2026-08-01, then switched from Claude to
OpenAI the same day.

## What's built (Phase 1 — text prototype)

- [x] **Renamed IncludAI -> Nexus (v4)**: the app's own name/branding
      changed everywhere self-referential -- `index.html` title and Apple
      web-app meta tags, the picker screen's `<h1>`, the server startup log,
      both `package.json` `name` fields (`nexus-server`/`nexus-client`), and
      README. Left unchanged, deliberately: the hackathon's own name ("the
      IncludAI Neurodiversity Hackathon") is an external fact, not our
      branding, so that reference stays as-is; the project's on-disk folder
      name (`includai-scenario-practice/`) also wasn't renamed, to avoid
      unrelated path churn -- just the product name/UI text changed.
- [x] **The Narrator (v4)** -- a new architectural layer, distinct from the
      in-scene AI character, with three jobs (see the README's "The
      Narrator" section for the full writeup):
      1. **Opening** -- `scenario.narratorOpening`, a goal/mission-style
         framing (situation + a general, non-diagnostic nod to why this is
         worth practicing + the practice goal), replacing the flatter old
         `sceneSetting` field.
      2. **Atmosphere** -- `scenario.narratorAtmosphere`, sensory/social
         environment description (noise, crowding, multiple things
         happening at once) shown alongside the opening.
      3. **Subtext** -- proactive, not just on-request: after every
         `/api/chat` turn, a new `generateNarratorSubtext` call
         (`dialogueEngine.js`, prompt in `prompts.js`) decides whether the
         exchange that just happened has a hidden social dynamic worth
         quietly surfacing, and says nothing (`NONE`, never shown) most of
         the time. When it does have something, `routes/api.js` returns it
         as `narratorNote` alongside the reply in the *same* `/api/chat`
         response (one round trip, not two), and the client renders it as
         an interspersed `NarratorNote` after the exchange it's about.
      Visually distinct from character dialogue throughout: a shared
      `.narrator-box` CSS class (serif italic type, left-accent border) used
      by the opening/atmosphere block (`NarratorIntro.jsx`), inline subtext
      (`NarratorNote.jsx`), and restyled to also cover "Explain that"'s
      output (`bubble__explanation`) -- since that's the same voice, just
      on-demand instead of proactive, this ties them together visually.
      Both `narratorOpening` and `narratorAtmosphere` are also prepended to
      the roleplay system prompt on *every* `/api/chat` call (the API is
      stateless, so the full system prompt is resent every turn) -- the
      same persistent-anchor mechanism the old `sceneSetting` used, now
      carrying the Narrator's actual opening content instead. Explicit
      design goal, folded into both the anchor and the subtext prompt: this
      is not teaching a rigid social script or coaching the user to mask --
      it's meant to support exploring different communication strategies
      and building confidence, never pushing toward one "correct" way to
      act.
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
- [x] Dialogue engine (`server/src/engine/`) — `dialogueEngine.js` has five
      pure-ish functions (`generateReply`, `explainMessage`, `generateHint`,
      `generateFeedback`, `generateNarratorSubtext`) that take plain data and
      return plain text, with no HTTP/Express references. This is the
      intended seam for Phase 3 voice.
- [x] Shared prompt templates for "explain that", "hint", "feedback", and
      "narrator subtext" modes (`server/src/engine/prompts.js`) —
      scenario-agnostic, so one copy serves all 4 scenarios.
      `EXPLAIN_SYSTEM_PROMPT` was generalized beyond sarcasm/irony detection
      to cover vague, indirect, or unstated expectations too, since only 1 of
      the 4 scenarios is sarcasm-heavy.
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
- [x] Chat screen — colored scene band (short `setting` caption), then the
      `NarratorIntro` block (opening + atmosphere, see above), then the
      static opener rendered with no API call, then turn-by-turn chat with
      `NarratorNote` asides interspersed wherever the Narrator has something
      to say. "Explain that" under every AI bubble (including the opener),
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
- **Drift anchor scope**: `narratorOpening`/`narratorAtmosphere` are
  currently only prepended to the roleplay system prompt (`generateReply`)
  -- not passed into explain/hint/feedback, which already get the actual
  transcript as context and don't generate new in-character dialogue, so
  they didn't seem to need it. If explain/hint responses ever seem to lose
  track of the situation on a long transcript, that'd be the first place to
  add it.
- **Narrator subtext cost/latency**: `generateNarratorSubtext` runs as a
  second model call on *every* `/api/chat` turn (folded into the same HTTP
  response so it's not a second round trip, but it is a second call to
  OpenAI, made sequentially after the reply). This roughly doubles latency
  and per-turn cost on every message, whether or not the Narrator ends up
  having anything to say. Acceptable for a hackathon prototype; if it feels
  slow in testing, options include running it in parallel with... well,
  there's nothing to parallelize it with since it needs the reply text
  first, so the real levers are: skip it probabilistically (e.g. only
  evaluate on every 2nd-3rd turn), make it opt-in via a header/query param
  the client controls, or accept the latency as part of the experience.
- **Narrator/coach voice unification (not done)**: "Explain that" now
  *looks* like the Narrator (shared `.narrator-box` styling) but its system
  prompt still uses the older "communication coach" persona wording, not
  literally "You are the Narrator." Hint and Feedback are untouched --
  still their own coach persona, not styled or worded as the Narrator at
  all. Left this way deliberately to avoid renaming UI/behavior the user
  already knows from earlier sessions without being asked to. Worth a
  product decision: should all four break-the-fourth-wall surfaces
  (Explain, Hint, Feedback, Narrator subtext) formally become one
  consistent "Narrator" identity, or should Narrator stay scoped to what
  was actually asked for (opening/atmosphere/proactive subtext)?
- **"Mission/quest" framing (interpretation call)**: the spec asked for
  opening framing "like a mission/quest, not just a setting description."
  Implemented as goal-oriented prose (situation + general past-difficulty
  nod + stated practice goal, e.g. "Your goal is to practice...") rather
  than literal game-y language ("Quest:", XP, objectives lists) -- felt
  tonally more appropriate for an accessibility tool, and still satisfies
  the structural ask (situation, why-it-matters, goal). Easy to push more
  literally gamified if that's actually what was wanted.

## Resuming a session

1. `cd server && npm install && npm run dev` (needs `server/.env` with a
   real `OPENAI_API_KEY` — copy from `.env.example` if starting fresh).
2. `cd client && npm install && npm run dev`, open the printed localhost URL.
3. Check this file's "What's next" section before starting new work, and
   update the checklist above as you go.
