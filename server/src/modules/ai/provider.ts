export interface AiMessage { role: "system" | "user" | "assistant"; content: string; }
export interface AiProvider { readonly name: string; initialize(): Promise<void>; isConfigured(): boolean; chat(messages: AiMessage[]): Promise<string>; stream(messages: AiMessage[], onToken: (token: string) => void): Promise<void>; health(): Promise<boolean>; embeddings(input: string): Promise<number[]>; }

export abstract class LocalProvider implements AiProvider {
  abstract readonly name: string;
  async initialize(): Promise<void> { return Promise.resolve(); }
  isConfigured(): boolean { return false; }
  async chat(_messages: AiMessage[]): Promise<string> { throw new Error(`${this.name} provider is not implemented`); }
  async stream(_messages: AiMessage[], _onToken: (token: string) => void): Promise<void> { throw new Error(`${this.name} provider is not implemented`); }
  async health(): Promise<boolean> { return false; }
  async embeddings(_input: string): Promise<number[]> { throw new Error(`${this.name} embeddings are not implemented`); }
}
