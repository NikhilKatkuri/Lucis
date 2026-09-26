import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export const validate = (schema: AnyZodObject) => (request: Request, response: Response, next: NextFunction): void => {
  const result = schema.safeParse({ body: request.body, query: request.query, params: request.params });
  if (!result.success) {
    response.status(400).json({ error: "Validation failed", details: result.error.flatten() });
    return;
  }
  request.body = result.data.body;
  request.query = result.data.query as Request["query"];
  next();
};
