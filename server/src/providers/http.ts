import { env } from "../config/env.js";

export class ProviderError extends Error {
  constructor(message: string, readonly provider: string, readonly retryable = true, readonly status?: number) {
    super(message);
    this.name = "ProviderError";
  }
}

export type JsonObject = Record<string, unknown>;

export async function requestJson(url: string, init: RequestInit, provider: string): Promise<JsonObject> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: { message: text } }; }
    if (!response.ok) {
      const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "object" && data.error !== null && "message" in data.error ? String(data.error.message) : `HTTP ${response.status}`;
      throw new ProviderError(`${provider}: ${message}`, provider, response.status >= 500 || response.status === 429, response.status);
    }
    return (typeof data === "object" && data !== null ? data : {}) as JsonObject;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    const message = error instanceof Error && error.name === "AbortError" ? "request timed out" : error instanceof Error ? error.message : "network request failed";
    throw new ProviderError(`${provider}: ${message}`, provider);
  } finally {
    clearTimeout(timer);
  }
}

export async function streamLines(response: Response, onLine: (line: string) => void): Promise<void> {
  if (!response.body) throw new Error("Provider returned an empty stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onLine(line.trim());
    if (done) break;
  }
  if (buffer.trim()) onLine(buffer.trim());
}

export async function requestStream(url: string, init: RequestInit, provider: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);
  const response = await fetch(url, { ...init, signal: controller.signal });
  clearTimeout(timer);
  if (!response.ok) {
    const text = await response.text();
    throw new ProviderError(`${provider}: ${text || `HTTP ${response.status}`}`, provider, response.status >= 500 || response.status === 429, response.status);
  }
  return response;
}
