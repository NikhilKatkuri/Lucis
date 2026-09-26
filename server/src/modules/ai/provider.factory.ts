import { GeminiProvider } from "../../providers/llm/gemini.provider.js";
import { GroqProvider } from "../../providers/llm/groq.provider.js";
import { OpenAiProvider } from "../../providers/llm/openai.provider.js";
import { OllamaProvider } from "../../providers/llm/ollama.provider.js";
import { AzureProvider } from "../../providers/llm/azure.provider.js";
import type { AiProvider } from "./provider.js";

const factories: Record<string, () => AiProvider> = { azure: () => new AzureProvider(), gemini: () => new GeminiProvider(), groq: () => new GroqProvider(), openai: () => new OpenAiProvider(), ollama: () => new OllamaProvider() };
export function createProvider(name: string): AiProvider { return factories[name] ? factories[name]() : new OllamaProvider(); }
