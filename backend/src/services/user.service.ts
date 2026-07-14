import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";
import { toPublicUser } from "../lib/serializers";
import { parsePagination, buildMeta, type PaginationQuery } from "../lib/pagination";
import type { createUserSchema, updateUserSchema, listUsersQuerySchema } from "../validators/user.validators";
import type { z } from "zod";

const SALT_ROUNDS = 10;

type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
  });
  return toPublicUser(user);
}

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

export async function hardDeleteUser(actorId: string, id: string) {
  if (actorId === id) {
    throw new AppError(400, "You cannot permanently delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new AppError(
        409,
        "This user manages a project, created tasks, or has comment/status-change history, so they " +
          "can't be permanently deleted. Reassign or remove that data first, or deactivate the account instead.",
      );
    }
    throw err;
  }
}

export async function listAssignableUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
  return users;
}
