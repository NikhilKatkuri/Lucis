import { env } from "../../config/env.js";
import { OpenAiCompatibleProvider } from "./openai-compatible.provider.js";

export class OpenAiProvider extends OpenAiCompatibleProvider {
  constructor() { super("openai", env.OPENAI_API_KEY, env.OPENAI_BASE_URL, env.OPENAI_MODEL); }
}
