import { api } from "@/services/api.client";
import type {
  AiChatRequest,
  AiChatResponse,
  AiContextResponse,
  AiProviderInfo,
  Coordinates,
} from "@/types/api";

export const aiService = {
  /** Structured situational context assembled server-side for a location. */
  context: (location: Coordinates, radiusKm?: number) =>
    api.post<AiContextResponse>("/api/ai/context", { location, radiusKm }),

  /**
   * Sends a message plus optional location context to the configured provider
   * chain. `content` is plain prose, not JSON — parse defensively.
   */
  chat: (body: AiChatRequest) => api.post<AiChatResponse>("/api/ai/chat", body),

  /** Providers in fallback order, as configured by the server's env. */
  providers: () => api.get<AiProviderInfo[]>("/api/ai/providers"),
};
