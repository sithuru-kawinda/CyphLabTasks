import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { assertProjectAccess } from "./project.service";
import type { z } from "zod";
import type { createCommentSchema } from "../validators/comment.validators";

type AuthUser = { id: string; role: string };
type CreateCommentInput = z.infer<typeof createCommentSchema>;

const AUTHOR_SELECT = { author: { select: { id: true, name: true, email: true } } };

async function getTaskWithProjectOrThrow(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  return task;
}

export async function listComments(user: AuthUser, taskId: string) {
  const task = await getTaskWithProjectOrThrow(taskId);
  await assertProjectAccess(user, task.project);

  return prisma.taskComment.findMany({
    where: { taskId },
    include: AUTHOR_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(user: AuthUser, taskId: string, input: CreateCommentInput) {
  const task = await getTaskWithProjectOrThrow(taskId);
  await assertProjectAccess(user, task.project);

  return prisma.taskComment.create({
    data: { taskId, authorId: user.id, body: input.body },
    include: AUTHOR_SELECT,
  });
}
