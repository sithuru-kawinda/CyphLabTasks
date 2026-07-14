"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await refresh();
      toast.success("Account created!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
        <CardDescription>New accounts start as Team Members. An Admin can change your role.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
