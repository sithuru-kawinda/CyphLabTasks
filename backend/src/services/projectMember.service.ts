import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { assertProjectAccess, assertManagerOrAdmin } from "./project.service";

type AuthUser = { id: string; role: string };

async function getProjectOrThrow(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError(404, "Project not found");
  }
  return project;
}

export async function listMembers(user: AuthUser, projectId: string) {
  const project = await getProjectOrThrow(projectId);
  await assertProjectAccess(user, project);

  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { addedAt: "asc" },
  });
}

export async function addMember(user: AuthUser, projectId: string, userId: string) {
  const project = await getProjectOrThrow(projectId);
  assertManagerOrAdmin(user, project);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || !targetUser.isActive) {
    throw new AppError(400, "User not found or inactive");
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) {
    throw new AppError(409, "User is already a member of this project");
  }

  return prisma.projectMember.create({
    data: { projectId, userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function removeMember(user: AuthUser, projectId: string, userId: string) {
  const project = await getProjectOrThrow(projectId);
  assertManagerOrAdmin(user, project);

  if (userId === project.managerId) {
    throw new AppError(400, "Cannot remove the project manager from the project");
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
}
