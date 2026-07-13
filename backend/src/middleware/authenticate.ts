import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";
import { AppError } from "../lib/AppError";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError(401, "Not authenticated");
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError(401, "Invalid or expired session");
  }
}
