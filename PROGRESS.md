# Progress

Living doc — update this across sessions this week rather than relying on
memory of what's been done. Last updated: 2026-08-04 -- **v17, full visual
redesign from a Claude Design handoff**: the picker/home page and the chat
screen were both restyled from a design-tool handoff bundle (HTML/CSS
mockups + brand palette), plus a long tail of direct follow-up feedback in
the same session. Home page: buttons no longer look like identical gray
pills (distinct icon + color per action), the empty gutters on wide
screens are filled by a full-bleed corner-blob wash instead of flat
background, and each scenario card is tinted to its own accent color
(teal/amber/purple/rose) with an italic serif "intro" line and a compact
"Practice: ..." pill instead of a plain gray paragraph + quote box. The
"Nexus" wordmark went through several iterations before landing on a
hand-composed lockup: colorful rounded squares (bottom layer), the
original hand-icon logo (middle layer), bold embossed white text (top
layer) -- see the `.picker__hero` writeup below. Chat screen: the header
lost its solid color bar (now transparent, blends with the scenario art),
every scenario-tied element (Hint button, the user's own bubble, Send
button, "Explain that" link) now picks up that scenario's accent color
while the Narrator bubble and Mission badge deliberately kept their fixed
teal/gold brand colors (a real decision, confirmed with the user rather
than assumed -- see below), and on wide viewports the conversation column
narrows to a readable width with the Mission badge and two decorative
boundary lines moved into the freed-up side gutters. Also: the reply box
is now an auto-growing textarea instead of a fixed single-line input,
suggestion chips shrank to small centered pills (and the wordiest
response-option text in each scenario got trimmed to fit them), the
Mission badge grew an actual checkbox next to the current objective, and a
real flexbox bug got fixed along the way (auto-margins were silently
shrinking several bottom-of-screen elements to their content width instead
of the intended reading column -- see the CSS comment on the fix, it's a
non-obvious gotcha worth remembering). Full writeup below. Earlier the same
week, 2026-08-02 -- **v16, shipped to
GitHub + deployed live**: pushed to a new public repo
(github.com/michaelcraft17/nexus-scenario-practice), added a per-IP + daily
request cap ahead of public traffic, and deployed to Railway -- **live at
nexus-scenario-practice-production.up.railway.app**. Originally planned as
client-on-Vercel + server-on-Railway, but pivoted to a single Railway
service after Vercel hit an account-verification wall and after discovering
a real Railway constraint (a monorepo service's build container only
contains its own root-directory subtree, not sibling folders -- a build
step reaching into `../client` fails outright). Full writeup below,
including how that pivot actually got un-stuck, since it's a real "monorepo
+ this builder" gotcha worth remembering if it comes up again. Earlier the
same day: v15, finish the
scenario on mission completion + bigger baseline text**: the Reflection
panel (which now only ever opens once the mission is fully done) has a new
"Return to scenarios" button that exits the scenario along with closing the
panel; the "×" still just dismisses the panel if someone wants to linger.
Also raised the default text-size zoom a full tier (per direct feedback
that the baseline felt too small everywhere) while keeping the existing
Small/Default/Large/Largest control's relative spacing intact. Also
surfaced (not fixed -- flagged for awareness) a real quality tradeoff from
the v14 model switch: gpt-5.6-luna judged one mission objective less
reliably than gpt-4o did on identical test phrasing. Full writeup below.
Earlier the same day: v14, switched to
gpt-5.6-luna**: `OPENAI_MODEL` now defaults to `gpt-5.6-luna` (OpenAI's
cheapest current chat-capable model, released July 2026 -- after this
assistant's own knowledge cutoff, so it had to be verified via web search
before use, not assumed) instead of `gpt-4o`, for cost. Doing so surfaced a
real bug affecting every model call in the app, not just this one:
`openaiClient.js` was sending the legacy `max_tokens` parameter, which
newer model families reject outright ("Unsupported parameter") -- fixed by
switching to `max_completion_tokens` everywhere, confirmed safe on `gpt-4o`
too (not a Luna-only fix). Full writeup below. Earlier the same day: v13,
scenario art
as the chat background too**: the same watercolor image already used on
each scenario's picker card now also sits fixed behind the whole chat
screen (dimmed/tinted per theme, hidden in high contrast). Hit and fixed a
real CSS stacking-order bug along the way -- full writeup below, worth
reading if background layers get touched again. Earlier the same day: v12,
mission-gated
reflection, real dyslexia font, scenario art**: the Reflection now
auto-triggers when the whole mission (final stage, every objective) is
complete, replacing both the old turn-count auto-trigger and the manual
header button (removed entirely); swapped the dyslexia typeface's
system-font approximation for the actual OpenDyslexic webfont; and replaced
each scenario picker card's flat color block with a real watercolor
illustration of that scenario's setting. Full writeup below. Earlier the
same day: v11, narrator
message + emoji/badge follow-up fixes**: removed the emoji from the header's
Hint/Accessibility buttons and the hint text (plain text labels instead);
moved the mission badge so it's pinned within the scrollable chat region
only, never overlapping the header, with tint styling instead of the
header's solid primary color so it visually reads as part of the chat, not
an extension of the header; and turned the Narrator's opening framing (scene
setting + goal + atmosphere + difficulty goal) into an actual message bubble
from "Narrator" in the conversation flow, in EB Garamond, rather than a
separate info panel. Full writeup below. Earlier the same day: v10, compact
chat layout: shrank the chat header to one row, turned the mission panel
from a full-width bar into a small floating top-right badge (quest-tracker
style), and made the response-option suggestions a single horizontal
scrolling row instead of a stacked column -- all to free up vertical space
for the conversation itself. Full writeup below. Earlier still: v9,
Mission-Based Objectives: added a persistent "mission" panel alongside the
conversation -- a goal framed like a mission, plus a few behavior-focused
objectives that check off and reveal a second stage as the conversation
progresses. Full writeup below. Earlier still: v8, picker/
content change: removed Beginner and Intermediate as picker options (the
app now always plays at advanced difficulty; the backend's three-tier
system still exists, just isn't exposed as a UI choice), and rewrote
"Asking for a Change" so the teacher is mid-lecture on ethos/pathos/logos
and the student has to interrupt the class, rather than responding to the
teacher's own check-in during quiet study time. Full writeup below. Earlier
the same day: v7, a consolidated Accessibility Features system (color
scheme, theme, text size, typeface, contrast, motion, read-aloud,
favorites, data export) replacing the old dark/dyslexia toggles, plus a
scenario-card visual polish pass. Full writeup below. Earlier still: v6, an
end-of-conversation
Reflection (7 sections, never a score) that replaces the old simple-prose
feedback panel entirely, auto-opening once the user has contributed roughly
10 lines. Full writeup below and in the README's new "Reflection" section.
Earlier still, in order: v5.1 (bug fix -- the Narrator's stall detection
from v5 wasn't actually triggering in real low-engagement conversations);
v5, the major architecture shift (NPC blueprints, template events, Narrator
as social director, difficulty levels, multi-NPC support); the app was
renamed IncludAI -> Nexus and the Narrator was introduced as a distinct
layer (v4); scene-setting framing to reduce AI drift (v3); new scenario
content + the Hint feature (v2). Originally built 2026-08-01 on Claude,
switched to OpenAI the same day.

## v17 — Full visual redesign from a Claude Design handoff

**What it is:** the user mocked up a redesign in Claude Design (claude.ai's
HTML/CSS/JS design tool) and exported a handoff bundle (4 `.dc.html`
prototypes -- Home Desktop/Mobile, Chat Desktop/Mobile -- plus a brand
palette). That bundle was implemented as closely as practical given real
constraints (real scenario art vs. the mockup's text placeholders, no
per-scenario Narrator/Mission recoloring, responsive breakpoints instead of
one fixed canvas size), then refined over many rounds of direct
screenshot-driven feedback in the same session. Scope was explicitly
desktop-first per the user ("don't worry about mobile") -- mobile still
works, just wasn't chased for pixel fidelity.

### Home page (`ScenarioPicker.jsx`, `ScenarioCard.jsx`)

- **Picker buttons no longer twins**: "Past Reflections" is now a teal
  outline pill with a clock icon; "Accessibility Features" is a solid
  purple pill with a person icon (both plain inline SVG, not emoji or
  Unicode symbols -- see the "no emoji" note below). "Features" drops at
  narrow widths (`.a11y-button__optional`, hidden under 420px) so both
  buttons stay on one line each instead of wrapping.
- **Full-bleed background**: `.picker__background` is a `position: fixed`
  layer with four blurred corner blobs (one per scenario accent color),
  replacing the old header-only wash -- fills the empty gutters either
  side of the centered content column on wide screens instead of leaving
  them flat. `.picker__rails` (desktop-only, ≥1180px) adds a subtle
  vertical hairline + 4 dots either side of the column, echoing the
  handoff's literal `top:200px / height:520px` boundary-line element.
- **Scenario cards**: each card gets `data-scenario="<id>"` driving a set
  of `--scenario-*` custom properties (accent, tint, tint-strong, text,
  badge-text, and a `--scenario-btn-text` override for the amber card
  specifically, since white text fails contrast on that one color). A
  colored dot precedes the title; the old plain-gray preview paragraph is
  now an italic serif "intro" line (reusing the existing `preview` copy,
  styled in the Narrator's own voice); the old quote-mark teaching-point
  box is now a compact "Practice: ..." pill using a new short
  `practiceLabel` field added to each scenario in `scenarios.json` (the
  existing `teachingPoint` field is a full sentence, too long for a pill).
  Real photo art stays full-width rather than shrinking to the mockup's
  ~66%-width placeholder-blob shape -- there's no reason to shrink real
  assets to match a placeholder convention that only existed because the
  design tool didn't have the photos.
- **The "Nexus" wordmark went through three iterations** before landing
  where it is: plain text (matching the handoff exactly) → a single
  watercolor banner JPEG the user generated separately → the current
  `.picker__hero`, which layers three things the user asked to combine:
  colorful rounded squares (`.picker__hero-boxes`, 8 hand-placed spans,
  not generated -- reads as a loose cluster rather than a grid), the
  original hand-icon logo (`.picker__hero-hands`, light/dark variants,
  `logo-light.png`/`logo-dark.png`), and bold white embossed text
  (`.picker__hero-title`, `text-shadow` for the emboss, fixed white
  regardless of theme since it always sits on its own colorful backdrop).
  High contrast mode collapses this back to a plain static heading (colors
  and the hand icon both hidden) -- same "decorative loses to readability"
  priority used everywhere else in this app.
- **Utility buttons moved to the top-right corner** on desktop
  (`position: absolute` within `.picker__content`, which is the
  `position: relative` anchor) instead of taking a full row above or below
  the hero. `.picker__header` got `padding-top: 64px` at that breakpoint
  so the centered-but-not-full-width hero doesn't sit underneath them --
  without that, the hero's right edge overlaps the corner buttons' x-range
  at typical desktop widths even though both are nominally "centered."
- **Font**: added Work Sans (Google Fonts, weights 400–700) as the primary
  `--font-sans`, with the existing system-font stack still as a fallback
  if the network request fails -- same pattern already used for EB
  Garamond and OpenDyslexic, not a new offline-availability regression.

### Chat screen (`ChatHeader.jsx`, `ChatScreen.jsx`, `MissionBar.jsx`, `MessageBubble.jsx`, `ResponseOptions.jsx`)

- **Header**: solid `--color-primary` bar → transparent (then, per direct
  follow-up feedback, explicitly `background: transparent` rather than
  matching `--color-bg` -- the scenario art now shows straight through).
  Reordered to back / Hint / title / Accessibility. Hint is scenario-accent
  colored; Accessibility stays fixed purple (`#6c5b7b`) regardless of
  scenario, matching the picker's own Accessibility button -- so it's
  instantly recognizable no matter which scenario is open.
- **Scenario accent flows through the conversation**: `ChatScreen.jsx` sets
  `--scenario-accent` / `--scenario-accent-contrast` as inline custom
  properties on the root `.chat-screen` div (from `scenario.color`, with
  the same amber-needs-dark-text exception as the picker cards). The Send
  button, the user's own message bubbles, and the "Explain that" link all
  read from these. **The Narrator bubble and Mission badge deliberately do
  not** -- confirmed with the user rather than assumed, since the app has
  explicit prior reasoning (a comment in `index.css`) that those two are
  meant to read as one consistent voice/system across every scenario, and
  the mockup's one example scenario happening to be teal-colored made it
  look (misleadingly) like they should be scenario-tinted too.
- **Desktop layout** (≥1220px): the conversation column narrows to a
  680px readable width (`.chat-screen__messages`, `.response-options`,
  `.chat-screen__input`, `.hint-bar`, `.chat-screen__error` all share this
  via one media query) instead of stretching bubbles edge-to-edge. The
  Mission badge moves from sticky-in-corner to `position: fixed` in the
  freed-up right gutter beside the column. Two boundary hairlines
  (`.chat-rail--left/--right`, `top:220px / height:460px`, matching the
  handoff's literal values) were added to match the picker's own rails --
  requested explicitly after the picker's version wasn't initially obvious
  enough to notice.
- **A real flexbox bug, not just a style tweak**: `.chat-screen__input`,
  `.hint-bar`, `.chat-screen__error`, and `.response-options` are direct
  flex-item children of `.chat-screen`'s column layout. Centering them with
  `margin-left/right: auto` alone (width left at its default `auto`)
  triggered flexbox's stretch-vs-auto-margin interaction: the *margins*
  absorbed the available space instead of the item growing to `max-width`,
  so each one centered itself while shrinking to its own content size --
  visually "packed into the middle" instead of spanning the intended
  680px column, most obvious on the reply box and response chips. Fixed by
  adding an explicit `width: 100%` alongside `max-width: 680px` so the
  item has a definite size before the auto margins act on it. Full
  reasoning is in the CSS comment at the fix site -- worth reading before
  touching centering on any other flex-item child of `.chat-screen`.
- **Reply box**: `<input type="text">` → an auto-growing `<textarea>`
  (height synced to `scrollHeight` in a `useEffect`, capped at ~160px/6
  lines with internal scroll beyond that). Enter sends, Shift+Enter inserts
  a newline. The enclosing `.chat-screen__input` bar itself lost its solid
  white background/border-top (same "no prominent box" feedback as the
  header) -- the textarea and Send button each carry their own pill shape
  already, so the outer bar doesn't need one too.
- **Suggestion chips**: shrank from fixed-width (220px), left-aligned,
  wrapping cards with a "Suggestions" label to small auto-sized, centered
  pills with no label (an `aria-label="Suggested replies"` on the row
  preserves it for screen readers). Wraps to a second row rather than
  scrolling horizontally -- with 3 short options this rarely triggers, and
  avoids the "centered content clips on overflow" trap `justify-content:
  center` + horizontal scroll can fall into. The wordiest response option
  in each scenario (`scenarios.json`) was also trimmed to actually fit the
  smaller pill -- e.g. "I want to make sure I complete this correctly --
  could you clarify what you'd like included and what the deadline should
  be?" → "Could you clarify what you'd like included, and the deadline?".
  Meaning kept, length cut.
- **Mission badge**: the collapsed view's current-objective line
  (`.mission-badge__next`) now has an actual checkbox (`<rect rx="5">` SVG,
  always empty since it's by definition the next *incomplete* objective)
  instead of being plain truncated text -- and the text now wraps instead
  of ellipsis-truncating to one line, so the full objective is always
  readable at a glance.
- **Speaker labels shortened**: `MessageBubble.jsx` now takes `npcName`
  (already computed in `ChatScreen.jsx` for other purposes) instead of the
  full `aiRole`, so bubbles show "Priya" instead of "Priya (your
  manager)".

### No-emoji follow-through

The Mission badge and "Mission Updated" notes (`MissionBar.jsx`,
`NarratorNote.jsx`) were still using a literal 🎯 emoji (`&#127919;`),
predating this session's explicit "no emoji on interactive UI" decision
from `v11` (a past device-rendering issue with even simple Unicode
symbols). Confirmed with the user before touching it, then replaced with a
small inline SVG flag icon in both places, consistent with the rest of the
app.

**Verified live** via Playwright across every round of changes -- desktop
(1440/1920px) and mobile (390px) viewports, light/dark theme, and high
contrast, re-checked after each fix. Zero console/page errors at any point.
Also smoke-tested against the actual production server (port 3001, serving
`server/public`, not the Vite dev server) after the final rebuild, to
confirm the committed build works the same way Railway will run it.

## v16 — Shipped to GitHub, deployed live on Railway

**What it is:** this repo went from "local git, no remote" to a public
GitHub repo and a live, publicly-reachable deployment in one session, for
gathering outside feedback. See `DEPLOY.md` for the current setup and
redeploy steps -- this section is the story of how it got there and the
real gotcha hit along the way, which `DEPLOY.md` only summarizes.

**GitHub**: created `github.com/michaelcraft17/nexus-scenario-practice`
(public, per explicit confirmation -- discoverability mattered since the
whole point is outside feedback) via `gh repo create --source=. --push`.
Confirmed no secrets in the diff before pushing (`.env` was never tracked,
grepped the staged diff for the API key pattern) -- same care as any other
push, just worth calling out once given what's at stake if it goes wrong.

**Cost safeguard before going public** (`server/src/middleware/costGuard.js`,
new): a per-IP rate limit (60 req/15min, `express-rate-limit`) plus a
from-scratch global daily request cap (in-memory counter, resets at UTC
midnight, `DAILY_REQUEST_CAP` env var, defaults to 500) -- the rate limit
alone doesn't protect against abuse spread across many different IPs (a
widely-shared link, or distributed bot traffic), which is the actual risk
once a link is public rather than just used by one person locally. Both are
in-memory, which is fine for a single-instance deploy and explicitly
documented as the thing to revisit (Redis-backed) if this ever needs to
scale horizontally. Added `app.set("trust proxy", 1)` so the rate limiter
sees real caller IPs rather than Railway's proxy IP for everyone.

**Deployment, and the pivot that happened mid-way:**
- [x] Railway (server): the user handed over a Railway **project token**
  (scoped to one project, not their whole account) to let this happen
  non-interactively via the `railway` CLI rather than the dashboard.
  Confirmed the token's actual scope empirically rather than assuming --
  `railway whoami`/`railway list` (account-wide) both fail Unauthorized,
  while `railway status`/`variable set`/`redeploy`/`domain` (this-project-
  only, with explicit `--project`/`--service`/`--environment` flags) all
  work. `railway link` also fails Unauthorized with this token, which
  matters: it rules out `railway config` (the `.railway/railway.ts`
  config-as-code workflow), since that requires a linked project. Set
  `OPENAI_API_KEY` via `--stdin` piped from the local `.env` file specifically
  so the raw key value never appeared as a literal argument in any command
  this assistant typed; confirmed via `variable list` that Railway's own
  display truncates secret values in its table view.
- [x] **Vercel (client): abandoned partway through** -- the user's account
  hit a "requires further verification" wall. Rather than trying a third
  platform blind, offered three options (Cloudflare Pages, Netlify, or
  merging the client into the already-working Railway service) and let the
  user choose -- they picked the merge, trading a bit more setup effort now
  for zero new-account risk, reusing infrastructure already proven to work.
- [x] **First merge attempt failed, and the failure taught a real
  monorepo-deployment lesson.** Assumed (incorrectly) that Railway's "root
  directory: server" setting works like `cd`-ing into that folder after a
  full repo clone -- i.e. that a build script in `server/package.json`
  could still reach `../client`. Added a `build` script doing exactly that
  and pushed; the deploy failed with `sh: 1: cd: can't cd to ../client`.
  **The actual behavior**: "root directory" scopes the build *context*
  itself to that subtree -- sibling folders are never copied into the
  container at all, not just outside the working directory. Confirmed via
  `railway logs <deployment-id> --build`, which is also worth remembering
  as a technique: passing the specific failed deployment's ID (from
  `railway deployment list`) got real build output, where the default
  (most-recent-*successful*) silently showed a different, unrelated
  deployment's logs instead.
- [x] **Actual fix**: pre-build the client locally (`vite build`) and
  commit the output into `server/public/` (new, with its own README.md
  explaining why and exactly how to rebuild/recommit after future `client/`
  changes) rather than trying to build it inside Railway's scoped
  container. `server/src/index.js` now serves `server/public` via
  `express.static` plus a catch-all `index.html` fallback (this app has no
  client-side router, so the fallback exists purely for hard-refresh/
  shared-link robustness, not real route matching) when that folder exists
  -- and does nothing at all in local dev, where it doesn't. Removed the
  now-broken `build` script from `server/package.json` entirely (nothing
  for Railway to run anymore; the static files are just already there).
  `client/package-lock.json` also got a drive-by fix here (still said
  `"name": "includai-client"` from before the v4 rename to `nexus-client`
  -- never regenerated until this session's `npm install` run).
- [x] **Middleware ordering fix, caught during review, not by a failure**:
  initially placed the static-file/SPA-fallback handlers *after* the
  central error handler. Functionally harmless for normal requests (Express
  only invokes an error handler when something calls `next(err)`, so
  non-error requests just skip past it to reach the handlers after), but
  wrong for the one thing that actually matters about handler order here --
  an error thrown *by* the static/fallback handlers themselves would never
  reach the error handler if it's registered before them. Reordered so the
  error handler is genuinely last.

**Verified live**, each step confirmed before moving to the next rather
than assumed: local production-mode test (`npm run build` -- back when that
was still the plan -- then `npm start`, confirmed `/`, `/health`,
`/api/scenarios`, and a real asset path all returned 200) before ever
touching Railway; after the first (failed) Railway deploy, root-caused via
build logs rather than guessing; after the fix, confirmed success in
`railway deployment list`; then a full Playwright pass against the actual
public URL (not localhost) -- picker loads, scenario art loads
(`background-image` resolves), a real multi-turn chat reply comes back, zero
console errors. `DEPLOY.md` rewritten to match what's actually deployed
(the Vercel section is gone, not just marked outdated) rather than left
half-accurate.

## v15 — Finish the scenario on mission completion + bigger baseline text

**Finishing the scenario** (`ReflectionPanel.jsx`, `ChatScreen.jsx`,
`index.css`): the Reflection now only ever opens once the mission is fully
complete (v12), so its dismissal is the natural moment to also end the
scenario -- added a new `onFinish` prop and a "Return to scenarios" button
in a sticky footer (always reachable without scrolling past all 7
sections, restructured `.reflection-panel` into header/body/footer flex
children so the body scrolls independently rather than the whole panel).
Wired to the same `onExit` the header's Exit button already used. Kept the
header's small "×" as a separate, lower-commitment dismiss (`onClose`) --
closes the panel only, lets someone keep chatting a bit longer if they want
to, without forcing an exit the moment they've read the reflection.
- [x] **Verified live** via Playwright: drove a full "Missing Details"
      conversation to mission completion, confirmed the Reflection opened
      automatically with the new button present, clicked "Return to
      scenarios," and confirmed the picker screen (`.scenario-card`) was
      back on screen afterward. Zero console errors.

**Bigger baseline text size** (`AccessibilityContext.jsx`): per direct
feedback that text felt too small throughout, not just for users who'd
seek out the existing "Large" option. `TEXT_ZOOM`'s four values
(small/default/large/largest) all shifted up one tier -- `0.9/1/1.15/1.3`
-> `1/1.15/1.3/1.45` -- rather than touching root `font-size` directly.
Deliberately reused the existing `zoom`-based mechanism (see the comment
already in that file) instead of introducing a second, independent lever:
`zoom` scales layout and spacing together with text, which matters here
because this app's spacing (`--space-*`, button `min-height`s, etc.) is all
hardcoded px, not a relative type scale -- a plain root-`font-size` bump
would grow text without growing the tightly-fitted header/mission-badge/chip
containers around it, risking overflow or clipping in exactly the compact
UI elements v10/v11 spent real effort tightening. Verified the new default
resolves to `1.15` (was `1`) via Playwright on a fresh session (no saved
`a11y_prefs`); existing users with a previously-saved `textSize: "default"`
preference get the new, bigger `1.15` automatically too, since only the
*value* behind "default" changed, not which named tier is selected.

**Observed, not fixed: gpt-5.6-luna's mission-tracking judgment seems less
reliable than gpt-4o's was.** While verifying the above, the exact same
scripted two-message "Missing Details" exchange that had reliably completed
all 3 stage-2 objectives against `gpt-4o` in v12's testing left
`confirm-understanding` unchecked against `gpt-5.6-luna` -- needed an
explicit third message ("I understand the task now...") to actually tip it
over. This is a plausible, expected consequence of v14's switch to a much
cheaper/smaller model for a task (judging whether a nuanced behavioral
objective was satisfied) that leans more on model capability than plain
dialogue generation does. Not treated as a bug to fix in `sceneDirector.js`/
the mission-tracking prompt -- flagging it as a real tradeoff of the model
choice to watch in further play-testing. If mission stages feel like they
"stick" too often in practice, the fix would be prompt tuning in
`prompts.js`'s `NARRATOR_UPDATE_SYSTEM_PROMPT` (or reconsidering the model
for just that call) rather than anything structural.

## v14 — Switched to gpt-5.6-luna (+ a real max_tokens/max_completion_tokens bug)

**Model switch** (`server/.env`): `OPENAI_MODEL=gpt-5.6-luna`, replacing
`gpt-4o`. The user asked for a model by a name ("GPT-5.6 Luna") that didn't
match anything in this assistant's training data -- rather than assume it
was a mistake or guess at a real-sounding substitute, confirmed via
`WebSearch`/`WebFetch` against OpenAI's own developer docs that it's a real
model (released July 2026, after this assistant's January 2026 knowledge
cutoff): the cheapest tier ($0.20/$1.20 per million input/output tokens) in
a three-tier GPT-5.6 family (Sol/Terra/Luna), reachable via the same Chat
Completions API this app already uses. Checked whether an even cheaper
"nano"-tier model existed first -- third-party pricing aggregators
disagreed with each other on naming/pricing for older tiers, and OpenAI's
own current-models docs page didn't list them at all, so stuck with Luna as
the cheapest option confirmed directly from OpenAI rather than trust
unverifiable secondhand pricing pages.

**Real bug found switching to it, affecting every model call in the app,
not just this one:** the first live `/api/chat` call after the switch
failed outright with `Unsupported parameter: 'max_tokens' is not supported
with this model. Use 'max_completion_tokens' instead.` `openaiClient.js`'s
`complete()` and `completeJson()` -- the two functions every single engine
call in this app goes through -- were both sending the legacy `max_tokens`
parameter. Fixed by switching both to `max_completion_tokens`. Verified via
web search that this isn't a Luna-only quirk to special-case: `max_tokens`
is deprecated but still auto-converted to `max_completion_tokens`
internally for older models like `gpt-4o`, so `max_completion_tokens` is
the one name that's safe regardless of whatever `OPENAI_MODEL` ends up set
to in the future.

**Verified live**: `curl` against `/api/chat` (roleplay reply + JSON-mode
mission tracking together), `/api/hint`, and `/api/reflection` (JSON mode)
all returned real, well-formed responses after the fix -- covering both
`complete()` and `completeJson()`, and both plain-text and JSON-mode
response paths, not just the one route that surfaced the bug.

## v13 — Scenario art as the chat background too (+ a real stacking-order bug)

**What it is:** direct follow-up to v12's scenario art -- reuse the same
per-scenario watercolor image as a fixed background behind the whole chat
screen (`ChatScreen.jsx`, `index.css`), not just the picker card thumbnail.

**Real bug hit and fixed: an opaque sibling was covering the fixed
background despite a negative z-index.** First attempt: a
`.chat-screen__background` div (`position: fixed`, `z-index: -1`,
`background-image` set inline per scenario id, same path pattern as
`ScenarioCard.jsx`) as the first child of `.chat-screen`, with `.chat-screen`
keeping its existing `background: var(--color-bg)`. Rendered as
*completely invisible* -- confirmed via Playwright that the element was
correctly sized, positioned, and had the right image URL, so the CSS
attributes were all correct; the actual cause was `.chat-screen` itself not
being a stacking context (no `position`/`z-index`/`transform` on it), which
means its own `background-color` paints in the *root* stacking context's
normal-flow step, a step that comes **after** negative-z-index descendants
paint -- so `.chat-screen`'s own opaque cream/dark background was painting
*on top of* the fixed, negative-z-index image every time, regardless of the
z-index value, because z-index only orders elements *within the same
stacking context* and the negative-z-index escape hatch doesn't help
against an opaque sibling that isn't part of that ordering at all. Fixed by
removing the `background-color` from `.chat-screen` entirely (nothing left
to cover the image) and moving the fallback color onto
`.chat-screen__background` itself (`background-color: var(--color-bg)`,
under the image, so a failed image request still shows the theme's flat
color rather than transparent-through-to-white). Confirmed with a
before/after Playwright screenshot comparison -- worth remembering if any
future fixed/absolute decorative layer gets added anywhere else in this
app: a non-positioned ancestor's own background can silently defeat a
negative z-index child no matter how correct the child's own CSS is.
- [x] Also confirmed empirically (by temporarily testing at scrim
      opacity 0) that legibility was never actually at risk from this
      layer -- every text-bearing surface on the chat screen (bubbles, the
      Narrator bubble, the mission badge, the header, the input bar)
      already has its own fully opaque background color from earlier
      versions, so the art can only ever show through in the gaps between
      them, which is exactly the ambient effect wanted.
- [x] **Per-theme tuning**: light theme gets a light `--color-bg` scrim
      (`opacity: 0.15`) over the image, since the source art is already a
      pale cream watercolor consistent with the light palette. Dark theme
      darkens the image itself (`filter: brightness(0.4) saturate(0.9)`)
      rather than just adding more of the same scrim -- showing a pale
      watercolor at full brightness behind a dark UI read as a jarring
      bright patch in testing; darkening the source image keeps its actual
      colors/shapes recognizable, just dimmed to sit naturally in a dark
      scene, plus a slightly stronger scrim (`opacity: 0.35`) on top.
- [x] `[data-contrast="high"] .chat-screen__background { display: none; }`
      -- same "a11y override wins" priority as the dyslexia typeface and
      motion-reduce rules elsewhere; high contrast mode exists specifically
      to remove exactly this kind of decorative background, so it's
      unconditionally hidden there, confirmed via computed `display: none`.

**Verified live** via Playwright screenshots in light, dark, and
dark+high-contrast: the art is clearly visible in the exposed gutters in
both light and dark (confirmed the fix actually worked, not just
theoretically), correctly dimmed rather than blown out in dark mode, and
fully absent (flat `--color-bg`, thicker high-contrast borders intact) in
high contrast. Zero console/page errors throughout.

## v12 — Mission-gated Reflection, real dyslexia font, scenario art

**Reflection now gated on mission completion, not turn count or a button**
(`ChatScreen.jsx`, `ChatHeader.jsx`, `scenarioStore.js`, `routes/api.js`):
- [x] Both `getInitialMission` (`scenarioStore.js`) and `resolveMission`
      (`routes/api.js`) now include `isFinalStage` on the mission object --
      `true` only when the resolved stage is the last one in the scenario's
      authored `missions` array. Computed generically from `missions.length`
      rather than hardcoded to "stage 2," so it stays correct if a scenario
      ever gets a third stage.
- [x] `ChatScreen.jsx`: removed `REFLECTION_TURN_THRESHOLD` and the
      turn-count-based auto-trigger entirely. New trigger: `mission?.isFinalStage
      && mission.objectives.every(o => o.completed)`, same one-time ref guard
      as before. There is now exactly one way to see the Reflection --
      finishing the mission -- not two overlapping ones.
- [x] `ChatHeader.jsx`: the "Reflection" button and its `onReflect`/
      `reflectDisabled` props are gone. `handleReflect` itself is unchanged
      and still called internally by the new effect. Removed the
      now-dead `.chat-header__feedback`/`:disabled` CSS.
- [x] **Verified live**: drove a full "Missing Details" conversation through
      both mission stages via real `/api/chat` calls (`curl`, then again
      through the actual UI with Playwright) -- `isFinalStage` flipped to
      `true` on reaching stage 2, all 3 objectives showed `completed: true`
      after the confirming reply, the mission badge read "3/3," and the
      Reflection panel opened on its own with real, specific content (no
      button click involved). Zero console errors.

**Real OpenDyslexic font, not a system-font approximation** (`index.css`):
the v7 dyslexia typeface option previously substituted Verdana/Tahoma/
Trebuchet MS for a "rounder, more distinct" system font, deliberately
avoiding an external font load. Per direct feedback that this wasn't
actually the expected dyslexia-friendly typeface, added two `@font-face`
rules loading the real OpenDyslexic (400 and 700 weight, woff2 with woff
fallback) from Fontsource's jsDelivr CDN (verified both URLs resolve with
`curl` before committing to them), and `[data-typeface="dyslexia"]` now
puts `"OpenDyslexic"` first in both `--font-sans` and `--font-narrator`,
keeping the old system-font stack as the fallback if the request fails
offline. Same class of exception to "no external fonts" as EB Garamond in
v11 -- this app now deliberately loads two web fonts, both with graceful
system-font fallback chains. Verified via Playwright: `getComputedStyle(document.body).fontFamily`
resolves to `OpenDyslexic, Verdana, Tahoma, "Trebuchet MS", sans-serif` with
the option on, and a screenshot confirms the actual OpenDyslexic letterforms
render (not a fallback font).

**Scenario picker art** (`ScenarioCard.jsx`, `index.css`,
`client/public/images/scenarios/`): replaced the flat `scenario.color`
block (`.scenario-card__image`, previously just a `background-color`) with
a real watercolor illustration per scenario, matching the exact setting
described in each scenario's own text -- the office for "The Missing
Details," the checkout counter for "The Unexpected Conversation," the salon
for "Too Much Happening at Once," the classroom for "Asking for a Change."
This was the exact placeholder PROGRESS.md had already earmarked for this
("replacing color-block placeholders with real stock images... without
changing any layout code" -- the existing `aspect-ratio: 16/9` box needed no
changes). Source PNGs (1408x768, ~1.2-2MB each) were resized and
re-encoded as JPEGs (`sips`, 800px wide, quality 78) down to 29-67KB each
before copying into `client/public/images/scenarios/<scenario-id>.jpg` --
referenced directly by scenario id in `ScenarioCard.jsx`
(`background-image: url(/images/scenarios/${scenario.id}.jpg)`), no new
data field needed. `scenario.color` is kept as the `background-color`
underneath (shows briefly before the image paints, and is still used
elsewhere as the Narrator bubble's accent-border color) and the existing
semi-transparent-dark favorite-star button already had enough contrast
against a busy image, not just a flat color, so it needed no changes.
Verified all four images resolve (200, confirmed via an in-page `Image`
load probe) and render in the correct card via Playwright screenshot.

## v11 — Narrator message bubble + emoji/badge follow-up fixes

**What it is:** direct follow-up feedback on v10's layout pass -- no emoji
on the Hint/Accessibility header buttons or the hint text; the mission
badge shouldn't visually read as part of the header; and the Narrator's
opening framing should read as an actual incoming message from "Narrator,"
in EB Garamond, rather than a separate framed info block.

- [x] **No emoji**: `ChatHeader.jsx`'s Hint button and `AccessibilityButton`'s
      new `iconOnly` mode now render plain text ("Hint" / "Access") instead
      of &#128161;/♿ -- the wheelchair character specifically risks
      rendering as a colorful emoji glyph on some devices/fonts even though
      it's technically a plain Unicode symbol, so text was the safer choice
      to actually guarantee "no emoji" rather than swapping one Unicode
      character for another. Also dropped the 💡 that prefixed the hint
      text itself in the hint bar (`ChatScreen.jsx`).
- [x] **Mission badge no longer reads as part of the header**: the badge
      previously used the same solid `--color-primary` background as the
      header immediately above it, which -- even though it was technically
      already positioned inside the scrollable chat region, not over the
      header -- visually blended into looking like a header extension.
      Restyled to the Narrator's tint-background-plus-accent-left-edge look
      (`--color-tint` background, `--color-accent` left border, matching
      `.narrator-box`) instead of solid primary, and moved to be the first
      child of `.chat-screen__messages` (nested one level deeper than
      before, still inside the scrollable `.chat-screen__scroll`) so its
      resting position picks up that container's own top padding as a
      natural gap below the header, rather than sitting flush against it.
      Re-verified the `position: sticky` behavior still holds with the new
      nesting (checked scroll-to-top vs scroll-to-bottom of a real
      conversation -- badge's on-screen position stayed effectively
      constant, sticky doesn't care how many static wrappers sit between it
      and its nearest *scrolling* ancestor).
- [x] **Narrator opening as a message bubble** (`NarratorIntro.jsx`,
      `ChatScreen.jsx`, `index.css`): previously a distinct centered
      `.narrator-box--intro` panel (now deleted, along with the
      `.chat-screen__scene` colored band that separately showed just the
      `setting` caption above it). Now a single `bubble-row`/`bubble`
      element -- the same structure `MessageBubble` uses for NPC lines,
      complete with a "Narrator" speaker label matching the
      "MARCUS (HAIRSTYLIST)"-style label NPCs get -- containing all four
      pieces of framing together: `setting`, `narratorOpening`,
      `narratorAtmosphere`, and the difficulty goal, in that order, as
      separate paragraphs. Still visually distinct from real character
      dialogue (new `.bubble--narrator`: tint background, italic, accent
      left edge) so it can't be confused with something the NPC said. The
      left-edge accent color defaults to `--color-accent` but takes the
      scenario's own `color` (previously used only for the deleted scene
      band and the picker card) as an inline override via a new
      `accentColor` prop, keeping that per-scenario color identity alive in
      the new layout.
- [x] **EB Garamond for the Narrator's voice** (`index.html`, `index.css`):
      added a Google Fonts `<link>` (with `preconnect` hints) and changed
      `--font-narrator`'s value from the existing Georgia-led serif stack to
      `"EB Garamond", Georgia, ...` (same fallback chain kept after it). This
      is a deliberate, explicitly-requested exception to the offline-only
      font strategy the dyslexia typeface established in v7 (that override
      of `--font-narrator` to Verdana/Tahoma under `[data-typeface="dyslexia"]`
      is untouched and still wins, correctly, since readability there should
      outrank this aesthetic choice) -- if the Google Fonts request fails
      (offline use), narration falls back to the existing serif stack rather
      than breaking. Because `--font-narrator` was already the one token
      used by every Narrator-voice surface (subtext asides, the "Mission
      Updated" note, "Explain that"'s panel, and now the new narrator
      bubble), this single variable change applies EB Garamond consistently
      everywhere the Narrator speaks, not just the opening message.

**Verified live** via Playwright (420x900, light and dark): header buttons
render as plain text (`["←", "Hint", "Access", "Reflection"]`, confirmed via
`textContent`, no emoji characters present); the narrator bubble's speaker
label reads "Narrator" and its computed `font-family` resolves to
`"EB Garamond", Georgia, ...`; mission badge background color is
demonstrably different from the header's (`rgb(239,237,245)` tint vs.
`rgb(46,42,74)` primary) and its top edge sits below the header's bottom
edge in every case checked; sticky pinning re-confirmed across a full
scroll of a real multi-turn conversation after the re-nesting. Zero
console/page errors in either theme.

## v10 — Compact chat layout (header, mission badge, response options)

**What it is:** a pure layout/CSS pass in response to direct feedback that
the header took too much space and the mission bar and suggestion chips
pushed the conversation down too far. No engine or data changes.

- [x] **Header** (`ChatHeader.jsx`): collapsed from two rows to one. Exit
      and "Need a hint?" became icon-only buttons (arrow / 💡, `aria-label`
      carries the full meaning); `AccessibilityButton` gained an `iconOnly`
      prop (renders ♿ instead of the "Accessibility Features" label, opt-in,
      default `false` so the picker screen's existing usage is unaffected)
      -- careful to keep the established "className replaces, never
      combines with, the default style" contract on that component intact.
      Reflection kept its short text label (accent-colored pill, most
      important action). Removed now-dead CSS (`chat-header__row--secondary`,
      `chat-header__hint`, `chat-header__difficulty` -- the last one was
      already unused since v8). Header height dropped from two rows to a
      measured 56px.
- [x] **Mission panel -> floating badge** (`MissionBar.jsx`, `ChatScreen.jsx`,
      `index.css`): no longer a full-width bar occupying its own row between
      the header and the scroll area. Moved to be the *first child inside*
      `.chat-screen__scroll` and given `position: sticky; top: var(--space-2)`
      with `margin-left: auto` on a `width: max-content` block -- pins it to
      the top-right of the scrollable region without needing to know the
      header's exact height (verified: badge's `getBoundingClientRect().top`
      identical whether scrolled to the top or the bottom of a real
      conversation). Collapsed view now shows the single next incomplete
      objective (quest-tracker style, per a reference screenshot the user
      provided) instead of the full mission paragraph -- tap to expand into
      a small anchored card with the full mission text and every objective.
      Solid `--color-primary` background (matching the header) rather than
      the reference image's translucent black, so it stays correct across
      this app's light/dark/high-contrast themes rather than opting out of
      the existing color-token system for one component.
- [x] **Response options** (`ResponseOptions.jsx`, `index.css`): the label
      sentence ("Not sure what to say?...") shrank to a small caption
      ("Suggestions"), and the three chips changed from a stacked column of
      full-width buttons to one horizontally-scrolling row of pill chips
      (`max-width: 220px`, 2-line clamp with ellipsis for long option text)
      -- one compact row of height regardless of how many options exist,
      styled closer to a typical chat app's quick-reply row than a block of
      form buttons.

**Verified live** via Playwright (420x900, existing method): header
measured 56px tall (previously two full rows); mission badge renders
top-right, expands/collapses correctly, and its screen position stayed
fixed across a full scroll from top to bottom of a real multi-turn
conversation (confirming the sticky approach works without a hardcoded
offset); response chips render in one horizontal scrollable row. Zero
console/page errors throughout.

## v9 — Mission-Based Objectives

**What it is:** each scenario now frames its practice goal as a "mission"
shown in a persistent bar docked directly below the chat header (outside
the scrollable message region, so -- per the spec's "remains visible
throughout" -- it never scrolls out of view). Collapsed by default (🎯 +
mission title + an "x/y" objective-progress count), tap to expand for the
full mission text and each objective as a ☑/☐ row. Two authored stages per
scenario: an opening mission, then one "reveal" partway through where new
objectives replace/extend the first set -- matching the spec's own
Marcus/interview example structure, though that example was illustrative
only (confirmed with the user); the actual mission content for all 4
scenarios was authored to fit each scenario's existing narrative (sensory
overload, small talk, self-advocacy, missing details), not a new story.

**Architecture: mission tracking folded into the existing Narrator subtext
call, not a third model call per turn.**
- [x] **Data model** (`server/src/data/scenarios.json`): each scenario gets
      a `missions` array of ordered stages -- `{id, missionText, objectives:
      [{id, text}], advanceWhen}`. `advanceWhen` is a natural-language
      condition evaluated by the model (same pattern as NPC blueprints'
      `scenarioReactions.trigger` -- structured data, not code-parsed) and,
      like `templateEvents`, is never sent to the client.
      Carried-forward objectives across a scenario's two stages intentionally
      reuse the same objective `id` (e.g. `too-much-happening`'s
      `notice-overload`/`speak-up` appear in both stages) so a completed
      objective simply stays checked when the stage advances, with no
      special-case reset logic needed.
      `scenarioStore.getAllPublic()` exposes only `missions[0]` (as a new
      `mission` field, `advanceWhen` stripped, all objectives starting
      unchecked) -- stage 2+ only ever arrives dynamically through
      `/api/chat`, so nothing is spoiled before it's reached.
- [x] **`prompts.js`/`dialogueEngine.js`**: `generateNarratorSubtext` (plain
      text, `complete()`) became `generateNarratorUpdate` (JSON, via the
      same `completeJson()` the Reflection already uses). One call now does
      both of the Narrator's per-turn jobs: the existing subtext aside, plus
      deciding which of the *current* stage's objectives are now satisfied
      and whether its `advanceWhen` condition has been met (returning the
      next stage's id if so). The model is given the full ordered stage list
      (including stages not reached yet, so it always knows what's next) and
      explicitly instructed the mission can only move forward one stage at a
      time, never skip ahead or regress.
- [x] **`routes/api.js` (`POST /api/chat`)**: request gains
      `activeMissionStageId`/`completedObjectiveIds`, client-tracked session
      state in the same spirit as the existing `firedEventIds`. Because the
      backend is stateless, mission state is recomputed fresh every turn
      from the full transcript rather than diffed incrementally -- so two
      guards protect against a single flaky model call corrupting things:
      the resolved stage is `max(clientStageIndex, modelStageIndex)` (never
      moves backward), and `completedObjectiveIds` is the *union* of what the
      client already knew and what the model reports now, filtered to the
      resolved stage's own objective ids (an objective, once checked, can't
      un-check). Response gains `mission: {stageId, missionText, objectives:
      [{id, text, completed}]}` alongside the existing `narratorNote`/`event`,
      wrapped in the same non-fatal try/catch as the old subtext call --
      mission tracking is a nice-to-have, never blocks the actual reply.
- [x] **Client** (`MissionBar.jsx`, new; `ChatScreen.jsx`; `NarratorNote.jsx`):
      `MissionBar` renders whatever mission object it's given -- it never
      computes completion itself. `ChatScreen` sends its known
      `activeMissionStageId`/`completedObjectiveIds` on every `/api/chat`
      call, and on response, compares the returned stage id to the one it
      had: a changed stage id pushes an inline "Mission Updated" note into
      the chat feed *and* refreshes the bar (both, per the user's choice
      among the three options presented before implementation -- see below).
      The inline note reuses `NarratorNote`'s existing `.narrator-box`
      pattern via a new `variant="mission"` prop rather than a separate
      component (small 🎯-labeled accent, `.narrator-box--mission`) --
      same Narrator voice, distinguished from an ordinary subtext aside.
      Read-aloud's joined content (`ChatScreen`'s `registerReadableContent`)
      now also includes the mission title and each objective's
      complete/not-yet-done state.

**Hidden metrics -- scope decision, not built as a separate system:** the
spec described hidden metrics (interruptions, follow-up questions, empathy,
flow) as inputs meant to *power the existing reflection*, not a separately
displayed feature. `generateReflection` already re-reads the full transcript
holistically every time it's called, producing `strengths`/
`connectionMoments`/`growthOpportunities` from that semantic read --
threading discrete per-turn boolean flags through every stateless
`/api/chat` round trip just to hand them to a call that already gets the
full transcript directly would be real plumbing for no real gain. Decision:
no new tracking mechanism was built; Reflection's existing whole-transcript
analysis is treated as already satisfying this requirement. Flagging this
here as an interpretation call rather than a silent omission.

**Three decisions confirmed with the user before implementation** (all three
recommended options were chosen): the spec's Marcus/interview mission
example was illustrative of the format only, not a request to change the
salon scenario's actual sensory-overload narrative; a mission update gets
both an inline chat note *and* a live panel refresh, not a silent panel-only
update; and the panel is a persistent compact bar (not a hidden drawer
behind a button, unlike Reflection/Accessibility), since the spec called for
it to "remain visible throughout."

**Verified live**: `node --check` on every touched server file; a Python
script confirmed `scenarios.json` parses and every scenario has exactly 2
mission stages with the expected carried-forward objective ids. Restarted
the server manually (required -- `scenarios.json` is loaded via
`readFileSync`, same `--watch` gotcha as always) and hit `/api/chat`
directly via `curl` for the salon scenario: a message naming a specific
noise-related need advanced `stage-1` -> `stage-2` with `notice-overload`/
`speak-up` correctly marked complete; a second request that *reported*
`stage-2` already active against an early, stage-1-looking transcript
confirmed the monotonic guard -- the response never regressed to `stage-1`
and kept the previously-completed objectives checked. Playwright (headless
Chromium, 420x900, existing method for this repo) confirmed the mission bar
renders collapsed at 0/3 on scenario entry, expands to show all three
unchecked objectives, and after sending a message satisfying stage 1's
`advanceWhen`: an inline "🎯 Mission Updated" note appears in the chat feed,
the bar refreshes to stage 2's text at 2/3 with the carried-forward
objectives shown checked and struck through, and zero `pageerror`/console
errors. Also re-checked in dark mode (via the Accessibility panel) --
`--color-tint`/`--color-primary`/`--border-width` all resolved correctly
against the mission bar's new CSS, no contrast or layout issues.

## v8 — Removed Beginner/Intermediate as picker options; rewrote "Asking for a Change"

**Difficulty simplification:** each scenario card now has one full-width
"Start scenario" button (`ScenarioCard.jsx`) instead of three (Beginner /
Intermediate / Advanced), always calling `onSelect(scenario, "advanced")`.
`App.jsx`'s `activeDifficulty` default changed from `"beginner"` to
`"advanced"` to match. The chat header's small difficulty badge was removed
too (`ChatHeader.jsx` no longer takes a `difficulty` prop) -- with only one
value ever possible, the badge stopped conveying anything. **This is a UI
change, not an engine change**: the backend's three-tier
`DIFFICULTY_LEVELS` (`routes/api.js`), `DIFFICULTY_GOALS`
(`npcPromptBuilder.js`), and difficulty-gated template events
(`sceneDirector.js`) are all untouched -- beginner/intermediate content
still fully exists and works if a request explicitly sends that difficulty,
it's just no longer reachable from the picker. Verified this doesn't
silently break any existing scenario content: every template event across
all 4 scenarios already listed `"advanced"` in its eligible-difficulty
array (confirmed by reading `scenarios.json`), so switching the default to
advanced-only doesn't strand any event as unreachable. Two defaults updated
for consistency now that beginner is never actually selected:
`resolveDifficulty` in `routes/api.js` and the `difficulty` destructuring
default in `dialogueEngine.generateReply` both now fall back to
`"advanced"` instead of `"beginner"`.

**"Asking for a Change" rewrite** (`server/src/data/scenarios.json`,
`server/src/data/npcs.json`): the scenario used to open with Ms. Alvarez
noticing the student during quiet study time and asking "you okay?" --
i.e., *she* initiates, the student responds. Rewritten so she's mid-lecture
on the three classical rhetorical appeals (ethos, pathos, logos), speaking
uninterrupted (`opener` is a mid-sentence lecture snippet, not addressed to
the student, deliberately with no natural pause built in), and the
student's first message *is* the interruption -- there's no invitation to
speak built into the opener, matching the harder, more realistic version of
the self-advocacy ask: raising your hand and cutting in on a class already
in progress, not just answering a question you were asked directly.
- [x] `preview`, `setting`, `narratorOpening`, `narratorAtmosphere`,
      `teachingPoint`, and `opener` all rewritten around the lecture
      framing. `templateEvents` re-flavored to match (marker squeaking on
      the whiteboard, classmates taking notes, Ms. Alvarez pausing
      mid-lesson) -- same trigger/eventType/difficulty structure as before,
      just re-worded content.
- [x] `responseOptions` rewritten as three interruption styles rather than
      three answers to a direct question: back off after speaking up
      ("Um, sorry -- never mind"), name the frustration without a specific
      ask ("Sorry, but the lights are really bright"), and interrupt with a
      specific, reasonable request (recommended).
- [x] `npcs.json`'s `alvarez` blueprint updated to match: background/goals
      now describe her as comfortable pausing a lecture briefly without
      making it a bigger deal than the student wants, and all three
      `scenarioReactions` triggers/reactions rewritten around *interrupting*
      specifically (e.g. "pause the lesson, thank them for speaking up, and
      actually accommodate it right there... then continue the lesson
      without lingering on it or embarrassing them") rather than the old
      one-on-one check-in framing.

**Verified live**: rebuilt the client (clean build), restarted the server
(needed manually -- `scenarioStore.js` loads `scenarios.json` via
`readFileSync` at module load time, which `node --watch` does *not*
track the way it tracks `import`ed modules, so JSON-only edits require a
manual server restart to take effect; confirmed via `GET /api/scenarios`
returning stale content until restarted, then correct content after).
Playwright screenshots confirm the picker shows one "Start scenario" button
per card and the new preview/teaching-point text; entering the scenario
shows the mid-lecture opener with the three interruption-flavored response
chips. A live `POST /api/chat` call with the recommended interruption
("Sorry to interrupt -- could we dim some of the lights...") got a reply
matching the updated blueprint reaction exactly -- warm, immediate
accommodation, offering to adjust further. (That reply included one
asterisked stage direction, `*dimming the lights slightly*` -- this is the
known, previously-documented stage-direction-leakage risk from v5.1
"reduced, not guaranteed eliminated," not something newly introduced by
this content change; no action taken, already tracked as an open item.)

## v7 — Accessibility Features: consolidated prefs, favorites, read-aloud, scenario-card polish

**What it is:** a single "Accessibility Features" pill button, present in
both the picker header and the chat header, opening one shared slide-in
`AccessibilityPanel`. Everything it controls lives in one consolidated
prefs object (`AccessibilityContext.jsx`), persisted to `localStorage`.
There were no pre-existing separate dark/dyslexia toggles in Nexus to
literally "replace" -- this was built fresh, adapted to Nexus's actual two
screens (picker + chat; there's no "Results screen"), confirmed with the
user before building.

**Architecture (`client/src/a11y/AccessibilityContext.jsx`, new):**
- [x] One `prefs` object -- `{colorScheme, theme, textSize, typeface,
      contrast, motion}` -- persisted as `a11y_prefs`; `favorites` (array of
      scenario ids) persisted separately as `a11y_favs`. Both loaded via a
      try/catch JSON parse that falls back to defaults on any corruption.
- [x] `AccessibilityProvider` resolves `theme: "device"` and `motion:
      "device"` against `matchMedia("(prefers-color-scheme: dark)")` /
      `(prefers-reduced-motion: reduce)`, with live `change` listeners so
      flipping the OS setting updates the app without a reload. Applies the
      resolved state to `<html>` as `data-color-scheme` / `data-theme` /
      `data-contrast` / `data-typeface` / `data-motion` attributes --
      `index.css` styles off these directly; the context owns state and
      side effects only, no inline visual styling.
- [x] **Text size via CSS `zoom`** (`root.style.zoom`), not a relative type
      scale -- deliberate, since the app uses hardcoded px throughout and a
      relative rem/em scale would have meant touching every component's
      CSS. `zoom` scales layout and text together uniformly. Non-standard
      but broadly supported in Chromium/Safari; acceptable tradeoff for a
      hackathon timeline.
- [x] **Read-aloud registry pattern**: rather than lifting `ScenarioPicker`'s
      scenario list or `ChatScreen`'s `messages` state up to a shared
      ancestor, both screens call `registerReadableContent(getTextFn)` in a
      `useEffect` (re-registering when their content changes); the context
      holds only a ref to the latest getter. `playSpeech` calls it lazily
      right before speaking, so read-aloud always reads what's currently on
      screen without either screen's local state ever leaving that screen.
      Built on `window.speechSynthesis` / `SpeechSynthesisUtterance` --
      play/pause/stop, 4 speed presets, and a voice picker populated from
      `speechSynthesis.getVoices()` (loaded async via `onvoiceschanged`,
      per-browser quirk).
- [x] **Favorites**: `isFavorite`/`toggleFavorite`, rendered as a ★/☆ toggle
      button on each `ScenarioCard` (`scenario-card__favorite`, absolutely
      positioned top-right over the color block). Not surfaced anywhere else
      yet (no dedicated "favorites" filter/view) -- see Open decisions.
- [x] **Your data**: `exportData` (Blob + `URL.createObjectURL` +
      programmatic `<a download>` click) downloads `{prefs, favorites}` as
      JSON; `deleteAllData` clears both `localStorage` keys and resets state
      to defaults, gated behind a `window.confirm` in the panel.

**Components (all new):**
- [x] `AccessibilityButton.jsx` -- the shared pill; accepts an optional
      `className` that *replaces* rather than combines with the default
      `.a11y-button` styling (not `${className} a11y-button`), so it can
      take on `chat-header__hint`'s look in the chat header without a CSS
      cascade fight over which class wins.
- [x] `AccessibilityPanel.jsx` -- one `OptionGroup` helper renders each
      pref as a row of pill buttons (`aria-pressed`); rendered once, in
      `App.jsx`, as a sibling of whichever screen is active, so its
      `panelOpen` state (also in the context) stays in sync no matter which
      header's button opened it.
- [x] Registered in `ScenarioPicker.jsx` (readable content = every
      scenario's title + preview + teaching point, joined) and
      `ChatScreen.jsx` (readable content = scene setting + narrator
      opening/atmosphere + the conversation so far, in order, with
      "You said:" / "{NPC} said:" prefixes so the read-aloud output makes
      sense as audio rather than a jumbled transcript). `ChatScreen`'s
      auto-scroll also now checks `resolvedMotion` -- `behavior: "auto"`
      instead of `"smooth"` when motion is reduced.

**CSS (`client/src/index.css`):** color variables restructured from a bare
`:root` into four scoped blocks (`[data-color-scheme][data-theme]` combos:
calm-earthy/light (existing palette, now scoped rather than default-only),
calm-earthy/dark, blue-yellow/light, blue-yellow/dark, all new). `[data-
contrast="high"]` widens `--border-width` to 2px and forces pure black/white
borders and collapses `--color-text-muted` into `--color-text`. `[data-
typeface="dyslexia"]` swaps in a Verdana/Tahoma/Trebuchet MS stack with
wider letter/word/line spacing (no external font load, so it works offline
and doesn't add a network dependency). `[data-motion="reduce"] *` neutralizes
transitions/animations/smooth-scroll globally. New `.a11y-*` classes for the
button/overlay/slide-in panel (`animation: a11y-slide-in 0.2s ease-out`,
respects the same motion override) and `.scenario-card__favorite`.

**Pragmatic tradeoff, documented inline in the CSS:** `--color-primary` is
reused both as a *background* (chat header, user bubbles, active-state
buttons, paired with `--color-primary-contrast` text) and as plain
*foreground text* on `--color-tint` backgrounds (teaching-point text,
default difficulty-button text). A single token can't be ideal in both
roles at once, especially in dark mode. Picked medium-lightness purple/blue
values (`#7d68d6` calm-earthy dark, `#5b9bdb` blue-yellow dark) with white
contrast text, rather than a very light primary that would read well as
text-on-tint but invert the "primary = dark brand color" pattern everything
else assumes (e.g. `rgba(255,255,255,0.15)` overlay buttons on the chat
header). Good enough for both roles, not a perfect solution for either --
would take separate background/foreground tokens to fully resolve, not done
given the timeline.

**Also this session -- scenario card visual polish** (`ScenarioCard.jsx`
CSS only, no logic change): title (`.scenario-card__title`) enlarged and
bolded (1.1rem -> 1.4rem, `font-weight: 700`); description
(`.scenario-card__preview`) shrunk and lightened (0.92rem -> 0.85rem,
`var(--color-text)` -> `var(--color-text-muted)`); the teaching-point
element redesigned from a fully-rounded pill (`border-radius: 999px`, which
let long teaching-point text visually crowd/touch the rounded ends) into a
quote-block: `position: relative` with `::before`/`::after` pseudo-elements
placing a serif `"` top-left and `"` bottom-right (Georgia, 2.4rem, low
opacity), based on a reference screenshot the user provided of a card-style
UI element with corner quotation marks.

**Verified live via Playwright** (headless Chromium, 420x900 viewport,
against the running dev server): default picker view (card polish visible,
quote marks not touching text), panel open/close from both the picker and
chat headers, full combination of blue-yellow + dark theme + higher
contrast + dyslexia typeface + largest text size (legible and correctly
styled together), favoriting a card, clicking Play (no console/page errors
from `speechSynthesis`), and delete-all-data resetting cleanly back to
defaults on both screens. One real bug caught this way and fixed: a
`ReferenceError` (temporal-dead-zone) in `ChatScreen.jsx` from a
`useEffect` dependency array referencing `npcName` before its `const`
declaration further down the function -- fixed by hoisting the declaration
above the effects that use it. Without the Playwright check this would have
been a silent blank-screen crash on entering any scenario.

## v6 — Reflection: replaces the feedback panel with a 7-section, non-graded reflection

**What it is:** after roughly 10 lines of the user's dialogue
(`REFLECTION_TURN_THRESHOLD` in `ChatScreen.jsx`), a Reflection panel
auto-opens once per session; the header's "Reflection" button (renamed
from "Get feedback") re-opens it any time afterward, reflecting the
conversation as it stands at that moment. This is a full replacement of
the old `/api/feedback` endpoint and `FeedbackPanel.jsx`, not an addition
alongside it -- one end-of-conversation reflection surface, not two
overlapping ones.

**Seven sections, in this order** (`REFLECTION_SYSTEM_PROMPT` in
`prompts.js`, rendered by the new `ReflectionPanel.jsx`): Strengths You
Showed, What [NPC] Learned About You, Connection Moments, Your
Conversation Style, Growth Opportunities, Overall Echo, Conversation
Balance. **No numeric score, grade, or pass/fail judgment anywhere** --
explicit critical rules in the prompt, same as the old feedback prompt had,
carried forward and strengthened.

**Architectural choice: structured JSON for 6 sections, deterministic math
for the 7th.**
- [x] `server/src/engine/openaiClient.js` gained `completeJson()` --
      requests OpenAI's JSON mode (`response_format: {type:
      "json_object"}`) and parses the result. Sections 1-6 (strengths,
      NPC's perspective, connection moments, style label + description,
      growth opportunities, overall echo) come back as one structured
      object from a single model call, rather than one block of prose the
      UI would have to guess how to split apart.
- [x] `server/src/engine/conversationStats.js` (new) --
      `computeConversationBalance(messages, npcName)` computes the
      "Conversation Balance" section (e.g. "You: 61% / Marcus: 39%") as a
      plain word-count ratio in code, **not asked of the model at all**.
      The spec explicitly asked for something simple here ("word/turn
      count ratio is fine, doesn't need to be sophisticated"), and models
      are unreliable at exact counting -- there's no reason to spend a
      model call, or risk an inaccurate one, on arithmetic a few lines of
      JavaScript already does exactly. Same design philosophy as
      `sceneDirector.js`'s stall detection: free, deterministic, no LLM
      call for what doesn't need one.
- [x] `dialogueEngine.generateReflection(aiRole, messages)` calls
      `completeJson`; `routes/api.js`'s new `POST /api/reflection` merges
      the model's 6 JSON fields with the computed `balance` into one
      response.
- [x] Reused the existing `NON_CONFORMITY_FRAMING` constant in the
      reflection prompt (same as explain/hint/narrator-subtext) -- this
      surface is exactly the kind of place a "how normal did that sound"
      evaluation could sneak in, so it gets the same explicit guard as
      everywhere else.

**Client side:**
- [x] `ChatScreen.jsx`: `userTurnCount` derived from `messages`; a
      ref-guarded `useEffect` auto-calls `handleReflect()` exactly once
      when the count first reaches the threshold (re-opening later via the
      button doesn't re-fire the auto-trigger, and re-fetches fresh each
      time rather than showing a stale cached reflection).
      `REFLECTION_TURN_THRESHOLD = 10`, called out in a comment as
      adjustable, not meant to be exact.
- [x] `ReflectionPanel.jsx` (new, replaces `FeedbackPanel.jsx`) renders
      the 7 sections as distinct blocks -- bullet lists for the array
      fields (strengths, connection moments, growth opportunities),
      prose for the paragraph fields (NPC perspective, overall echo), a
      bold style-label + one-line description, and a small two-segment
      percentage bar for the balance split. Defensive against partially
      missing fields (`?? []` on array fields) since JSON-mode guarantees
      valid JSON syntax but not that the model populated every key.
      Same non-blocking bottom-sheet pattern as the old feedback panel --
      auto-opening doesn't hard-interrupt the conversation, it's one tap
      to close and keep going.
- [x] `ChatHeader.jsx`: `onGetFeedback`/`feedbackDisabled` props renamed
      to `onReflect`/`reflectDisabled`; button label "Get feedback" ->
      "Reflection". Kept the existing "available once there's ≥1 user
      turn" gating for manual access, on top of the new auto-trigger.

**Verified live** against a realistic ~10-turn salon conversation (shared
an interest in AP Lit, discussed The Great Gatsby): all 7 sections came
back well-formed and specific to what was actually said (e.g. connection
moments correctly referenced the Gatsby/Nick exchange, not generic
praise), the style label was a sensibly invented "The Reflective Reader"
rather than reaching for a rote description from the request's given
examples ("explorer"/"storyteller"/"supporter"), no score or grade
anywhere in the output, and the balance math computed correctly (61/39
split from six mixed-length turns per side). Also verified: the old
`/api/feedback` route is cleanly gone (plain Express 404, not a crash),
and 404/400 error handling on the new `/api/reflection` route matches the
existing pattern.

## v5.1 — Bug fix: stall detection wasn't actually firing

**Reported symptom:** in a real conversation where the user gave
progressively disengaged replies ("na", "forsure", "yes", "..."), Marcus
never handed off to the Narrator -- instead he produced several turns in a
row that were reworded restatements of the same sentiment ("let me know if
you need anything" / "let me know if you want to chat" / "enjoy relaxing"),
which is exactly the flat, repetitive pattern stall detection was supposed
to catch and never did.

**Root cause, confirmed by tracing the reported transcript against the v5
code:** `detectStall` required the NPC's *previous* line to also be
low-content, alongside the user's new reply. But Marcus is chatty by
design (his blueprint says so) -- he never produces a minimal line, so that
half of the condition was never true, no matter how terse the user got.
The check was structurally sound (it does run every single turn, inside
`generateReply` on every `/api/chat` call -- confirmed this was not a
wiring problem) but the *trigger condition* silently required a signal
(a minimal NPC line) that this NPC's personality makes nearly impossible
to produce.

**Fix, `server/src/engine/sceneDirector.js` `detectStall`:** now also
triggers when the user's **last two consecutive turns** are both
low-content, independent of what the NPC said -- this is the primary
signal now, since a talkative NPC can mask a disengaged user if only the
NPC's line length is checked. The original condition (NPC's own last line
also minimal) is kept as a second, independent way to trigger.

**Two more bugs found while testing the fix, both fixed:**

1. **Stage directions leaking through on low-key turns.** Once Marcus was
   told he could keep a reply very short, he sometimes described an action
   in asterisks (`*snips scissors* Alright.`) instead of just speaking. The
   "no stage directions" rule already existed in the base continuity
   addendum, but needed to be repeated, first, and more forcefully inside
   the event-injection text itself (`buildEventInjection` in
   `npcPromptBuilder.js`) -- primacy mattered here. Verified clean across
   16 event-injected turns in testing after the fix (zero stage directions,
   down from a reproducible failure).
2. **The exact repeated filler phrase was baked into the NPC's own
   blueprint.** Marcus's `scenarioReactions` literally quoted an example
   line -- `'...just let me know if you need anything'` -- as sample
   dialogue for a *different* trigger condition (the user directly asking
   for quiet). That quoted phrase sits in his rendered system prompt on
   *every* turn regardless of relevance, and the model was reaching for it
   as safe filler once the conversation went quiet -- essentially echoing
   its own instructions back. The exact same phrase was independently
   present in Ms. Alvarez's blueprint too. **Fixed by removing all literal
   quoted example dialogue from every NPC blueprint in `npcs.json`**
   (9 reaction entries across Priya, Dana, Marcus, and Ms. Alvarez),
   replacing each with a description of the *behavior* rather than an
   exact line to reuse -- e.g. "offer a practical adjustment suited to what
   they specifically asked for" instead of a quotable example sentence.
   This is a general lesson worth remembering for any future blueprint
   content: **don't put example dialogue in quotes inside a blueprint that
   gets resent every turn** -- the model treats it as a template to reuse,
   which becomes exactly the kind of repetitive, generic filler the
   Narrator/blueprint system was built to avoid.
3. **Added a second `"stall"`-trigger event per scenario** (8 events total,
   up from 4) so that once the more aggressive stall detection fires
   repeatedly in one low-engagement stretch -- which it now does, by design
   -- the Narrator alternates between two different atmospheric beats
   instead of showing the identical line every time. The salon scenario's
   stall text was also rewritten to closely match the example given in the
   bug report ("The shop quiets for a moment -- the buzz of the clippers
   fills the space. Marcus focuses on the cut, comfortable letting the
   silence sit.").

**Verified via a live replay of a conversation matching the reported
pattern** (`Just a trim is fine, thanks.` -> `not busy just everyday
school` -> `AP lit` -> `not really` -> `na` -> `forsure` -> `yes` -> `...`),
run twice against the running server:
- Stall detection now fires starting at turn 4 (`"not really"`, the second
  consecutive low-content user turn) in both runs -- previously it never
  fired at all across the whole transcript.
- Zero stage directions and zero repeated filler phrases across 16
  event-injected turns.
- Marcus's replies during the low-engagement stretch were short and varied
  ("Alright, I'll keep it simple." / "Mm-hm." / "How's the length looking
  for you so far?" / "Alright."), not the same restated line.
- A separate control check (an engaged, enthusiastic reply) confirmed the
  fix didn't make Marcus generically terse -- he still responds fully and
  warmly when the user is actually engaged; the brevity only kicks in
  during a genuine stall.

## v5 — Pre-built social simulation architecture (previous session, major)

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

- **v17 redesign was explicitly desktop-first**: the user said not to
  worry about mobile during the redesign pass. Mobile still works (nothing
  was broken), but wasn't chased for pixel fidelity against the Chat/Home
  Mobile mockups the way desktop was -- worth a dedicated mobile pass if
  it starts to feel neglected.
- **`.picker__hero`'s colorful squares are hand-placed inline styles, not
  a reusable component or a real asset (v17)**: eight `<span>`s with
  literal position/size/rotation/color in `ScenarioPicker.jsx`. Fine for a
  single fixed composition, but if this ever needs to vary (e.g. per
  season, per theme) it should become data-driven instead of hand-edited.
- **Boundary rail lines are intentionally very subtle (v17)**: both the
  picker's and chat's decorative vertical hairlines use a low-alpha
  gradient (matching the design handoff's own `rgba(...,0.1-0.12)` values)
  -- they're nearly invisible against a busy background by design, not a
  bug. If they should read as more of a deliberate "frame," the fix is
  raising that alpha, not repositioning them.
- **Favorites have no dedicated view yet (v7)**: the ★ toggle on each
  scenario card persists to `a11y_favs` and is fully functional, but
  there's no "show favorites only" filter or sorting-favorites-first on the
  picker grid -- the spec described favorites as part of the accessibility
  data model, not a specific UI request, so this stops at persistence +
  the toggle. Easy follow-up if wanted: a filter chip in `ScenarioPicker.jsx`
  reading `favorites`/`isFavorite` from the same context.
- **Text-size `zoom` is Chromium/Safari-only, not standard CSS (v7)**: works
  correctly in the browsers most users will actually use, but has no effect
  in Firefox (no `zoom` support) -- the Text size control would silently do
  nothing there. Verified only in Chromium (via Playwright) this session,
  not cross-browser. If Firefox support turns out to matter, the fix is
  larger: converting the app's hardcoded px to a relative unit and scaling
  a root `font-size` instead.
- **`--color-primary` dual-role compromise, not a full fix (v7)**: see the
  v7 section above -- one CSS variable serves as both background and
  on-tint text color, so the dark-mode values are a deliberate middle
  ground rather than optimal for either use. Worth splitting into separate
  background/foreground tokens if dark mode gets more visual polish passes.
- **Prompt caching**: skipped for Phase 1 -- not worth the complexity for the
  timeline given how short the scenario prompts are. Revisit if the
  explain/reflection templates grow (e.g. with few-shot examples) or if
  per-turn latency/cost becomes a problem.
- **Streaming**: `/api/chat`, `/api/explain`, and `/api/reflection` are all
  non-streaming request/response for now (simplest to build and debug this
  week). If typing-indicator latency feels bad in testing, consider streaming
  `/api/chat` specifically. `/api/reflection` in particular returns a large
  JSON object in one shot with no progressive rendering -- if the ~10-turn
  auto-trigger feels slow, this is the one to revisit first.
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
- **Stall-detection heuristic: validated once, against a real reported bug
  (v5.1)**: the original design (both NPC's line and user's reply
  low-content) turned out to structurally never fire against a chatty NPC
  -- see v5.1 above. The fixed version (2 consecutive low-content user
  turns, independent of the NPC) was confirmed against a live replay, but
  it's still just one confirmed pattern, not a broad validation. It may
  still fire too eagerly (a user who gives two naturally short-but-engaged
  answers in a row) or miss a real stall phrased in more words. Worth
  continued watching in play-testing; the word-count/filler-list
  thresholds and the "2 consecutive turns" window are the numbers to
  adjust in `sceneDirector.js` if so -- no architecture change needed.
- **Stage-direction leakage is reduced, not guaranteed eliminated
  (v5.1)**: after the fix, 16 event-injected turns in testing had zero
  stage directions -- a real improvement -- but this is prompt-based
  suppression of a probabilistic model behavior, not a hard guarantee.
  Longer play-testing could still surface an occasional slip. If it
  becomes a recurring problem, the more robust fix would be a
  post-processing step that strips anything wrapped in `*asterisks*` from
  `message` before it's returned to the client, rather than relying on
  prompting alone -- not built now since testing after the fix showed a
  clean run, but worth keeping in mind.
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
- **Auto-open vs. notify-only (interpretation call, v6)**: the spec said
  "show a Reflection screen" after ~10 lines, which I took literally --
  the panel auto-opens rather than just showing a subtle "ready" indicator
  the user taps to view. This is a real interruption of the conversation
  flow, even though the panel is a dismissible bottom sheet (one tap to
  close and keep going, chat state untouched underneath) rather than a
  hard block. If auto-opening feels too disruptive in play-testing, the
  softer alternative -- a small banner/badge inviting the user to open it,
  never forcing the panel -- is a small change scoped entirely to the
  `useEffect` in `ChatScreen.jsx`; nothing in the backend would need to
  change.
- **Threshold counts only real user turns, not words**: `userTurnCount` is
  a count of `role: "user"` messages, not a word/character count. A
  conversation of ten one-word replies "counts" the same as ten
  paragraph-length ones for triggering purposes, even though the spec's
  own "roughly 10 lines of dialogue" phrasing arguably leans toward turn
  count anyway. Not adjusted, since turn count is simpler and the spec
  explicitly said the exact threshold doesn't matter.
- **Reflection re-fetches fresh on every open, no caching**: clicking
  "Reflection" again later in a long conversation re-runs the full model
  call rather than showing the previously-fetched result. This is simplest
  and means the reflection is always current, but it does mean repeatedly
  opening it mid-conversation costs a full reflection-generation call each
  time (6-field JSON response, not a single-sentence one) -- worth a
  lightweight "last fetched N turns ago, refresh?" affordance if that
  turns out to matter in practice, not built now.

## Resuming a session

1. `cd server && npm install && npm run dev` (needs `server/.env` with a
   real `OPENAI_API_KEY` — copy from `.env.example` if starting fresh).
2. `cd client && npm install && npm run dev`, open the printed localhost URL.
3. Check this file's "What's next" section before starting new work, and
   update the checklist above as you go.
