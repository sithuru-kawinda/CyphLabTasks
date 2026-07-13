import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as userService from "../services/user.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req.query as never);
  res.json(result);
});

export const listAssignable = asyncHandler(async (_req: Request, res: Response) => {
  const data = await userService.listAssignableUsers();
  res.json({ data });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.getUserById(req.params.id);
  res.json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.updateUser(req.params.id, req.body);
  res.json({ data });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.deactivateUser(req.params.id);
  res.json({ data });
});
