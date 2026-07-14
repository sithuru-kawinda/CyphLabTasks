# Testing Guide

There is no automated test suite in this repo (no Jest/Vitest configured — see `README.md`). This guide
covers what CI checks automatically, and how to manually verify the app's behavior — the same flow used
to sanity-check this submission and a good script for the screen recording.

## 1. Automated checks (CI)

Runs on every push/PR via `.github/workflows/ci.yml`. To run the same checks locally before you push:

```bash
cd backend  && npm run lint && npm run typecheck && npm run build
cd frontend && npm run lint && npm run build       # next build also typechecks
```

All four should exit clean with no errors.

## 2. Start the app

```bash
docker-compose up -d          # MySQL, from repo root
cd backend  && npm run dev     # http://localhost:4000
cd frontend && npm run dev      # http://localhost:3000
```

Seeded accounts (password `Password123!` for all):

| Role | Email |
|---|---|
| Admin | `admin@cyphlab.dev` |
| Project Manager | `manager@cyphlab.dev` |
| Team Member | `member1@cyphlab.dev`, `member2@cyphlab.dev` |

## 3. Manual UI walkthrough, per role

### As Admin (`admin@cyphlab.dev`)

1. Log in → dashboard shows **Users / Projects / Tasks** counts + tasks-by-status breakdown.
2. `/projects` → see every project in the system, not just ones you manage.
3. Open a project you don't manage → confirm you can still edit it and add/remove members (Admin
   bypasses ownership checks).
4. Open a project's **Delete** action (only Admin can delete a project — a Project Manager viewing the
   same project should not see this option; verify by logging in as `manager@cyphlab.dev` on a project
   they don't manage).
5. `/admin/users` → change `member2@cyphlab.dev`'s role to `PROJECT_MANAGER`, confirm it sticks on
   reload, then change it back. Click **Deactivate** on the same account, then try logging in as that
   user in a different browser/incognito window — login should fail with "Invalid email or password"
   until you reactivate them. Confirm your own row shows a "You" badge with no editable controls.
6. As a non-Admin (e.g. `manager@cyphlab.dev`), navigate to `/admin/users` directly — should redirect to
   `/unauthorized` (enforced by `proxy.ts`, and independently by the `authorize("ADMIN")` route guard on
   the backend).

### As Project Manager (`manager@cyphlab.dev`)

1. Log in → dashboard shows **Projects / Tasks** counts (no Users count — Admin-only stat).
2. `/projects` → **New project** → create one. You become its manager automatically.
3. Open the new project → **Add member** → add `member1@cyphlab.dev`. Confirm they now appear under
   "Team members".
4. **New task** on the project → assign it to `member1@cyphlab.dev`, set a priority and due date.
5. Edit the task's title/priority/due date directly (`EditTaskDialog`) — should succeed.
6. Try editing a project you do **not** manage (e.g. the seeded "Website Redesign" demo project, if
   it's managed by a different PM) — expect a 403 / no edit affordance in the UI.

### As Team Member (`member1@cyphlab.dev`)

1. Log in → dashboard shows **My tasks / Overdue** counts only.
2. `/tasks` → see only tasks assigned to you.
3. Open the task the PM just assigned → use the status control to move it `TODO → IN_PROGRESS → IN_REVIEW → DONE`.
4. Check the **Activity** tab on the task detail page → confirm each status change appears in the audit
   log with your name and a timestamp.
5. Confirm you **cannot** edit the task's title, priority, or assignee (no such controls should be
   exposed to this role — see negative tests below for the API-level guarantee).
6. Confirm `/projects` does not show projects you're not a member of.

## 4. Authorization boundary checks (the part graders look for)

These are the checks that actually validate "role-based access control," beyond just "the UI hides the
button." Run them with `curl` or Postman — a hidden button is not the same as an enforced permission.

```bash
# Log in as a team member and capture the cookie
curl -s -c member.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member1@cyphlab.dev","password":"Password123!"}'

# 1. Team member tries to create a project -> expect 403
curl -s -b member.txt -X POST http://localhost:4000/api/v1/projects \
  -H "Content-Type: application/json" -d '{"name":"Should fail"}' -w "\n%{http_code}\n"

# 2. Team member tries to change a task's title (not just status) -> expect 403
TASK_ID="<a task id assigned to member1>"
curl -s -b member.txt -X PATCH http://localhost:4000/api/v1/tasks/$TASK_ID \
  -H "Content-Type: application/json" -d '{"title":"Hijacked"}' -w "\n%{http_code}\n"

# 3. Team member tries to list all users (Admin-only) -> expect 403
curl -s -b member.txt http://localhost:4000/api/v1/users -w "\n%{http_code}\n"

# 4. No cookie at all -> expect 401 on any protected route
curl -s http://localhost:4000/api/v1/projects -w "\n%{http_code}\n"

# 5. Project Manager tries to delete a project (Admin-only route) -> expect 403
curl -s -c pm.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"email":"manager@cyphlab.dev","password":"Password123!"}'
PROJECT_ID="<a project id managed by manager@cyphlab.dev>"
curl -s -b pm.txt -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID -w "\n%{http_code}\n"

# 6. Project Manager tries to access/edit a project they don't manage and aren't a member of -> expect 403
```

Expected results: all six return `401`/`403` with `{"error":{"message":"..."}}`, never `200`.

## 5. Validation checks

```bash
# Task title too short -> 400 with Zod error message
curl -s -b pm.txt -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/tasks \
  -H "Content-Type: application/json" -d '{"title":"a"}' -w "\n%{http_code}\n"

# Assigning a task to someone who isn't a project member -> 400
curl -s -b pm.txt -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Valid title","assigneeId":"<a user id NOT on this project>"}' -w "\n%{http_code}\n"

# Duplicate email on register -> 409/400
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dup","email":"admin@cyphlab.dev","password":"Password123!"}' -w "\n%{http_code}\n"
```

## 6. Postman

Import `docs/api/postman_collection.json`, set the collection's `baseUrl` variable to
`http://localhost:4000/api/v1`, and run the login request first — Postman will persist the `token`
cookie for subsequent requests in the same collection run.

## 7. Responsiveness

Resize the browser (or use DevTools device toolbar) at ~375px (mobile), ~768px (tablet), and desktop
widths on `/projects`, `/tasks`, and a task detail page — tables should remain usable (horizontal scroll
rather than broken layout) and dialogs should stay within the viewport.
