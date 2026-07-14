import Link from "next/link";
import { serverApiFetch } from "@/lib/api";
import type { ProjectDetail, Task } from "@/types";
import { ProjectStatusBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/shared/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { AddMemberDialog } from "@/components/projects/AddMemberDialog";
import { RemoveMemberButton } from "@/components/projects/RemoveMemberButton";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const [project, tasks] = await Promise.all([
    serverApiFetch<ProjectDetail>(`/projects/${projectId}`),
    serverApiFetch<Task[]>(`/projects/${projectId}/tasks?pageSize=50`),
  ]);
  const members = project.members.map((m) => m.user);
  const existingMemberIds = members.map((m) => m.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectFormDialog mode="edit" project={project} />
          <DeleteProjectButton projectId={project.id} managerId={project.managerId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectStatusBadge status={project.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Manager</CardTitle>
          </CardHeader>
          <CardContent>{project.manager.name}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Last updated</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(project.updatedAt)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team members</CardTitle>
          <AddMemberDialog projectId={project.id} existingMemberIds={existingMemberIds} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {project.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="text-sm font-medium">{member.user.name}</div>
                <div className="text-xs text-muted-foreground">{member.user.email}</div>
              </div>
              {member.userId !== project.managerId && (
                <RemoveMemberButton projectId={project.id} userId={member.userId} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <CreateTaskDialog projectId={project.id} members={members} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
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
                  <TableCell>
                    <TaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>
                    <TaskPriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No tasks yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
