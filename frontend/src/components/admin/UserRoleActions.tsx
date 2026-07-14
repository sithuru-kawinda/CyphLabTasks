"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Role, User } from "@/types";

const ROLE_OPTIONS: Role[] = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"];
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_MEMBER: "Team Member",
};

export function UserRoleActions({ targetUser }: { targetUser: User }) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const isSelf = currentUser?.id === targetUser.id;

  async function updateUser(body: Partial<Pick<User, "role" | "isActive">>) {
    setUpdating(true);
    try {
      await apiFetch(`/users/${targetUser.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success("User updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setUpdating(false);
    }
  }

  async function handleHardDelete() {
    if (
      !confirm(
        `Permanently delete ${targetUser.name}? This cannot be undone. Only works if they have no ` +
          `managed projects, created tasks, or comment/status history — otherwise deactivate instead.`,
      )
    ) {
      return;
    }
    setUpdating(true);
    try {
      await apiFetch(`/users/${targetUser.id}/hard`, { method: "DELETE" });
      toast.success("User permanently deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete user");
    } finally {
      setUpdating(false);
    }
  }

  if (isSelf) {
    return <Badge variant="secondary">You</Badge>;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={targetUser.role}
        onValueChange={(value) => value && updateUser({ role: value as Role })}
        disabled={updating}
      >
        <SelectTrigger className="w-40" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABEL[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled={updating}
        onClick={() => updateUser({ isActive: !targetUser.isActive })}
      >
        {targetUser.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button variant="destructive" size="sm" disabled={updating} onClick={handleHardDelete}>
        Delete
      </Button>
    </div>
  );
}
