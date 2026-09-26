import { aiProviders } from "../../config/env.js";
import { createProvider } from "./provider.factory.js";
import type { AiMessage, AiProvider } from "./provider.js";

export class ProviderManager {
  private providers: AiProvider[] = aiProviders.map(createProvider);
  async chat(messages: AiMessage[]): Promise<{ provider: string; content: string }> {
    const failures: string[] = [];
    for (const provider of this.providers) {
      if (!provider.isConfigured()) { failures.push(`${provider.name}: not configured`); continue; }
      try { return { provider: provider.name, content: await provider.chat(messages) }; } catch (error) { failures.push(error instanceof Error ? error.message : `${provider.name}: request failed`); }
    }
    throw new Error(`No configured AI provider is available. ${failures.join("; ")}`);
  }
  async stream(messages: AiMessage[], onToken: (token: string) => void): Promise<string> {
    const failures: string[] = [];
    for (const provider of this.providers) {
      if (!provider.isConfigured()) { failures.push(`${provider.name}: not configured`); continue; }
      try { await provider.stream(messages, onToken); return provider.name; } catch (error) { failures.push(error instanceof Error ? error.message : `${provider.name}: stream failed`); }
    }
    throw new Error(`No configured AI provider is available. ${failures.join("; ")}`);
  }
  async health() { return Promise.all(this.providers.map(async (provider, index) => ({ name: provider.name, priority: index + 1, status: !provider.isConfigured() ? "unconfigured" : (await provider.health() ? "healthy" : "unavailable") }))); }
  list() { return this.providers.map((provider, index) => ({ name: provider.name, priority: index + 1, status: provider.isConfigured() ? "configured" : "unconfigured" })); }
  setOrder(names: string[]) { this.providers = names.map(createProvider); return this.list(); }
}
export const providerManager = new ProviderManager();
