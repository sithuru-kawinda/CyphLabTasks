import { prisma } from "../lib/prisma";

type AuthUser = { id: string; role: string };

function formatStatusCounts(rows: { status: string; _count: { _all: number } }[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});
}

export async function getSummary(user: AuthUser) {
  if (user.role === "ADMIN") {
    const [userCount, projectCount, taskCount, tasksByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return {
      scope: "ADMIN" as const,
      userCount,
      projectCount,
      taskCount,
      tasksByStatus: formatStatusCounts(tasksByStatus),
    };
  }

  if (user.role === "PROJECT_MANAGER") {
    const projectWhere = { OR: [{ managerId: user.id }, { members: { some: { userId: user.id } } }] };

    const [projectCount, taskCount, tasksByStatus] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.task.count({ where: { project: projectWhere } }),
      prisma.task.groupBy({ by: ["status"], where: { project: projectWhere }, _count: { _all: true } }),
    ]);

    return {
      scope: "PROJECT_MANAGER" as const,
      projectCount,
      taskCount,
      tasksByStatus: formatStatusCounts(tasksByStatus),
    };
  }

  const [taskCount, tasksByStatus, overdueCount] = await Promise.all([
    prisma.task.count({ where: { assigneeId: user.id } }),
    prisma.task.groupBy({ by: ["status"], where: { assigneeId: user.id }, _count: { _all: true } }),
    prisma.task.count({ where: { assigneeId: user.id, dueDate: { lt: new Date() }, status: { not: "DONE" } } }),
  ]);

  return {
    scope: "TEAM_MEMBER" as const,
    taskCount,
    tasksByStatus: formatStatusCounts(tasksByStatus),
    overdueCount,
  };
}
