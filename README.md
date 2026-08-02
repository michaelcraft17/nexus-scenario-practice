# Nexus — Social Scenario Practice

Built for the IncludAI Neurodiversity Hackathon (Track 2: AI for Connection &
Wellbeing).

Nexus is a social scenario practice app for neurodivergent users. It's a
text-based roleplay: you pick an everyday scenario (a manager who gives a
vague task, a cashier making unprompted small talk, an overstimulating hair
salon, a teacher noticing you're distracted), an AI plays the other person,
and you practice replying — in a low-stakes, judgment-free space, with no
time pressure and no real-world consequences.

**Philosophy:** you're not being coached to "act normal" or mask. The app's
framing, throughout: *you are playing as a neurodivergent person navigating
everyday situations. Your goal is not to act "normal" — it's to understand
your needs, communicate them, and find a solution that works for you and
others.* Nothing in the app — the roleplay, the explanations, or the
feedback — ever evaluates how "typical" a response sounds. Only whether a
need got communicated and understood.

A few features make this a *practice* tool rather than just a chatbot:

- **The Narrator** — a distinct voice from the in-scene character (visually
  set apart in the UI, like a narration box in a visual novel). It frames
  each scenario before the character speaks, and can proactively step in
  after a notable exchange to explain the hidden social context behind what
  just happened — without judgment, and without being asked. See
  [below](#the-narrator) for the full picture.
- **"Explain that"** — under any AI message, you can also ask on demand to
  break character and plainly explain what the line meant, what the other
  person likely expected or needed, and what cues hinted at that (the same
  voice as the Narrator, just on request instead of proactive).
- **"Need a hint?"** — if you're stuck and don't know how to reply, this
  offers 1-2 gentle example directions to consider — not a script to
  copy-paste, just enough to get unstuck. Each scenario also offers a few
  example response directions before your first reply, if you want a
  starting point; typing your own is always fine too.
- **"Get feedback"** — at any point, you can ask for descriptive feedback on
  how the conversation went (e.g. "asking what the deadline should be gave
  the manager what they needed to actually help you"). Feedback is always
  descriptive prose — **never** a numeric score, percentage, or "rate
  yourself" mechanic, and never a comment on how "normal" a response sounded.

There's also an always-visible **"Exit scenario"** button. Real conversations
don't let you pause or leave — this deliberately does, on purpose, as an
accessibility feature.

Phase 1 (this version) is text-only. Voice (via the OpenAI Realtime API) is
planned for Phase 3 later this week; the backend's dialogue logic
(`server/src/engine/`) is written to be reusable from a future voice layer
without a rewrite — see [PROGRESS.md](./PROGRESS.md). Text chat and the
planned voice layer both run on OpenAI, which keeps the whole stack on one
provider.

## Architecture

```
client (React + Vite)  <--->  server (Express)  <--->  OpenAI API
```

The server is a thin proxy: the OpenAI API key only ever lives server-side,
never in frontend code. There's no database — conversation history lives in
the browser's React state for the duration of a session.

```
includai-scenario-practice/
├── server/            Express API, OpenAI integration, scenario/NPC data
│   └── src/
│       ├── index.js               app entry
│       ├── routes/api.js          GET /scenarios, POST /chat, /explain, /hint, /feedback
│       ├── engine/
│       │   ├── openaiClient.js    thin OpenAI SDK wrapper
│       │   ├── npcPromptBuilder.js  renders an NPC blueprint into a system prompt
│       │   ├── sceneDirector.js   stall detection + template event selection (no LLM call)
│       │   ├── prompts.js         explain/feedback/hint/narrator-subtext templates
│       │   └── dialogueEngine.js  orchestrates the above; the seam for Phase 3 voice
│       └── data/
│           ├── scenarios.json + scenarioStore.js   scenario framing, events, picker
│           └── npcs.json + npcStore.js             NPC blueprints (pre-built characters)
└── client/            React SPA (Vite)
    └── src/
        ├── services/api.js    the only module that calls fetch()
        └── components/        picker (with difficulty selection), chat screen,
                                message bubbles, Narrator (intro + inline notes),
                                feedback panel
```

Note: the project folder itself is still named `includai-scenario-practice/`
on disk — only the app's own name/branding changed to Nexus, not the
directory path, to avoid unrelated churn.

## Prerequisites

- Node.js 18+ (tested on Node 25)
- An OpenAI API key — get one at https://platform.openai.com/api-keys

## Running locally

You'll run two dev servers in two terminals.

**1. Start the backend:**

```sh
cd server
npm install
cp .env.example .env
# then edit .env and paste in your OPENAI_API_KEY
npm run dev
```

This starts the Express server on `http://localhost:3001`.

**2. Start the frontend, in a second terminal:**

```sh
cd client
npm install
npm run dev
```

This starts the Vite dev server, usually on `http://localhost:5173`. Open
that URL in your browser (or narrow the window / use devtools' device
toolbar to preview the mobile layout).

In dev, Vite proxies any request to `/api/*` straight through to the Express
server on port 3001 (see `client/vite.config.js`), so there's no CORS setup
needed locally and no API base URL to configure.

### Testing on your phone

Once both servers are running, run `npm run dev -- --host` in `client/`
instead of `npm run dev` to expose it on your local network, then open the
printed `http://<your-ip>:5173` URL on your phone (same Wi-Fi network). From
there you can use the browser's "Add to Home Screen" option to try it as a
standalone app icon.

## Environment variables

**`server/.env`** (copy from `server/.env.example`):

| Variable            | Required | Default          | Notes |
|----------------------|----------|------------------|-------|
| `OPENAI_API_KEY`     | Yes      | —                | From platform.openai.com/api-keys |
| `OPENAI_MODEL`       | No       | `gpt-4o`         | Swap to `gpt-4o-mini` for cheaper/faster iteration |
| `PORT`               | No       | `3001`           | |
| `CORS_ORIGIN`        | No       | (all origins)    | Only needed for a split deploy — set to the client's deployed URL |

**`client/.env`** (copy from `client/.env.example`, optional for local dev):

| Variable               | Required | Default | Notes |
|-------------------------|----------|---------|-------|
| `VITE_API_BASE_URL`     | No       | (empty, uses Vite proxy) | Only needed for a split deploy — set to the server's deployed URL |

## Deploying

No database, so this is deploy-anywhere-with-a-Node-runtime. A likely split:

- **Client** → Vercel or Netlify (`npm run build` in `client/`, serve `dist/`).
- **Server** → Railway or Render (`npm start` in `server/`, set the env vars
  above, including `CORS_ORIGIN` pointed at the deployed client URL).

Then set `VITE_API_BASE_URL` on the client build to the deployed server URL.

## Core principle: pre-built social simulation

> **NPCs create the interaction. The Narrator creates understanding.**

As of this version, the AI does not improvise a new character or plot each
time it runs. It performs **pre-built** NPCs (structured blueprints, not
freeform prompts) inside **pre-built** scenes, and can only draw on a small,
data-defined library of **template events** for anything beyond direct
dialogue. The Narrator (see below) decides *when* something happens; the
data decides *what* can happen. The model is never handed an open-ended "be
creative" prompt for any of this — it receives the relevant NPC blueprint,
the current scene state, and (at most) one template event, assembled into a
compact prompt. This is deliberate: it keeps characters consistent across a
whole session, keeps prompts short (lower token cost per turn), and
prevents the AI from drifting off-personality or inventing plot points that
have nothing to do with the scenario.

## Scenario content

All 4 scenarios live in one place: `server/src/data/scenarios.json`:

1. **The Missing Details** — a manager assigns a vague task; practice asking
   clarifying questions instead of over-apologizing or getting defensive.
2. **The Unexpected Conversation** — a cashier makes small talk after
   checkout; practice noticing that short, low-effort replies are enough.
3. **Too Much Happening at Once** — a loud, busy hair salon; practice
   naming a sensory need before it becomes overload. This is the one
   scenario with a secondary NPC (see below).
4. **Asking for a Change** — a teacher notices you're distracted in an
   uncomfortably bright classroom; practice self-advocacy for a reasonable
   adjustment.

Each scenario references its NPC by `npcId` (and, for the salon scenario, a
`secondaryNpcId`) rather than embedding a prompt — the actual character
definition lives in `npcs.json` (see below). A `responseOptions` array still
offers a few example replies per scenario (not exhaustive — free text always
works too); each option's internal `note` (which one is "recommended" and
why) is never sent to the browser, same reasoning as before — showing the
"answer" up front would defeat the point of practicing. A `preview` field
gives a 1-2 sentence hook shown on the picker card. `narratorOpening` and
`narratorAtmosphere` belong to the Narrator's opening framing (see below).
`templateEvents` is the scenario's small library of pre-built story beats —
see "Template events" below.

## NPC blueprints

`server/src/data/npcs.json` holds one blueprint per character — the AI's
manager, cashier, stylist, teacher, and one secondary character (Jamie, the
customer in the next salon chair). Each blueprint is structured data, not
prose:

- **Basic info** — name, age, occupation, and the scenario it belongs to.
- **Personality traits** — a short list (e.g. "busy," "well-intentioned,"
  "a little rushed").
- **Communication style** — formality, whether they use humor, how often
  they ask follow-ups, plus a free-text note.
- **Background** — a few concrete facts (how long at the job, what they're
  known for).
- **Social behavior rules** — generic reactions to three situations: the
  user gives short answers, the user seems engaged, the user goes quiet.
- **Scenario-specific reactions** — a list of `{trigger, reaction}` pairs
  for the particular decision points that scenario is built around (e.g.
  Priya's manager reacts very differently to a clarifying question vs. a
  self-blaming apology vs. being blamed outright).
- **Goals** — what the character wants out of the interaction.

`server/src/engine/npcPromptBuilder.js` renders a blueprint into the actual
system prompt sent to the model — bulleted, not paragraph prose, which is
part of what keeps the per-turn prompt (and cost) small. The model is
explicitly told to perform this character consistently and never invent new
personality traits or background facts beyond what's given. NPC blueprints
never reach the client — same privacy reasoning as the old `systemPrompt`
field they replace.

## Difficulty levels

Every scenario can be started at **beginner**, **intermediate**, or
**advanced** — chosen via three buttons on the scenario card, no separate
step. The three tiers (`getAllDifficultyGoals()` in `npcPromptBuilder.js`,
returned once from `GET /api/scenarios` rather than duplicated per
scenario) shape both the Narrator's opening framing and what happens
mid-conversation:

- **Beginner** — respond naturally, practice short exchanges, notice common
  social cues. Template events never fire beyond stall recovery, so the
  scene stays simple.
- **Intermediate** — build a little connection: share something, ask a
  follow-up, sustain the conversation a bit longer. Unlocks "random"
  flavor events (a phone buzzing, a line forming) at a small per-turn
  chance.
- **Advanced** — stay flexible: topics can shift unexpectedly, an awkward
  moment can happen, someone else can join in. Unlocks everything
  intermediate does, plus events that require a secondary NPC.

The chosen difficulty is sent with every `/api/chat` call, not just used for
the opening framing — it also gates which template events are eligible each
turn (see "Template events" below).

## Multiple NPCs per scenario

The hair salon scenario ("Too Much Happening at Once") is the one scenario
extended to prove this pattern: it has a `secondaryNpcId` (Jamie, another
customer in the next chair) alongside its primary NPC (Marcus). Jamie has a
full blueprint like any other NPC, but — deliberately, to keep this simple —
Jamie doesn't get their own live model call. Their interjections are
pre-written template events (`eventType: "secondaryNpcLine"`) that can only
fire at advanced difficulty, narrated the same way an atmosphere beat is
(see below), giving the primary NPC something real to react to without a
second character needing to be independently generated. The blueprint is
still there and still used for schema completeness / a future upgrade path
— a live secondary voice is a natural next step, not built this pass.

## The Narrator

The Narrator is a separate voice from the in-scene character — visually and
textually distinct in the UI, the way a narration box is distinct from a
dialogue box in a visual novel. It's not a character in the scene; it's a
behind-the-scenes layer with four jobs:

1. **Opening.** Before the character's first line, the Narrator frames the
   situation like a goal to work toward, not just a location description —
   the immediate situation, a brief general nod to why this is worth
   practicing (never a diagnosis or label), and the current difficulty's
   practice goal. This is `scenario.narratorOpening` plus the resolved
   difficulty goal.
2. **Atmosphere.** Alongside the opening, the Narrator describes the
   sensory/social environment where it's relevant — noise, crowding,
   multiple things happening at once — as scene-setting prose, not
   dialogue. This is `scenario.narratorAtmosphere`. Both are shown
   together, once, via `NarratorIntro`, before the AI character's opening
   line appears.
3. **Subtext.** After a roleplay exchange, the Narrator can *proactively*
   step in — without being asked — to explain the hidden social context
   behind what the character just said, without judgment. Deliberately
   occasional: a lightweight model call after every `/api/chat` turn
   (`generateNarratorSubtext`) decides whether anything is worth surfacing,
   and says nothing (`NONE`, never shown) most of the time.
4. **Intervention (scene progression).** When the conversation stalls —
   the NPC's last line and the user's new reply are both minimal, with
   nowhere obvious to go — the Narrator inserts a brief, pre-built
   atmospheric beat (e.g. "The shop gets quieter for a moment...") that
   gives the NPC a natural reason to introduce something new, rather than
   awkwardly re-asking a question. This is `server/src/engine/
   sceneDirector.js`'s `detectStall` (a plain word-count/filler-word
   heuristic — deliberately **not** an LLM call, so it costs nothing and
   never invents a beat) plus `selectTemplateEvent`, which picks from the
   scenario's `templateEvents` library. See "Template events" below.

The same voice also powers "Explain that" (job 3, but on request instead of
proactive) — both use the same non-judgmental, exploratory framing, and
share the same visual styling (`.narrator-box` — a distinct serif italic
typeface, set apart from the sans-serif character dialogue).

**The opening framing is also a persistent anchor**: `narratorOpening`,
`narratorAtmosphere`, and the current difficulty goal are prepended to the
system prompt on every single `/api/chat` call, not just the first. Since
the API is stateless and resends the full system prompt every turn, the
in-character AI is re-grounded in who it's playing and the situation on
every reply, however long or unscripted the conversation runs — without
ever constraining how the user's side can go. Explicit design goal, folded
into the prompts themselves: this is not teaching a rigid social script or
coaching the user to mask — it's meant to support exploring different
communication strategies and building confidence, never pushing toward one
"correct" way to act.

## Template events

Each scenario's `templateEvents` array is its library of possible story
beats — data, not freely generated plot points. Every event has:

- `id` — stable identifier, used to avoid repeating the same beat (the
  client tracks which event ids have already fired this session and sends
  them back as `firedEventIds`, so the Narrator picks something else while
  other options remain).
- `trigger` — `"stall"` (only offered when `detectStall` fires) or
  `"random"` (a small per-turn chance above beginner difficulty).
- `eventType` — `"atmosphere"` (pure narration, e.g. "the shop gets
  busier") or `"secondaryNpcLine"` (a pre-written line from a secondary
  NPC, gated to advanced difficulty).
- `text` — the exact template content; the model never generates this, it
  only reacts to it.
- `difficulty` — which levels this event is eligible at.
- `requiresSecondaryNpc` (optional) — only selectable when the scenario has
  one and difficulty is advanced.

When an event fires, it's folded into the NPC's system prompt for that turn
(`buildEventInjection` in `npcPromptBuilder.js`) so the reply can react to
or use it as a segue, and it's also sent to the client as `event` in the
`/api/chat` response, rendered as a `NarratorNote` right before the NPC's
reply it set up.

## Project status

See [PROGRESS.md](./PROGRESS.md) for what's built, what's next, and open
decisions — kept up to date across sessions this week.
