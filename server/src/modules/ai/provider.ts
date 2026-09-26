export interface AiMessage { role: "system" | "user" | "assistant"; content: string; }
export interface AiProvider { readonly name: string; initialize(): Promise<void>; chat(messages: AiMessage[]): Promise<string>; stream(messages: AiMessage[], onToken: (token: string) => void): Promise<void>; health(): Promise<boolean>; embeddings(input: string): Promise<number[]>; }

export abstract class LocalProvider implements AiProvider {
  abstract readonly name: string;
  async initialize(): Promise<void> { return Promise.resolve(); }
  async chat(messages: AiMessage[]): Promise<string> { return `Lucis context response: ${messages.at(-1)?.content ?? "No context provided."}`; }
  async stream(messages: AiMessage[], onToken: (token: string) => void): Promise<void> { onToken(await this.chat(messages)); }
  async health(): Promise<boolean> { return true; }
  async embeddings(input: string): Promise<number[]> { return Array.from({ length: 8 }, (_, index) => (input.charCodeAt(index) || 0) / 255); }
}
