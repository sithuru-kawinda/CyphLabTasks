# API Documentation

REST API for the CyphLab project/task management platform. Generated from the actual route,
validator, and service files in `backend/src/` — every endpoint, auth requirement, and error case
below is verifiable in code, not aspirational. See also `docs/Postman Collection.json` for an
importable version of the same API.

## Base URL

```
http://localhost:4000/api/v1
```

(`http://localhost:4000/health` — outside the `/api/v1` prefix — is a plain liveness check:
`{"data":{"status":"ok"}}`, no auth required.)

## Authentication

Cookie-based JWT. `POST /auth/login` and `POST /auth/register` set an `httpOnly` cookie named `token`
(signed with `{ sub: userId, role }`, 8 hour expiry, no refresh flow). Every subsequent request must
send that cookie:

- **Browser clients**: automatic if you're on the same site with `credentials: "include"`.
- **curl**: `-c cookies.txt` on login, `-b cookies.txt` on later requests.
- **Postman**: import the collection, run **Auth → Login** first — Postman's cookie jar handles the
  rest for that collection run.

Endpoints marked **Auth: required** return `401 { "error": { "message": "Not authenticated" } }`
without a valid cookie. Endpoints with a **Role** requirement return
`403 { "error": { "message": "You do not have permission to perform this action" } }` for the wrong
role — this is enforced by the `authorize(...roles)` middleware at the route level. Several endpoints
have a *second*, finer-grained authorization layer inside the service (ownership/membership checks)
that can also return a 403 with a more specific message even when the role check passes — those are
called out per-endpoint below.

## Response envelope

Every response is JSON with one shape:

| Case | Shape |
|---|---|
| Success | `{ "data": ... }` |
| Success, paginated list | `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 57 } }` |
| Error | `{ "error": { "message": "..." } }` |

There is no top-level `success` flag — check the HTTP status code and the presence of `data` vs `error`.

## Pagination

List endpoints accept `page` (default `1`) and `pageSize` (default `20`, max `100`) query params and
return the `meta` block above. Requesting `pageSize=500` silently clamps to `100`, it does not error.

## Enums

| Enum | Values |
|---|---|
| `Role` | `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER` |
| `ProjectStatus` | `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED` |
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |

## Validation errors

Every request body is validated with Zod before it reaches a service. A failing field returns `400`
with the first validation message, e.g. `{ "error": { "message": "Name must be at least 2 characters" } }`.

---

## Auth

### `POST /auth/register`
Self-registration. Always creates a `TEAM_MEMBER` — there is no way to self-register as PM/Admin (use
`POST /users` as an Admin instead). Sets the session cookie on success.

**Auth**: none · **Role**: none

Body:
```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "at least 8 chars" }
```
`201` → public user object (see [User shape](#user-shape)). `409` if the email is already registered.

### `POST /auth/login`
Body: `{ "email": "...", "password": "..." }`. `200` → public user object, sets the session cookie.
`401 "Invalid email or password"` for a wrong password **or** a deactivated (`isActive: false`) account
— the message is deliberately identical for both, so login can't be used to enumerate which accounts
exist or are disabled.

**Auth**: none · **Role**: none

### `POST /auth/logout`
Clears the session cookie. `200` → `{ "data": null }`. **Auth**: none (safe to call even if already
logged out).

### `GET /auth/me`
Returns the current user (rejects with `401` if the account has since been deactivated, even with a
still-valid JWT). **Auth**: required.

---

## Users <small>(all Admin-only except one)</small>

<a id="user-shape"></a>**User shape**: `{ id, name, email, role, isActive, createdAt }` — never includes `passwordHash`.

### `GET /users/assignable`
Lists active users (any role) for populating "assign to" pickers when adding project members or task
assignees. Returns `{ id, name, email, role }[]`, not paginated.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `GET /users`
Paginated list of all users. Query: `role` (filter), `search` (matches name or email, substring),
`page`, `pageSize`.

**Auth**: required · **Role**: `ADMIN`

### `POST /users`
Admin creates a user directly — no self-registration round-trip needed.

Body: `{ "name": "...", "email": "...", "password": "...", "role": "PROJECT_MANAGER" }` (`role` optional,
defaults to `TEAM_MEMBER`). `201` → user shape. `409` on duplicate email.

**Auth**: required · **Role**: `ADMIN`

### `GET /users/:id`
Single user by id. `404` if not found.

**Auth**: required · **Role**: `ADMIN`

### `PATCH /users/:id`
Body: any of `{ "name", "role", "isActive" }`. Used for both role changes and activate/deactivate.
Deactivation (`isActive: false`) takes effect immediately for *new* requests — it's checked in
`GET /auth/me` — but an already-issued JWT keeps working until it expires or the user logs out,
because role/active-state isn't re-checked on every single request, only re-derived at login/`/me`.

**Auth**: required · **Role**: `ADMIN`

### `DELETE /users/:id`
**Soft** delete — sets `isActive: false`. This is the one that actually blocks login (see
`POST /auth/login` above), unlike a raw `PATCH`. `204` no body.

**Auth**: required · **Role**: `ADMIN`

### `DELETE /users/:id/hard`
**Permanent** delete. Two guards beyond the role check:
- `400 "You cannot permanently delete your own account"` — self-delete is always blocked.
- `409` if the user manages a project, created any task, changed any task's status, or authored any
  comment — those foreign keys are `ON DELETE RESTRICT` at the database level, so the delete would
  otherwise fail with an opaque DB error; this is translated into a clear message telling you to
  reassign the data or use the soft-delete endpoint instead.

**Auth**: required · **Role**: `ADMIN`

---

## Projects

**Project shape** (list): `{ id, name, description, status, startDate, endDate, createdAt, updatedAt, managerId, manager: {id,name,email}, _count: {tasks, members} }`

**ProjectDetail shape** (single): same as above minus `_count.members`, plus `members: [{ id, projectId, userId, addedAt, user: {id,name,email,role} }]` and `_count: {tasks}`.

### `GET /projects`
Query: `status`, `search` (name, substring), `page`, `pageSize`. The result set is **scoped
server-side by role**, not by a different endpoint per role:
- `ADMIN` — every project.
- `PROJECT_MANAGER` — projects they manage **or** are a member of.
- `TEAM_MEMBER` — projects they're a member of.

**Auth**: required · **Role**: none (all three roles call this same endpoint)

### `POST /projects`
Body: `{ "name", "description"?, "status"?, "startDate"?, "endDate"?, "managerId"? }`. A
`PROJECT_MANAGER` creating a project becomes its manager automatically (`managerId` is ignored for
them). An `ADMIN` **must** pass `managerId`, and it must reference an existing user whose role is
`PROJECT_MANAGER` (`400` otherwise).

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `GET /projects/:id`
Returns ProjectDetail. `404` if the project doesn't exist. `403 "You do not have access to this
project"` if it exists but the caller is neither Admin, its manager, nor a member
(`assertProjectAccess`).

**Auth**: required · **Role**: none at the route (access is service-scoped, see above)

### `PATCH /projects/:id`
Body: any of `{ "name", "description", "status", "startDate", "endDate" }`. `403 "You do not have
permission to modify this project"` unless the caller is Admin or **that specific project's** manager
(`assertManagerOrAdmin`) — being a member is not enough.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `DELETE /projects/:id`
Same `assertManagerOrAdmin` rule as `PATCH` — Admin or the project's own manager only. Cascades to the
project's tasks, memberships, and (via tasks) their status logs and comments. `204` no body.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

---

## Project Members

### `GET /projects/:projectId/members`
List of `{ id, projectId, userId, addedAt, user: {id,name,email,role} }`, ordered by `addedAt`. Same
`assertProjectAccess` rule as reading the project itself.

**Auth**: required · **Role**: none at the route

### `POST /projects/:projectId/members`
Body: `{ "userId": "..." }`. `400` if the user doesn't exist or is deactivated. `409 "User is already a
member of this project"` on a duplicate. `403` (`assertManagerOrAdmin`) unless Admin or that project's
manager.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `DELETE /projects/:projectId/members/:userId`
`400 "Cannot remove the project manager from the project"` if `:userId` is the project's manager.
Same `assertManagerOrAdmin` rule otherwise. `204` no body.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

---

## Tasks

**Task shape**: `{ id, title, description, status, priority, dueDate, createdAt, updatedAt, projectId, assigneeId, creatorId, assignee: {id,name,email} | null, creator: {id,name,email}, project?: {id,name} }`
(`project` is only populated on `GET /tasks/my`.)

### `GET /projects/:projectId/tasks`
Query: `status`, `priority`, `assigneeId`, `page`, `pageSize`. Same `assertProjectAccess` rule as the
parent project.

**Auth**: required · **Role**: none at the route

### `POST /projects/:projectId/tasks`
Body: `{ "title", "description"?, "priority"?, "dueDate"?, "assigneeId"? }`. `400` if `assigneeId` is
set but isn't a member of that project. `403` (`assertManagerOrAdmin`) unless Admin or that project's
manager.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `GET /tasks/my`
The caller's own assigned tasks. Query: `status`, `priority`, `page`, `pageSize`.

**Auth**: required · **Role**: none (every role has tasks assigned to them, or an empty list)

### `GET /tasks/:id`
Single task. `403` (`assertProjectAccess`) if the caller has no access to the task's project.

**Auth**: required · **Role**: none at the route

### `PATCH /tasks/:id`
Body: any of `{ "title", "description", "status", "priority", "dueDate", "assigneeId" }` — but **what
you're allowed to send depends on your role**, checked in the service, not the route:
- **Admin / the project's manager**: any field. `assigneeId`, if changed, must be a project member
  (`400` otherwise).
- **Team Member**: only if the task is assigned to them, and only the `status` field —
  `403 "You can only update tasks assigned to you"` if it's not their task,
  `403 "Team members may only update a task's status"` if the body touches anything besides `status`.

Any actual status change writes a `TaskStatusLog` row in the same transaction as the update.

**Auth**: required · **Role**: none at the route (role-shaped by the service instead)

### `DELETE /tasks/:id`
Same `assertManagerOrAdmin` rule as deleting a project. Cascades to the task's status log and comment
rows. `204` no body.

**Auth**: required · **Role**: `ADMIN`, `PROJECT_MANAGER`

### `GET /tasks/:id/history`
The task's `TaskStatusLog` entries, newest first: `{ id, taskId, oldStatus, newStatus, changedById, changedAt, changedBy: {id,name} }`. Same `assertProjectAccess` rule as reading the task.

**Auth**: required · **Role**: none at the route

---

## Task Comments

**Comment shape**: `{ id, taskId, authorId, body, createdAt, author: {id,name,email} }`

### `GET /tasks/:id/comments`
Oldest first. Same `assertProjectAccess` rule as reading the task — **any member of the task's
project** can read comments, not just the assignee.

**Auth**: required · **Role**: none at the route

### `POST /tasks/:id/comments`
Body: `{ "body": "1–2000 characters" }`. Same `assertProjectAccess` rule as reading — deliberately
broader than the status-update rule above, so a PM or teammate can comment on a task without being its
assignee. `400` on an empty or over-length body.

**Auth**: required · **Role**: none at the route

---

## Dashboard

### `GET /dashboard/summary`
Shape depends on the caller's role (`scope` tells you which variant you got):

```jsonc
// scope: "ADMIN"
{ "scope": "ADMIN", "userCount": 12, "projectCount": 4, "taskCount": 37, "tasksByStatus": { "TODO": 10, "IN_PROGRESS": 15, "IN_REVIEW": 5, "DONE": 7 } }

// scope: "PROJECT_MANAGER"
{ "scope": "PROJECT_MANAGER", "projectCount": 2, "taskCount": 19, "tasksByStatus": { "...": 0 } }

// scope: "TEAM_MEMBER"
{ "scope": "TEAM_MEMBER", "taskCount": 5, "tasksByStatus": { "...": 0 }, "overdueCount": 1 }
```

`tasksByStatus` only includes keys with at least one task — treat a missing key as `0`.
`overdueCount` (Team Member only) counts their assigned tasks with a `dueDate` in the past that aren't
`DONE`.

**Auth**: required · **Role**: none (shape adapts per role)
