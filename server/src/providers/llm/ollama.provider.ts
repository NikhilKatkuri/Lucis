import { env } from "../../config/env.js";
import type { AiMessage } from "../../modules/ai/provider.js";
import { requestJson, requestStream, streamLines, type JsonObject } from "../http.js";

export class OllamaProvider {
  readonly name = "ollama";
  isConfigured(): boolean { return Boolean(env.OLLAMA_BASE_URL); }
  async initialize(): Promise<void> { return Promise.resolve(); }
  private url(path: string): string { return `${env.OLLAMA_BASE_URL.replace(/\/$/, "")}${path}`; }
  async chat(messages: AiMessage[]): Promise<string> {
    const data = await requestJson(this.url("/api/chat"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: env.OLLAMA_MODEL, messages, stream: false, options: { temperature: 0.2 } }) }, this.name);
    const message = typeof data.message === "object" && data.message !== null && "content" in data.message ? String(data.message.content) : "";
    if (!message) throw new Error("ollama returned an empty response");
    return message;
  }
  async stream(messages: AiMessage[], onToken: (token: string) => void): Promise<void> {
    const response = await requestStream(this.url("/api/chat"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: env.OLLAMA_MODEL, messages, stream: true, options: { temperature: 0.2 } }) }, this.name);
    await streamLines(response, (line) => { try { const data = JSON.parse(line) as JsonObject; const message = data.message; if (typeof message === "object" && message !== null && "content" in message && typeof message.content === "string") onToken(message.content); } catch { /* ignore malformed stream lines */ } });
  }
  async health(): Promise<boolean> { try { await requestJson(this.url("/api/tags"), {}, this.name); return true; } catch { return false; } }
  async embeddings(input: string): Promise<number[]> { const data = await requestJson(this.url("/api/embed"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: env.OLLAMA_MODEL, input }) }, this.name); return Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0]) ? data.embeddings[0].filter((value): value is number => typeof value === "number") : []; }
}
