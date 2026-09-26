import { aiProviders } from "../../config/env.js";
import { GeminiProvider } from "../../providers/llm/gemini.provider.js";
import { GroqProvider } from "../../providers/llm/groq.provider.js";
import { OpenAiProvider } from "../../providers/llm/openai.provider.js";
import { OllamaProvider } from "../../providers/llm/ollama.provider.js";
import type { AiMessage, AiProvider } from "./provider.js";

const providerMap: Record<string, () => AiProvider> = { gemini: () => new GeminiProvider(), groq: () => new GroqProvider(), openai: () => new OpenAiProvider(), ollama: () => new OllamaProvider() };
export class ProviderManager {
  private readonly providers: AiProvider[] = aiProviders.map((name) => providerMap[name]?.() ?? new OllamaProvider());
  async chat(messages: AiMessage[]): Promise<{ provider: string; content: string }> {
    for (const provider of this.providers) { try { return { provider: provider.name, content: await provider.chat(messages) }; } catch { /* fallback */ } }
    throw new Error("No AI provider is available");
  }
  list() { return this.providers.map((provider, index) => ({ name: provider.name, priority: index + 1, status: "configured" })); }
}
export const providerManager = new ProviderManager();
