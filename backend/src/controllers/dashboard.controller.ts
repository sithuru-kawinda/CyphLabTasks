import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as dashboardService from "../services/dashboard.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  const data = await dashboardService.getSummary(req.user);
  res.json({ data });
});
