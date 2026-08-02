import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let client;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Send a single-turn or multi-turn request to Claude and return the reply text.
 * @param {object} params
 * @param {string} params.system - System prompt.
 * @param {{role: "user"|"assistant", content: string}[]} params.messages - Must start with role "user".
 * @param {number} [params.maxTokens]
 * @returns {Promise<string>}
 */
export async function complete({ system, messages, maxTokens = 1024 }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export { MODEL };
