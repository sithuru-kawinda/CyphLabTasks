import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, TaskStatus, TaskPriority } from "@/types";

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

const TASK_STATUS_VARIANT: Record<TaskStatus, "secondary" | "default" | "destructive"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  IN_REVIEW: "default",
  DONE: "secondary",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={TASK_STATUS_VARIANT[status]}>{TASK_STATUS_LABEL[status]}</Badge>;
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const PRIORITY_VARIANT: Record<TaskPriority, "secondary" | "default" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
  URGENT: "destructive",
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

const PROJECT_STATUS_VARIANT: Record<ProjectStatus, "secondary" | "default" | "destructive"> = {
  PLANNED: "secondary",
  ACTIVE: "default",
  ON_HOLD: "destructive",
  COMPLETED: "secondary",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={PROJECT_STATUS_VARIANT[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>;
}
