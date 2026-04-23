import Anthropic from "@anthropic-ai/sdk";

/**
 * Creates a resilient Anthropic client.
 *
 * In Replit development the AI integration injects a local proxy at
 * localhost:1106 (AI_INTEGRATIONS_ANTHROPIC_BASE_URL) and a dummy key.
 * In deployed production containers that proxy sometimes cannot authenticate
 * (REPL_IDENTITY token unavailable), returning HTTP 500 with no body.
 *
 * Priority:
 *   1. If ANTHROPIC_API_KEY is set → use it directly against api.anthropic.com
 *   2. Otherwise → fall back to the Replit integration proxy (works in dev)
 */
export function createAnthropicClient(): Anthropic {
  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });
}
