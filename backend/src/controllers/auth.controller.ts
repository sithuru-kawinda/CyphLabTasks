import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { env } from "../config/env";
import { registerUser, loginUser, getCurrentUser } from "../services/auth.service";
import { AppError } from "../lib/AppError";

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours, matches JWT_EXPIRES_IN default

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ data: user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await loginUser(req.body);
  setAuthCookie(res, token);
  res.status(200).json({ data: user });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ data: { success: true } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  const user = await getCurrentUser(req.user.id);
  res.status(200).json({ data: user });
});
