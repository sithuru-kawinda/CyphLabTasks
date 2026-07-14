"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TaskStatusBadge } from "@/components/shared/StatusBadges";
import { TaskStatusControl } from "@/components/tasks/TaskStatusControl";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import type { Task, UserSummary } from "@/types";

export function TaskDetailActions({
  task,
  projectManagerId,
  members,
}: {
  task: Task;
  projectManagerId: string;
  members: UserSummary[];
}) {
  const { user } = useAuth();
  if (!user) return null;

  const canManage = user.role === "ADMIN" || (user.role === "PROJECT_MANAGER" && user.id === projectManagerId);
  const canUpdateStatus = canManage || (user.role === "TEAM_MEMBER" && user.id === task.assigneeId);

  return (
    <div className="flex items-center gap-3">
      {canUpdateStatus ? (
        <TaskStatusControl taskId={task.id} status={task.status} />
      ) : (
        <TaskStatusBadge status={task.status} />
      )}
      {canManage && <EditTaskDialog task={task} members={members} />}
    </div>
  );
}
