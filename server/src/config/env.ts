import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/lucis"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DEFAULT_RADIUS_KM: z.coerce.number().positive().default(10),
  SIMULATION_ENABLED: z.coerce.boolean().default(false),
  AI_PRIMARY_PROVIDER: z.string().default("ollama"),
  AI_FALLBACK_PROVIDERS: z.string().default("groq,openai"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional()
});

export const env = schema.parse(process.env);
export const aiProviders = [env.AI_PRIMARY_PROVIDER, ...env.AI_FALLBACK_PROVIDERS.split(",").map((item) => item.trim()).filter(Boolean)];
