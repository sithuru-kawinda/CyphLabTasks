import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/AppError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Route not found" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
