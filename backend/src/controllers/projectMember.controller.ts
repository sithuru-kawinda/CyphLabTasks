import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as projectMemberService from "../services/projectMember.service";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  return req.user;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await projectMemberService.listMembers(requireUser(req), req.params.projectId);
  res.json({ data });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const data = await projectMemberService.addMember(requireUser(req), req.params.projectId, req.body.userId);
  res.status(201).json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectMemberService.removeMember(requireUser(req), req.params.projectId, req.params.userId);
  res.status(204).send();
});
