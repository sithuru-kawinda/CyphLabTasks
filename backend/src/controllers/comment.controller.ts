import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as commentService from "../services/comment.service";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  return req.user;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await commentService.listComments(requireUser(req), req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await commentService.createComment(requireUser(req), req.params.id, req.body);
  res.status(201).json({ data });
});
