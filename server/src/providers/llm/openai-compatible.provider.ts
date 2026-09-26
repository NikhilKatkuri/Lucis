import { env } from "../../config/env.js";
import type { AiMessage } from "../../modules/ai/provider.js";
import { requestJson, requestStream, streamLines, type JsonObject } from "../http.js";

function contentOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((part): part is JsonObject => typeof part === "object" && part !== null).map((part) => typeof part.text === "string" ? part.text : "").join("");
  return "";
}

export class OpenAiCompatibleProvider {
  constructor(readonly name: string, private readonly apiKey: string | undefined, private readonly baseUrl: string, private readonly model: string, private readonly query = "", private readonly authHeader: "authorization" | "api-key" = "authorization") {}
  isConfigured(): boolean { return Boolean(this.apiKey); }
  async initialize(): Promise<void> { return Promise.resolve(); }
  private endpoint(path: string): string { return `${this.baseUrl}${path}${this.query}`; }
  private headers(): HeadersInit { return { "content-type": "application/json", [this.authHeader]: this.authHeader === "api-key" ? this.apiKey ?? "" : `Bearer ${this.apiKey ?? ""}` }; }
  async chat(messages: AiMessage[]): Promise<string> {
    if (!this.isConfigured()) throw new Error(`${this.name} API key is not configured`);
    const data = await requestJson(this.endpoint("/chat/completions"), { method: "POST", headers: this.headers(), body: JSON.stringify({ model: this.model, messages, temperature: 0.2, stream: false }) }, this.name);
    const choices = Array.isArray(data.choices) ? data.choices : [];
    const message = choices[0] && typeof choices[0] === "object" && choices[0] !== null && "message" in choices[0] ? (choices[0] as JsonObject).message : undefined;
    const content = typeof message === "object" && message !== null && "content" in message ? contentOf(message.content) : "";
    if (!content) throw new Error(`${this.name} returned an empty response`);
    return content;
  }
  async stream(messages: AiMessage[], onToken: (token: string) => void): Promise<void> {
    if (!this.isConfigured()) throw new Error(`${this.name} API key is not configured`);
    const response = await requestStream(this.endpoint("/chat/completions"), { method: "POST", headers: this.headers(), body: JSON.stringify({ model: this.model, messages, temperature: 0.2, stream: true }) }, this.name);
    await streamLines(response, (line) => {
      const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (payload === "[DONE]") return;
      try {
        const data = JSON.parse(payload) as JsonObject;
        const choices = Array.isArray(data.choices) ? data.choices : [];
        const delta = choices[0] && typeof choices[0] === "object" && choices[0] !== null && "delta" in choices[0] ? (choices[0] as JsonObject).delta : undefined;
        if (typeof delta === "object" && delta !== null && "content" in delta) { const token = contentOf(delta.content); if (token) onToken(token); }
      } catch { /* ignore keep-alive lines */ }
    });
  }
  async health(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try { await requestJson(this.endpoint(`/models/${encodeURIComponent(this.model)}`), { headers: this.headers() }, this.name); return true; } catch { return false; }
  }
  async embeddings(input: string): Promise<number[]> {
    if (!this.isConfigured()) throw new Error(`${this.name} API key is not configured`);
    const data = await requestJson(this.endpoint("/embeddings"), { method: "POST", headers: this.headers(), body: JSON.stringify({ model: this.name === "openai" ? "text-embedding-3-small" : this.model, input }) }, this.name);
    const first = Array.isArray(data.data) ? data.data[0] : undefined;
    const embedding = first && typeof first === "object" && first !== null && "embedding" in first && Array.isArray(first.embedding) ? first.embedding as unknown[] : [];
    return embedding.filter((value: unknown): value is number => typeof value === "number");
  }
}
