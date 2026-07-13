import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/AppError";
import * as projectService from "../services/project.service";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }
  return req.user;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.listProjects(requireUser(req), req.query as never);
  res.json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await projectService.getProjectById(requireUser(req), req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await projectService.createProject(requireUser(req), req.body);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await projectService.updateProject(requireUser(req), req.params.id, req.body);
  res.json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
});
