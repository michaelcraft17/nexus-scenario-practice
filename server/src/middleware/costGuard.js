import rateLimit from "express-rate-limit";

/**
 * Two independent, deliberately simple safeguards against running up
 * OpenAI billing once this app is publicly reachable -- neither needs a
 * database or an external service, both are fine for a single-instance
 * hackathon deployment (in-memory state, so it resets on redeploy and
 * isn't shared across instances if this ever scales horizontally; a real
 * production deployment would want Redis-backed limits instead).
 *
 * 1. Per-IP rate limit: stops one source (a person spamming, or a script)
 *    from running many requests in a short window. Generous enough for a
 *    real multi-turn practice conversation (a full mission is roughly
 *    5-10 user turns, each turn making 2 model calls server-side).
 * 2. Global daily cap: protects the budget even if abuse is spread across
 *    many different IPs (e.g. a link shared widely, or distributed bot
 *    traffic) that would each individually stay under the per-IP limit.
 *    Resets at midnight UTC. Once hit, every model-calling route returns
 *    503 rather than forwarding to OpenAI, for everyone, until the reset.
 */

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this connection -- please wait a few minutes and try again." },
});

const DAILY_REQUEST_CAP = Number(process.env.DAILY_REQUEST_CAP) || 500;

let dailyCount = 0;
let resetAt = nextMidnightUtc();

function nextMidnightUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

export function globalDailyCap(req, res, next) {
  const now = Date.now();
  if (now >= resetAt) {
    dailyCount = 0;
    resetAt = nextMidnightUtc();
  }

  if (dailyCount >= DAILY_REQUEST_CAP) {
    return res.status(503).json({
      error: "This demo has hit its request limit for today -- please check back tomorrow.",
    });
  }

  dailyCount += 1;
  next();
}
