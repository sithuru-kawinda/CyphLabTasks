export type Role = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role?: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  managerId: string;
  manager: UserSummary;
  _count: { tasks: number; members: number };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  addedAt: string;
  user: UserSummary;
}

export interface ProjectDetail extends Omit<Project, "_count"> {
  members: ProjectMember[];
  _count: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee: UserSummary | null;
  creator: UserSummary;
  project?: { id: string; name: string };
}

export interface TaskStatusLogEntry {
  id: string;
  taskId: string;
  oldStatus: TaskStatus | null;
  newStatus: TaskStatus;
  changedById: string;
  changedAt: string;
  changedBy: { id: string; name: string };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
