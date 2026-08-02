import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

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

export { MODEL };
