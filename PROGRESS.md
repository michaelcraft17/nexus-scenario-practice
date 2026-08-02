# Progress

Living doc — update this across sessions this week rather than relying on
memory of what's been done. Last updated: 2026-08-02 -- **major architecture
shift (v5), not a small tweak**: Nexus moved from live-generated NPC dialogue
to a pre-built "social simulation" model (NPC blueprints, template events, a
Narrator that acts as social director, difficulty levels, multi-NPC
support). Full writeup below and in the README's new "Core principle:
pre-built social simulation" section. Earlier the same day, in order: the
app was renamed IncludAI -> Nexus and the Narrator was introduced as a
distinct layer (v4); before that, scene-setting framing to reduce AI drift
(v3); before that, new scenario content + the Hint feature (v2). Originally
built 2026-08-01 on Claude, switched to OpenAI the same day.

## v5 — Pre-built social simulation architecture (this session, major)

**Core principle, now the organizing idea of the whole backend:** *NPCs
create the interaction. The Narrator creates understanding.* The AI no
longer receives an open-ended "be creative, you are this character" prompt.
It receives a pre-built NPC blueprint, the current scene state, and at most
one pre-built template event, assembled into a compact prompt -- never asked
to invent a personality, a background fact, or a plot beat on its own. This
directly targets three things: character consistency across a whole
session, lower token cost per turn (bulleted blueprint data vs. hand-written
prose), and drift prevention (the model has nowhere to improvise *from*).

- [x] **NPC blueprints** (`server/src/data/npcs.json` + `npcStore.js`) --
      structured data replacing the old freeform `systemPrompt` per
      scenario. Five blueprints: Priya (manager), Dana (cashier), Marcus
      (hairstylist), Jamie (secondary -- see below), Ms. Alvarez (teacher).
      Each has: basic info (name/age/occupation/relational role),
      personality traits, communication style, background facts, generic
      social behavior rules (reactions to short answers / engagement /
      going quiet), a list of scenario-specific `{trigger, reaction}` pairs
      (this is where the old detailed branching logic -- e.g. Priya's
      manager reacting differently to a clarifying question vs. a
      self-blaming apology vs. being blamed outright -- now lives, as
      structured data instead of a paragraph), and goals. Never sent to the
      client, same reasoning as the old `systemPrompt`.
- [x] **`npcPromptBuilder.js`** -- renders a blueprint into the actual
      system prompt (`renderNpcBlueprint`), builds the scene anchor
      (`buildSceneAnchor`, now folding in the difficulty goal), builds the
      continuity addendum (explicitly: "do not invent new personality
      traits, background facts, or plot developments beyond what's given"),
      and folds a selected template event into the prompt
      (`buildEventInjection`). Also owns the shared `DIFFICULTY_GOALS` data
      (see below) so it's defined once, not duplicated per scenario.
- [x] **`sceneDirector.js`** -- the Narrator acting as social director,
      deliberately implemented as a **plain heuristic, not an LLM call**:
      - `detectStall(messages)`: true when both the NPC's last line and the
        user's new reply are low-content (≤2 words, or a short filler-word
        match like "yeah"/"ok"/"nice"). Free, deterministic, no added
        latency or token cost on every turn just to check this.
      - `selectTemplateEvent(...)`: picks a template event for this turn.
        On a stall, always tries a `"stall"`-trigger event (the graceful
        way out of dead air the spec asked for). Otherwise, above beginner
        difficulty, a 20% per-turn chance of a `"random"` flavor event.
        `requiresSecondaryNpc` events additionally need both an active
        secondary NPC and advanced difficulty. Avoids repeating an event
        while others in its pool haven't fired yet (tracked via
        client-sent `firedEventIds` -- see below), falling back to allowing
        repeats only once a pool is exhausted.
- [x] **`generateReply` rewritten as an orchestrator**
      (`dialogueEngine.js`): now `(scenario, npc, messages, {difficulty,
      firedEventIds, hasSecondaryNpc}) -> {text, event}`. Runs stall
      detection + event selection first (both free), assembles the system
      prompt from scene anchor + rendered blueprint + event injection +
      continuity addendum, then makes exactly one model call. Still just
      one model call for the reply itself -- the architecture shift changed
      *what* goes into that call, not how many calls it takes.
- [x] **Template events** -- each scenario's `templateEvents` array in
      `scenarios.json` (3-5 events each) is its library of possible beats:
      `id`, `trigger` (`"stall"` | `"random"`), `eventType`
      (`"atmosphere"` | `"secondaryNpcLine"`), fixed `text` (the model never
      generates this), `difficulty` eligibility, optional
      `requiresSecondaryNpc`. When one fires, its `id`/`type`/`text` come
      back from `/api/chat` as `event`, rendered client-side as a
      `NarratorNote` right before the NPC reply it set up (narrated, not
      spoken by the NPC) -- and the client appends its id to
      `firedEventIds`, sent on every subsequent `/api/chat` call so the
      Narrator doesn't repeat itself while other options remain.
- [x] **Narrator's fourth job: intervention.** The README's Narrator
      section now lists four jobs, not three -- opening, atmosphere,
      subtext (existing), and this session's addition: stepping in with an
      atmospheric beat specifically when the conversation stalls, so the
      NPC gets a natural segue instead of awkwardly re-asking a question.
- [x] **Difficulty levels** -- beginner / intermediate / advanced, chosen
      via three buttons directly on each scenario card (`ScenarioCard.jsx`
      restructured from a single whole-card button to a card + 3 explicit
      difficulty buttons). `DIFFICULTY_GOALS` (three short descriptions,
      matching the spec's per-tier social goals almost verbatim) lives once
      in `npcPromptBuilder.js` and is returned from `GET /api/scenarios` as
      a top-level `difficultyGoals` object (response shape changed from a
      bare array to `{scenarios, difficultyGoals}` -- see below) rather
      than being duplicated as client-side UI copy. The chosen difficulty
      is sent with every `/api/chat` call and shapes both the Narrator's
      opening framing (an extra sentence in `NarratorIntro`) and which
      template events are eligible that turn. Shown as a small badge in
      the chat header for orientation (not explicitly requested, low-cost
      addition).
- [x] **Multiple NPCs, proven on one scenario** -- "Too Much Happening at
      Once" (the salon) gets a `secondaryNpcId` (Jamie). Per the spec's
      "don't overbuild this," Jamie's interjections are **pre-written
      template events** (`eventType: "secondaryNpcLine"`), not a second
      live model call -- narrated the same way an atmosphere beat is,
      gated to advanced difficulty. Jamie still has a full blueprint in
      `npcs.json` for schema completeness and as a natural upgrade path
      (a future pass could make Jamie's lines live-generated from that
      blueprint without touching the event-selection architecture), but
      that upgrade wasn't built this pass -- see Open decisions.
- [x] **API surface changes**: `GET /api/scenarios` now returns
      `{scenarios, difficultyGoals}` instead of a bare array (client
      updated to match). `POST /api/chat` request gains `difficulty`
      (defaults to `"beginner"` if missing/invalid -- not worth a 400 over)
      and `firedEventIds`; response gains `event` (`{id, type, text}` or
      `null`) alongside the existing `message`/`narratorNote`.
      `explainMessage`/`generateFeedback`/`generateHint`/
      `generateNarratorSubtext` in `dialogueEngine.js` now take an explicit
      `aiRole` string parameter instead of reading `scenario.aiRole`
      (which no longer exists as stored data -- `aiRole` is now derived
      once per request in `routes/api.js` via
      `formatAiRole(getNpcById(scenario.npcId))`, and the now-unused
      `scenario` parameter was dropped from those four functions rather
      than left dead).
- [x] `scenarioStore.js` updated: `getAllPublic()` derives `aiRole` from
      the linked NPC blueprint (single source of truth, no more storing it
      redundantly on the scenario) and returns the new `{scenarios,
      difficultyGoals}` shape; still excludes `npcId`/`secondaryNpcId`/
      `templateEvents` from the client payload, same privacy reasoning as
      the old `systemPrompt` exclusion.

## What's built (through v4, still current)

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
      in-scene AI character. Originally three jobs (a fourth, intervention
      on stalls, was added in v5 -- see above; see the README's "The
      Narrator" section for the current full writeup):
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
      Change. Originally had a roleplay `systemPrompt` with explicit
      branches for how the AI character should react to different response
      styles (e.g. self-blaming vs. blaming vs. asking a clarifying
      question); as of v5 those branches live as structured
      `scenarioReactions` on the linked NPC blueprint instead (see v5
      above) -- same content, restructured as data. Also has a
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
  likely reuse the NPC-blueprint-rendered system prompt (`npcPromptBuilder.js`)
  directly, which if anything got easier to carry over since v5 (it's
  structured data assembly now, not a hand-written paragraph). Still
  undecided whether `dialogueEngine` gains a streaming/session-oriented
  variant to pair with the Realtime API's own streaming model, or whether
  voice stays request/response with STT feeding into the existing
  `generateReply` and TTS wrapping its output; also undecided whether
  stall detection / template events make sense at all in a live-voice
  context (a "stall" reads very differently when the user might just be
  thinking, not typing). Worth revisiting once actually building Phase 3.
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
- **Secondary NPC lines are template text, not live-generated
  (interpretation call, v5)**: the spec's "don't overbuild this" pointed
  toward the simplest thing that proves the pattern. Jamie's interjections
  in the salon scenario are pre-written `secondaryNpcLine` events, narrated
  rather than spoken as a distinct character bubble -- no second model
  call, no speaker-attribution plumbing through explain/hint/feedback. The
  blueprint schema fully supports a live secondary voice (Jamie has a
  complete blueprint, `npcPromptBuilder.renderNpcBlueprint` works on any
  NPC, not just primaries) -- upgrading to a real second LLM character
  later is a matter of wiring, not a schema change.
- **Stall-detection heuristic is unvalidated**: `detectStall`'s "≤2 words
  or a filler word" rule is a reasonable-sounding guess, not something
  tuned against real conversation transcripts. It may fire too eagerly
  (interrupting a user who's just being naturally terse) or not eagerly
  enough (missing a real stall phrased in more words). Worth watching in
  play-testing and adjusting the word-count/filler-list thresholds in
  `sceneDirector.js` directly -- no architecture change needed, just
  number-tuning.
- **20% random-event chance is a guess**: `RANDOM_EVENT_CHANCE` in
  `sceneDirector.js` was picked to feel occasional without being constant,
  not derived from anything. If intermediate/advanced scenarios feel too
  busy or too quiet in testing, this is the one constant to adjust.
- **`firedEventIds` tracking lives client-side only**: consistent with the
  rest of the app's stateless-backend design (the client is already the
  source of truth for conversation history), but it does mean a page
  refresh mid-conversation forgets which events already fired, and a
  conversation could theoretically see the same "random" event twice
  across a refresh. Same tradeoff class as losing the whole conversation
  on refresh already accepted elsewhere in the app -- not a new risk, just
  flagging it applies here too.
- **Narrator/social-director cost stacks (extends the existing "Narrator
  subtext cost/latency" item above)**: a turn can now involve up to two
  free heuristic checks (stall detection, event selection) plus the same
  two model calls as before (reply, then subtext) -- the heuristics don't
  add API cost, but it's worth being clear that v5 didn't reduce the
  per-turn call count, it changed what goes *into* the first call's
  prompt. Token cost per call should be lower on average now (bulleted
  blueprint vs. paragraph systemPrompt), but that hasn't been measured,
  only assumed from the design.

## Resuming a session

1. `cd server && npm install && npm run dev` (needs `server/.env` with a
   real `OPENAI_API_KEY` — copy from `.env.example` if starting fresh).
2. `cd client && npm install && npm run dev`, open the printed localhost URL.
3. Check this file's "What's next" section before starting new work, and
   update the checklist above as you go.
