import { providerManager } from "./provider.manager.js";
import type { AiMessage } from "./provider.js";

export const generateResponse = (messages: AiMessage[]) => providerManager.chat(messages);
