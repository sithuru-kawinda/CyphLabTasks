import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../lib/AppError";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }

    next();
  };
}
