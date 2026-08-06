import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
// The "-mini" realtime tier -- same cost-conscious reasoning as gpt-5.6-luna
// for the text model (see .env.example): live voice sessions bill for the
// whole call's audio duration, not per-message, so the cheaper tier matters
// more here, not less.
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-mini";

let client;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Send a request to OpenAI's Chat Completions API and return the reply text.
 * @param {object} params
 * @param {string} params.system - System prompt.
 * @param {{role: "user"|"assistant", content: string}[]} params.messages
 * @param {number} [params.maxTokens]
 * @returns {Promise<string>}
 */
export async function complete({ system, messages, maxTokens = 1024 }) {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    // max_completion_tokens, not the legacy max_tokens -- newer model
    // families (e.g. gpt-5.6-luna) reject max_tokens outright ("Unsupported
    // parameter"), while max_completion_tokens works the same way on both
    // those and older models like gpt-4o (max_tokens is auto-converted to
    // it internally there), so this one name is safe for any OPENAI_MODEL.
    max_completion_tokens: maxTokens,
    messages: [{ role: "system", content: system }, ...messages],
  });

  return response.choices[0]?.message?.content ?? "";
}

/**
 * Same as complete(), but requests OpenAI's JSON mode and parses the
 * result -- for prompts (like the Reflection) that need several distinct
 * structured fields back, rather than one block of prose to display as-is.
 * The system/user prompt must mention "JSON" somewhere (OpenAI requires
 * this in JSON mode) and should specify the exact keys expected.
 * @param {object} params
 * @param {string} params.system
 * @param {{role: "user"|"assistant", content: string}[]} params.messages
 * @param {number} [params.maxTokens]
 * @returns {Promise<object>}
 */
export async function completeJson({ system, messages, maxTokens = 1024 }) {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, ...messages],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text);
}

/**
 * Mint a short-lived Realtime API client secret the browser can use to open
 * a voice call directly against OpenAI over WebRTC -- our server is never
 * in the audio path, it only hands out a scoped, expiring credential (never
 * the real OPENAI_API_KEY) pre-configured with this NPC's personality and
 * voice, so the browser can't be pointed at a different character or model.
 * @param {object} params
 * @param {string} params.instructions - Full system-prompt-equivalent text
 *   (scene anchor + NPC blueprint + voice continuity addendum).
 * @param {string} params.voice - One of the Realtime API's built-in voices.
 * @returns {Promise<{clientSecret: string, expiresAt: number, model: string}>}
 */
export async function createRealtimeClientSecret({ instructions, voice }) {
  const result = await getClient().realtime.clientSecrets.create({
    // 10 minutes -- long enough for one practice call, short enough that a
    // leaked secret (e.g. via browser devtools) isn't useful for long.
    expires_after: { anchor: "created_at", seconds: 600 },
    session: {
      type: "realtime",
      model: REALTIME_MODEL,
      instructions,
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
        },
        output: { voice },
      },
    },
  });

  return {
    clientSecret: result.value,
    expiresAt: result.expires_at,
    model: REALTIME_MODEL,
  };
}

export { MODEL };
