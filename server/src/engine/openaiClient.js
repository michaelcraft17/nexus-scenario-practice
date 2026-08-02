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
    max_tokens: maxTokens,
    messages: [{ role: "system", content: system }, ...messages],
  });

  return response.choices[0]?.message?.content ?? "";
}

export { MODEL };
