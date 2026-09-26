import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let connected = false;

export async function connectDatabase(): Promise<boolean> {
  if (connected || mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2_000 });
    connected = true;
    logger.info({ uri: env.MONGODB_URI }, "MongoDB connected");
    return true;
  } catch (error) {
    logger.warn({ err: error }, "MongoDB unavailable; continuing with in-memory runtime store");
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  connected = false;
}

export const isDatabaseConnected = (): boolean => connected;
