import Link from "next/link";
import { serverApiFetch } from "@/lib/api";
import type { ProjectDetail, Task, TaskStatusLogEntry } from "@/types";
import { TaskPriorityBadge } from "@/components/shared/StatusBadges";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dates";
import { TaskDetailActions } from "@/components/tasks/TaskDetailActions";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;

  const task = await serverApiFetch<Task>(`/tasks/${taskId}`);
  const [project, history] = await Promise.all([
    serverApiFetch<ProjectDetail>(`/projects/${task.projectId}`),
    serverApiFetch<TaskStatusLogEntry[]>(`/tasks/${taskId}/history`),
  ]);

  const members = project.members.map((m) => m.user);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/projects/${project.id}`} className="text-sm text-muted-foreground hover:underline">
            {project.name}
          </Link>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
        </div>
        <TaskDetailActions task={task} projectManagerId={project.managerId} members={members} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm whitespace-pre-wrap">{task.description || "No description provided."}</p>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Priority</div>
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <div>
                  <div className="text-muted-foreground">Assignee</div>
                  <div>{task.assignee?.name ?? "Unassigned"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Due date</div>
                  <div>{formatDate(task.dueDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created by</div>
                  <div>{task.creator.name}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              {history.length === 0 && <p className="text-sm text-muted-foreground">No status changes yet.</p>}
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0">
                  <span>
                    <span className="font-medium">{entry.changedBy.name}</span>{" "}
                    {entry.oldStatus ? `moved from ${entry.oldStatus} to ${entry.newStatus}` : `set status to ${entry.newStatus}`}
                  </span>
                  <span className="text-muted-foreground">{formatDate(entry.changedAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
