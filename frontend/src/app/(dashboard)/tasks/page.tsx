import Link from "next/link";
import { serverApiFetch } from "@/lib/api";
import type { Task } from "@/types";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/shared/StatusBadges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";

export default async function MyTasksPage() {
  const tasks = await serverApiFetch<Task[]>("/tasks/my?pageSize=50");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">My Tasks</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.project?.name}</TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No tasks assigned to you yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
