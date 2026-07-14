"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectStatus } from "@/types";
import { Plus } from "lucide-react";

const STATUS_OPTIONS: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED"];

interface EditableProject {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
}

interface ProjectFormDialogProps {
  mode: "create" | "edit";
  project?: EditableProject;
}

export function ProjectFormDialog({ mode, project }: ProjectFormDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "PLANNED");
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.role === "TEAM_MEMBER") {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "create") {
        await apiFetch("/projects", {
          method: "POST",
          body: JSON.stringify({ name, description, status }),
        });
        toast.success("Project created");
      } else if (project) {
        await apiFetch(`/projects/${project.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description, status }),
        });
        toast.success("Project updated");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={mode === "create" ? "default" : "outline"} />}>
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </>
        ) : (
          "Edit project"
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create project" : "Edit project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger id="project-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
