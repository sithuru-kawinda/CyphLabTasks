"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UserSummary } from "@/types";

export function AddMemberDialog({ projectId, existingMemberIds }: { projectId: string; existingMemberIds: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<UserSummary[]>("/users/assignable")
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"));
  }, [open]);

  const availableUsers = users.filter((u) => !existingMemberIds.includes(u.id));
  const selectedUser = availableUsers.find((u) => u.id === selectedUserId);

  async function handleAdd() {
    if (!selectedUserId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUserId }),
      });
      toast.success("Member added");
      setOpen(false);
      setSelectedUserId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
        </DialogHeader>
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger
            render={<Button variant="outline" className="w-full justify-between" />}
          >
            {selectedUser ? selectedUser.name : "Select a user..."}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-(--anchor-width) p-0">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {availableUsers.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.name} ${u.email}`}
                      onSelect={() => {
                        setSelectedUserId(u.id);
                        setComboOpen(false);
                      }}
                    >
                      <Check className={cn("h-4 w-4", u.id === selectedUserId ? "opacity-100" : "opacity-0")} />
                      {u.name} <span className="text-muted-foreground">({u.email})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!selectedUserId || submitting}>
            {submitting ? "Adding..." : "Add to project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
