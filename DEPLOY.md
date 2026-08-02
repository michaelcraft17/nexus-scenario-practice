# Deploying Nexus (single Railway service)

**Live at: https://nexus-scenario-practice-production.up.railway.app**

Originally planned as client-on-Vercel + server-on-Railway, but Vercel hit
an account-verification wall partway through. Rather than trying a third
platform, the server now serves the client too — one Railway service, one
URL, no CORS to configure at all. See `server/public/README.md` for exactly
why (short version: Railway's "root directory: server" setting scopes the
build container to that folder alone, so a build step can't reach out to
`../client` — the client build is pre-built locally and committed into
`server/public` instead of built on Railway).

## Current setup

- **Project:** `profound-nourishment` (Railway, under the `michaelcraft17`
  GitHub-linked account)
- **Service:** `nexus-scenario-practice`, root directory `server`, connected
  to `michaelcraft17/nexus-scenario-practice` on GitHub — pushes to `main`
  auto-deploy.
- **Variables set:** `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.6-luna`,
  `DAILY_REQUEST_CAP=500`. `CORS_ORIGIN` is intentionally unset — there's no
  second origin to allow now that everything's same-origin.
- **Domain:** generated via `railway domain`, shown above.

## Redeploying after a change

**If you only touched `server/`:** just `git push` — Railway auto-deploys.

**If you touched `client/`:** the build has to happen locally and get
committed (Railway's build container can't see `client/` from inside the
`server`-rooted service — see `server/public/README.md`):

```sh
cd client && npm run build
rm -rf ../server/public/*
cp -r dist/* ../server/public/
cd .. && git add server/public && git commit -m "Rebuild client for deploy" && git push
```

## Redeploying via the Railway CLI/API directly (no dashboard needed)

This was done non-interactively using a Railway **project token** (scoped
to just this one project — safer to hand over than an account-wide token,
but still worth rotating in Railway's dashboard after use, since it was
shared in plaintext):

```sh
export RAILWAY_TOKEN="<project-token>"
railway variable set KEY=value --service nexus-scenario-practice \
  --project 70da4c47-56c5-48b5-bd20-536f86c4e47b --environment production
railway redeploy --yes --service nexus-scenario-practice \
  --project 70da4c47-56c5-48b5-bd20-536f86c4e47b --environment production
railway logs -d --service nexus-scenario-practice \
  --project 70da4c47-56c5-48b5-bd20-536f86c4e47b --environment production
```

Note: this project token can't `railway link` or run account-wide commands
(`whoami`, `list`) — every command needs explicit `--service`/`--project`/
`--environment` flags rather than relying on a linked directory.

## Notes

- Both the per-IP rate limit and the daily request cap
  (`server/src/middleware/costGuard.js`) are in-memory — they reset on every
  redeploy and don't share state across multiple instances. Fine for a
  single-instance deploy; a Redis-backed limiter would be the real upgrade
  if this ever needs to scale.
- If a genuinely separate frontend host is wanted later (a CDN, a different
  domain), the code still supports it unchanged — `client/src/services/api.js`
  already reads `VITE_API_BASE_URL`, and the server's `CORS_ORIGIN` env var
  is still there, just unused while everything's same-origin.
