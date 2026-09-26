import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./database/connection.js";
import { env } from "./config/env.js";
import { createLiveGateway } from "./socket/gateway.js";
import { logger } from "./utils/logger.js";
import { startWorkers } from "./workers/index.js";

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" }, transports: ["websocket", "polling"], pingInterval: 25_000, pingTimeout: 20_000 });
createLiveGateway(io);

await connectDatabase();
startWorkers(io);
httpServer.listen(env.PORT, () => logger.info({ port: env.PORT, namespace: "/live" }, "Lucis backend listening"));

const shutdown = async (signal: string) => { logger.info({ signal }, "Shutting down"); await new Promise<void>((resolve) => httpServer.close(() => resolve())); process.exit(0); };
process.on("SIGINT", () => void shutdown("SIGINT")); process.on("SIGTERM", () => void shutdown("SIGTERM"));
