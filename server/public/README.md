# Committed client build

This folder is a committed copy of `client`'s production build output
(`vite build`), served directly by the Express server (see
`server/src/index.js`) so the deployed app is one service, one URL — no
separate frontend host, no CORS configuration needed.

It's committed rather than built during Railway's own build step because
Railway's "root directory: server" setting for this service scopes the
actual build context to the `server/` folder alone — a build script trying
to reach `../client` from inside that container fails (`cd: can't cd to
../client`), since the sibling folder was never copied into the build
context in the first place. Pre-building locally and committing the output
sidesteps that constraint entirely.

**After any change to `client/`, rebuild and re-copy before pushing:**

```sh
cd client && npm run build
rm -rf ../server/public/*
cp -r dist/* ../server/public/
cd ../server
git add public
git commit -m "Rebuild client for deploy"
git push
```

Railway auto-deploys on push to `main` (already connected via GitHub
integration), so no separate deploy step is needed beyond the push.
