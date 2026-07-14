"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";

export function RemoveMemberButton({ projectId, userId }: { projectId: string; userId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this member from the project?")) return;
    setSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
      toast.success("Member removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" disabled={submitting} onClick={handleRemove} aria-label="Remove member">
      <X className="h-4 w-4" />
    </Button>
  );
}
