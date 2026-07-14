"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api";
import type { TaskStatus } from "@/types";

const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export function TaskStatusControl({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(value: string | null) {
    if (!value) return;
    setUpdating(true);
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      toast.success("Status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={updating}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {STATUS_LABEL[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
