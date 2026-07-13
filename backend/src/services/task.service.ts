import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { assertProjectAccess, assertManagerOrAdmin } from "./project.service";
import { parsePagination, buildMeta, type PaginationQuery } from "../lib/pagination";
import type { z } from "zod";
import type { createTaskSchema, updateTaskSchema, listTasksQuerySchema } from "../validators/task.validators";

type AuthUser = { id: string; role: string };
type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
};

async function getProjectOrThrow(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError(404, "Project not found");
  }
  return project;
}

async function getTaskWithProjectOrThrow(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) {
    throw new AppError(404, "Task not found");
  }
  return task;
}

async function assertAssigneeIsProjectMember(projectId: string, assigneeId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  if (!membership) {
    throw new AppError(400, "assigneeId must be a member of this project");
  }
}

export async function listTasksForProject(user: AuthUser, projectId: string, query: ListTasksQuery & PaginationQuery) {
  const project = await getProjectOrThrow(projectId);
  await assertProjectAccess(user, project);

  const { skip, take, page, pageSize } = parsePagination(query);
  const where: Prisma.TaskWhereInput = {
    projectId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: TASK_INCLUDE }),
    prisma.task.count({ where }),
  ]);

  return { data: tasks, meta: buildMeta(page, pageSize, total) };
}

export async function listMyTasks(user: AuthUser, query: ListTasksQuery & PaginationQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);
  const where: Prisma.TaskWhereInput = {
    assigneeId: user.id,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { ...TASK_INCLUDE, project: { select: { id: true, name: true } } },
    }),
    prisma.task.count({ where }),
  ]);

  return { data: tasks, meta: buildMeta(page, pageSize, total) };
}

export async function getTaskById(user: AuthUser, taskId: string) {
  const task = await getTaskWithProjectOrThrow(taskId);
  await assertProjectAccess(user, task.project);

  return prisma.task.findUnique({ where: { id: taskId }, include: TASK_INCLUDE });
}

export async function createTask(user: AuthUser, projectId: string, input: CreateTaskInput) {
  const project = await getProjectOrThrow(projectId);
  assertManagerOrAdmin(user, project);

  if (input.assigneeId) {
    await assertAssigneeIsProjectMember(projectId, input.assigneeId);
  }

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      projectId,
      creatorId: user.id,
    },
    include: TASK_INCLUDE,
  });
}

export async function updateTask(user: AuthUser, taskId: string, input: UpdateTaskInput) {
  const task = await getTaskWithProjectOrThrow(taskId);

  const isOwnAssignedTeamMember = user.role === "TEAM_MEMBER" && task.assigneeId === user.id;

  if (user.role === "TEAM_MEMBER") {
    if (!isOwnAssignedTeamMember) {
      throw new AppError(403, "You can only update tasks assigned to you");
    }
    const allowedKeys = Object.keys(input).filter((key) => key !== "status");
    if (allowedKeys.length > 0) {
      throw new AppError(403, "Team members may only update a task's status");
    }
  } else {
    assertManagerOrAdmin(user, task.project);
    if (input.assigneeId) {
      await assertAssigneeIsProjectMember(task.projectId, input.assigneeId);
    }
  }

  const statusChanged = input.status !== undefined && input.status !== task.status;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.task.update({ where: { id: taskId }, data: input, include: TASK_INCLUDE });

    if (statusChanged) {
      await tx.taskStatusLog.create({
        data: {
          taskId,
          oldStatus: task.status,
          newStatus: result.status,
          changedById: user.id,
        },
      });
    }

    return result;
  });

  return updated;
}

export async function deleteTask(user: AuthUser, taskId: string) {
  const task = await getTaskWithProjectOrThrow(taskId);
  assertManagerOrAdmin(user, task.project);
  await prisma.task.delete({ where: { id: taskId } });
}

export async function getTaskHistory(user: AuthUser, taskId: string) {
  const task = await getTaskWithProjectOrThrow(taskId);
  await assertProjectAccess(user, task.project);

  return prisma.taskStatusLog.findMany({
    where: { taskId },
    include: { changedBy: { select: { id: true, name: true } } },
    orderBy: { changedAt: "desc" },
  });
}
