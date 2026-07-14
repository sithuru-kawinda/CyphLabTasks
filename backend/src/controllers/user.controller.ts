import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as userService from "../services/user.service";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  return req.user;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.createUser(req.body);
  res.status(201).json({ data });
});

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

export const hardDelete = asyncHandler(async (req: Request, res: Response) => {
  await userService.hardDeleteUser(requireUser(req).id, req.params.id);
  res.status(204).send();
});
