import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { parsePagination, buildMeta, type PaginationQuery } from "../lib/pagination";
import type { z } from "zod";
import type { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from "../validators/project.validators";

type AuthUser = { id: string; role: string };
type CreateProjectInput = z.infer<typeof createProjectSchema>;
type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

const MEMBER_SELECT = {
  manager: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true, members: true } },
};

function scopeWhere(user: AuthUser): Prisma.ProjectWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PROJECT_MANAGER") {
    return { OR: [{ managerId: user.id }, { members: { some: { userId: user.id } } }] };
  }
  return { members: { some: { userId: user.id } } };
}

export async function assertProjectAccess(user: AuthUser, project: { id: string; managerId: string }) {
  if (user.role === "ADMIN" || project.managerId === user.id) return;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });

  if (!membership) {
    throw new AppError(403, "You do not have access to this project");
  }
}

export function assertManagerOrAdmin(user: AuthUser, project: { managerId: string }) {
  if (user.role === "ADMIN") return;
  if (user.role === "PROJECT_MANAGER" && project.managerId === user.id) return;
  throw new AppError(403, "You do not have permission to modify this project");
}

export async function listProjects(user: AuthUser, query: ListProjectsQuery & PaginationQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.ProjectWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { name: { contains: query.search } } : {}),
    ...scopeWhere(user),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: MEMBER_SELECT }),
    prisma.project.count({ where }),
  ]);

  return { data: projects, meta: buildMeta(page, pageSize, total) };
}

export async function getProjectById(user: AuthUser, id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  await assertProjectAccess(user, project);
  return project;
}

export async function createProject(user: AuthUser, input: CreateProjectInput) {
  let managerId: string;

  if (user.role === "ADMIN") {
    if (!input.managerId) {
      throw new AppError(400, "managerId is required when an Admin creates a project");
    }
    const manager = await prisma.user.findUnique({ where: { id: input.managerId } });
    if (!manager || manager.role !== "PROJECT_MANAGER") {
      throw new AppError(400, "managerId must reference a Project Manager");
    }
    managerId = input.managerId;
  } else {
    managerId = user.id;
  }

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      managerId,
      members: { create: [{ userId: managerId }] },
    },
    include: MEMBER_SELECT,
  });
}

export async function updateProject(user: AuthUser, id: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new AppError(404, "Project not found");
  }

  assertManagerOrAdmin(user, project);

  return prisma.project.update({ where: { id }, data: input, include: MEMBER_SELECT });
}

export async function deleteProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new AppError(404, "Project not found");
  }
  await prisma.project.delete({ where: { id } });
}
