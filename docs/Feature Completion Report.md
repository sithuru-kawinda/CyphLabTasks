# Feature Completion Report

Status as of this submission. "Endpoint" column references `backend/src/routes/*.routes.ts`;
"UI" column references the frontend page/component that consumes it.

## Authentication

| Feature | Endpoint | UI | Status |
|---|---|---|---|
| Register (Team Member self-signup) | `POST /auth/register` | `/register` | ✅ |
| Login (sets `httpOnly` JWT cookie) | `POST /auth/login` | `/login` | ✅ |
| Logout | `POST /auth/logout` | `AuthContext.logout()` | ✅ |
| Current session | `GET /auth/me` | `AuthContext` | ✅ |
| Route protection (redirect to `/login` if unauthenticated) | — | `src/proxy.ts` | ✅ (optimistic; backend re-verifies) |

## Administrator

| Feature | Endpoint | UI | Status |
|---|---|---|---|
| Create a user directly (name/email/password/role in one step) | `POST /users` | `/admin/users` (`CreateUserDialog`) | ✅ |
| List all users | `GET /users` | `/admin/users` | ✅ |
| View a user | `GET /users/:id` | — | ✅ backend only (no single-user detail screen; list view covers the needed fields) |
| Change a user's role | `PATCH /users/:id` | `/admin/users` (`UserRoleActions`) | ✅ |
| Activate / deactivate a user (soft delete) | `PATCH /users/:id` (`isActive`) | `/admin/users` (`UserRoleActions`) | ✅ — deactivation is enforced at login (`auth.service.ts::loginUser`/`getCurrentUser` reject inactive users), not merely cosmetic |
| Permanently delete a user (hard delete) | `DELETE /users/:id/hard` | `/admin/users` (`UserRoleActions`, "Delete") | ✅ — only succeeds if the user has no managed projects, created tasks, or comment/status-change history (all `ON DELETE RESTRICT` at the DB level); otherwise returns a 409 explaining why, telling the admin to reassign the data or deactivate instead. Self-delete is blocked with a 400. |
| Full project/task access (bypasses ownership checks) | all project/task routes | `/projects`, `/tasks` | ✅ |
| Comment on any task | `GET`/`POST /tasks/:id/comments` | `/tasks/[id]` Comments tab | ✅ |
| Manage system settings | — | — | ❌ **Out of scope** — no concrete setting was ever specified (app config, feature flags, etc.); nothing exists to manage, so nothing was built rather than inventing an unused settings screen |

The admin cannot change, deactivate, or permanently delete their own account from this screen (self-row
shows a "You" badge instead of controls) to avoid accidental self-lockout.

## Project Manager

| Feature | Endpoint | UI | Status |
|---|---|---|---|
| Create a project | `POST /projects` | `ProjectFormDialog` (create mode) | ✅ |
| Edit own project | `PATCH /projects/:id` | `ProjectFormDialog` (edit mode) | ✅ |
| Delete own project | `DELETE /projects/:id` | `DeleteProjectButton` | ✅ — Admin or the project's own manager only (`assertManagerOrAdmin`); a PM cannot delete a project they don't manage |
| List/view own + member projects | `GET /projects`, `GET /projects/:id` | `/projects`, `/projects/[id]` | ✅ |
| Add / remove project members | `POST` / `DELETE /projects/:id/members` | `AddMemberDialog`, `RemoveMemberButton` | ✅ |
| Create tasks in own project | `POST /projects/:id/tasks` | `CreateTaskDialog` | ✅ |
| Edit any field of a task in own project | `PATCH /tasks/:id` | `EditTaskDialog` | ✅ |
| Delete a task | `DELETE /tasks/:id` | `TaskDetailActions` | ✅ |
| Assign tasks (assignee must be a project member) | `PATCH /tasks/:id` | `EditTaskDialog`, `CreateTaskDialog` | ✅ |
| Comment on tasks in own project | `POST /tasks/:id/comments` | `CommentForm` (task detail, Comments tab) | ✅ |

## Team Member

| Feature | Endpoint | UI | Status |
|---|---|---|---|
| View projects they're a member of | `GET /projects` | `/projects` | ✅ |
| View assigned tasks | `GET /tasks/my` | `/tasks` | ✅ |
| View a task's detail + status history | `GET /tasks/:id`, `GET /tasks/:id/history` | `/tasks/[id]` | ✅ |
| Update status of their own assigned task | `PATCH /tasks/:id` (status-only, enforced server-side) | `TaskStatusControl` | ✅ |
| Comment on tasks in a project they're a member of | `GET`/`POST /tasks/:id/comments` | `/tasks/[id]` Comments tab | ✅ — any project member can comment, not just the task's assignee |

## Cross-cutting

| Feature | Status |
|---|---|
| Role-based dashboard summary | ✅ (backend `GET /dashboard/summary`, UI at `/dashboard`, scoped per role) |
| Team Member can change task status directly from the dashboard | ✅ (`/dashboard` "My tasks" table, reuses `TaskStatusControl` — no need to open `/tasks/[id]` first) |
| Task status audit trail (`TaskStatusLog`, append-only, written transactionally) | ✅ |
| Zod validation on every mutating endpoint | ✅ |
| Pagination on list endpoints (`page`, `pageSize`, `total`) | ✅ |
| Responsive UI (Tailwind, shadcn/ui) | ✅ — verified at mobile/tablet/desktop breakpoints |
| CI (lint, typecheck, build for both packages) | ✅ — `.github/workflows/ci.yml` |
| Automated tests (unit/integration) | ❌ not implemented — no test runner configured in either package |
| Live deployment | ❌ not deployed for this submission |

## Known gaps / next steps

1. No automated test suite — verification for this submission was done via manual end-to-end
   smoke-testing of every role against the running dev servers (see `docs/CI_CD.md` for what CI
   actually checks vs. what was manually verified).
2. No live deployment link — hosting accounts were not set up in time for this submission.
3. No "manage system settings" screen — deliberately out of scope, see the Administrator table above.
