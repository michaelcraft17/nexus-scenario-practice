# Deploying Nexus (Vercel + Railway)

The repo is a monorepo (`client/` + `server/`), so both Vercel and Railway
need to be told which subfolder to build, and each needs one environment
variable pointing at the other's eventual URL. Do these in order — the
server first, since the client needs its URL.

This part requires your own Vercel/Railway account logins, so it has to be
done by you in the browser, not by an assistant with shell access -- unless
you hand over a scoped project/deploy token, as happened for Railway below,
in which case the CLI can do it non-interactively.

## Status

- **Server (Railway): done.** Live at
  `https://nexus-scenario-practice-production.up.railway.app` -- root
  directory `server`, `OPENAI_API_KEY`/`OPENAI_MODEL`/`DAILY_REQUEST_CAP`
  set, verified with a real `/api/chat` round trip. `CORS_ORIGIN` is still
  unset -- come back and set it once the client (below) has a URL.
- **Client (Vercel): not started yet.**

## 1. Deploy the server on Railway (done -- kept for reference/redo)

1. Go to [railway.app](https://railway.app) and sign in (GitHub login is
   easiest since the repo is already on GitHub).
2. **New Project → Deploy from GitHub repo** → select
   `michaelcraft17/nexus-scenario-practice`.
3. Once the service is created, open its **Settings** tab and set
   **Root Directory** to `server`. Railway auto-detects Node.js and will
   run `npm install` then `npm start` (already defined in
   `server/package.json`).
4. In the **Variables** tab, add:
   - `OPENAI_API_KEY` — your real key. Never commit this anywhere; this is
     the only place it should live.
   - `OPENAI_MODEL` — `gpt-5.6-luna` (already the default if you leave this
     unset, but explicit is fine too).
   - `DAILY_REQUEST_CAP` — optional, defaults to 500. Total `/api` requests
     allowed across all users per day before the app returns a friendly
     "come back tomorrow" message instead of calling OpenAI — the actual
     budget safeguard now that this is public. Lower it if you want a
     tighter cap.
   - `CORS_ORIGIN` — leave this blank for now; you'll come back and set it
     after step 2.
5. Deploy, then copy the public URL Railway assigns the service (Settings →
   **Domains**, or generate one if it hasn't already — looks like
   `https://nexus-scenario-practice-production.up.railway.app`).
6. Sanity check it worked: visit `<that-url>/health` in a browser — you
   should see `{"ok":true}`.

## 2. Deploy the client on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login).
2. **Add New → Project** → import `michaelcraft17/nexus-scenario-practice`.
3. In the import screen's **Root Directory**, click Edit and select
   `client`. Vercel should auto-detect the Vite framework preset.
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` — the Railway URL from step 1.6, no trailing
     slash (e.g. `https://nexus-scenario-practice-production.up.railway.app`).
5. Deploy. Copy the Vercel URL it gives you (e.g.
   `https://nexus-scenario-practice.vercel.app`).

## 3. Close the loop: point the server's CORS back at the client

1. Back in Railway, open the server service's **Variables** tab again and
   set `CORS_ORIGIN` to the exact Vercel URL from step 2.5 (no trailing
   slash).
2. Redeploy the service (Railway usually does this automatically on a
   variable change; if not, trigger a manual redeploy).

## 4. Verify the live site end-to-end

Open the Vercel URL, pick a scenario, send a message, and confirm you get a
real reply (not a CORS error in the browser console, and not a 503 from the
daily cap). If the browser console shows a CORS error, double check step 3
— it's almost always a mismatched or missing `CORS_ORIGIN`.

## Notes

- Both the per-IP rate limit and the daily request cap
  (`server/src/middleware/costGuard.js`) are in-memory — they reset on every
  redeploy and don't share state across multiple instances. Fine for a
  single-instance hackathon deploy; a Redis-backed limiter would be the
  real-production upgrade if this ever needs to scale.
- To redeploy after future code changes: `git push` to `main` — both
  Vercel and Railway auto-deploy from the GitHub repo by default once
  connected.
