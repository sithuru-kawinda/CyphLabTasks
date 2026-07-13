import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { toPublicUser } from "../lib/serializers";
import { parsePagination, buildMeta, type PaginationQuery } from "../lib/pagination";
import type { updateUserSchema, listUsersQuerySchema } from "../validators/user.validators";
import type { z } from "zod";

type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function listUsers(query: ListUsersQuery & PaginationQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { email: { contains: query.search } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);

  return { data: users.map(toPublicUser), meta: buildMeta(page, pageSize, total) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return toPublicUser(user);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updated = await prisma.user.update({ where: { id }, data: input });
  return toPublicUser(updated);
}

export async function deactivateUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updated = await prisma.user.update({ where: { id }, data: { isActive: false } });
  return toPublicUser(updated);
}

export async function listAssignableUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
  return users;
}
