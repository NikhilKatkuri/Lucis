import { env } from "../../config/env.js";
import { OpenAiCompatibleProvider } from "./openai-compatible.provider.js";

/** Azure OpenAI uses the same chat/embedding payloads with deployment URLs and api-key auth. */
export class AzureProvider extends OpenAiCompatibleProvider {
  constructor() {
    const endpoint = env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "") ?? "https://invalid.azure.com";
    const deployment = env.AZURE_OPENAI_DEPLOYMENT ?? "";
    super("azure", env.AZURE_OPENAI_API_KEY, `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}`, deployment, `?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION)}`, "api-key");
  }
}
