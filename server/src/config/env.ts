import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/lucis"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DEFAULT_RADIUS_KM: z.coerce.number().positive().default(10),
  SIMULATION_ENABLED: z.coerce.boolean().default(false),
  AI_PRIMARY_PROVIDER: z.string().default("groq"),
  AI_FALLBACK_PROVIDERS: z.string().default("openai,gemini"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default("2024-10-21"),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT: z.string().optional()
});

export const env = schema.parse(process.env);
export const aiProviders = [env.AI_PRIMARY_PROVIDER, ...env.AI_FALLBACK_PROVIDERS.split(",").map((item) => item.trim()).filter(Boolean)];
