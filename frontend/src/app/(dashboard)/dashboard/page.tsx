import Link from "next/link";
import { serverApiFetch } from "@/lib/api";
import type { DashboardSummary, Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/shared/StatusBadges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskStatusControl } from "@/components/tasks/TaskStatusControl";
import { formatDate } from "@/lib/dates";
import type { TaskStatus } from "@/types";

const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default async function DashboardPage() {
  const summary = await serverApiFetch<DashboardSummary>("/dashboard/summary");
  const myTasks = summary.scope === "TEAM_MEMBER" ? await serverApiFetch<Task[]>("/tasks/my?pageSize=20") : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.scope === "ADMIN" && (
          <>
            <StatCard label="Users" value={summary.userCount} />
            <StatCard label="Projects" value={summary.projectCount} />
            <StatCard label="Tasks" value={summary.taskCount} />
          </>
        )}
        {summary.scope === "PROJECT_MANAGER" && (
          <>
            <StatCard label="Projects" value={summary.projectCount} />
            <StatCard label="Tasks" value={summary.taskCount} />
          </>
        )}
        {summary.scope === "TEAM_MEMBER" && (
          <>
            <StatCard label="My tasks" value={summary.taskCount} />
            <StatCard label="Overdue" value={summary.overdueCount} />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks by status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <TaskStatusBadge status={status} />
              <span className="text-sm text-muted-foreground">{summary.tasksByStatus[status] ?? 0}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {myTasks && (
        <Card>
          <CardHeader>
            <CardTitle>My tasks</CardTitle>
            <CardDescription>Update the status of any task assigned to you right here.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{task.project?.name}</TableCell>
                    <TableCell>
                      <TaskPriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
                    <TableCell>
                      <TaskStatusControl taskId={task.id} status={task.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {myTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No tasks assigned to you yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
