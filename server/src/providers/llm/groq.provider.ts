import { env } from "../../config/env.js";
import { OpenAiCompatibleProvider } from "./openai-compatible.provider.js";

export class GroqProvider extends OpenAiCompatibleProvider {
  constructor() { super("groq", env.GROQ_API_KEY, "https://api.groq.com/openai/v1", env.GROQ_MODEL); }
}
