import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as taskService from "../services/task.service";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  return req.user;
}

export const listForProject = asyncHandler(async (req: Request, res: Response) => {
  const result = await taskService.listTasksForProject(requireUser(req), req.params.projectId, req.query as never);
  res.json(result);
});

export const listMy = asyncHandler(async (req: Request, res: Response) => {
  const result = await taskService.listMyTasks(requireUser(req), req.query as never);
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.createTask(requireUser(req), req.params.projectId, req.body);
  res.status(201).json({ data });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.getTaskById(requireUser(req), req.params.id);
  res.json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.updateTask(requireUser(req), req.params.id, req.body);
  res.json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(requireUser(req), req.params.id);
  res.status(204).send();
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const data = await taskService.getTaskHistory(requireUser(req), req.params.id);
  res.json({ data });
});
