import Link from "next/link";
import { serverApiFetch } from "@/lib/api";
import type { Project } from "@/types";
import { ProjectStatusBadge } from "@/components/shared/StatusBadges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";

export default async function ProjectsPage() {
  const projects = await serverApiFetch<Project[]>("/projects?pageSize=50");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <ProjectFormDialog mode="create" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <ProjectStatusBadge status={project.status} />
                </TableCell>
                <TableCell>{project.manager.name}</TableCell>
                <TableCell>{project._count.tasks}</TableCell>
                <TableCell>{project._count.members}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(project.updatedAt)}</TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
