import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../utils/logger.js";

export const notFound: RequestHandler = (request, response) => response.status(404).json({ error: "Route not found", path: request.path });
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  logger.error({ err: error }, "Unhandled request error");
  response.status(500).json({ error: "Internal server error" });
};
