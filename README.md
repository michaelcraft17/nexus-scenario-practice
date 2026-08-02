# IncludAI — Social Scenario Practice

Built for the IncludAI Neurodiversity Hackathon (Track 2: AI for Connection &
Wellbeing).

IncludAI is a social scenario practice app for neurodivergent users. It's a
text-based roleplay: you pick an everyday scenario (small talk with a new
coworker, a manager being sarcastic, declining a group invite, repairing a
misunderstanding with a friend), an AI plays the other person, and you
practice replying — in a low-stakes, judgment-free space, with no time
pressure and no real-world consequences.

Two features make this a *practice* tool rather than just a chatbot:

- **"Explain that"** — under any AI message, you can ask it to break
  character and plainly explain whether it was being sarcastic or literal,
  what it actually meant, and what cues hinted at that.
- **"Get feedback"** — at any point, you can ask for descriptive feedback on
  how the conversation went (e.g. "you paused before asking if they were
  being sarcastic, which is a great instinct"). Feedback is always
  descriptive prose — **never** a numeric score, percentage, or "rate
  yourself" mechanic.

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
├── server/            Express API, OpenAI integration, scenario data
│   └── src/
│       ├── index.js           app entry
│       ├── routes/api.js      GET /scenarios, POST /chat, /explain, /feedback
│       ├── engine/            dialogue logic, decoupled from HTTP (see below)
│       └── data/               scenarios.json + loader
└── client/            React SPA (Vite)
    └── src/
        ├── services/api.js    the only module that calls fetch()
        └── components/        picker, chat screen, message bubbles, feedback panel
```

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

## Scenario content

All 4 scenarios live in one place: `server/src/data/scenarios.json`. Each
scenario has a `systemPrompt` describing how the AI should play that
character — feel free to revise these throughout the week without touching
any app code. `systemPrompt` is intentionally never sent to the browser (see
`server/src/data/scenarioStore.js`) — the client only ever sees the public
fields it needs to render the picker and chat UI.

## Project status

See [PROGRESS.md](./PROGRESS.md) for what's built, what's next, and open
decisions — kept up to date across sessions this week.
