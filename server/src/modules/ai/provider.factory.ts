import { GeminiProvider } from "../../providers/llm/gemini.provider.js";
import { GroqProvider } from "../../providers/llm/groq.provider.js";
import { OpenAiProvider } from "../../providers/llm/openai.provider.js";
import { OllamaProvider } from "../../providers/llm/ollama.provider.js";
import type { AiProvider } from "./provider.js";

export function createProvider(name: string): AiProvider { return ({ gemini: () => new GeminiProvider(), groq: () => new GroqProvider(), openai: () => new OpenAiProvider(), ollama: () => new OllamaProvider() }[name] ?? (() => new OllamaProvider()))(); }
