"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function DeleteProjectButton({ projectId, managerId }: { projectId: string; managerId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const canDelete = user?.role === "ADMIN" || (user?.role === "PROJECT_MANAGER" && user.id === managerId);
  if (!canDelete) {
    return null;
  }

  async function handleDelete() {
    if (!confirm("Delete this project? This also deletes its tasks and cannot be undone.")) return;
    setSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete project");
      setSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" disabled={submitting} onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  );
}
