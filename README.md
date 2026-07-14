# CyphLab — Project & Team Task Management Platform

A full-stack project/task management app with role-based access control for three roles:
**Admin**, **Project Manager**, and **Team Member**.

- **Frontend**: Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Express + TypeScript REST API, Prisma ORM, MySQL, cookie-based JWT auth
- **Database**: MySQL 8

This is a two-package repo — `frontend/` and `backend/` are independent npm projects, each with its
own `node_modules`, run as separate processes. There is no root package manager workspace.

## Features by role

| Capability | Admin | Project Manager | Team Member |
|---|---|---|---|
| Create a user directly (name/email/password/role) | ✅ | – | – |
| List users, change role, activate/deactivate, permanently delete | ✅ | – | – |
| Create / edit any project | ✅ | ✅ (own projects) | – |
| Delete a project | ✅ (any) | ✅ (own projects only) | – |
| Add / remove project members | ✅ | ✅ (own projects) | – |
| Create / edit / delete tasks in a project | ✅ | ✅ (own projects) | – |
| Assign tasks to project members | ✅ | ✅ | – |
| View projects & tasks they're a member of | ✅ (all) | ✅ (own) | ✅ (assigned) |
| Update status of tasks assigned to them | ✅ | ✅ | ✅ (status-only) |
| Comment on a task in an accessible project | ✅ | ✅ | ✅ (any project member, not just the assignee) |
| View dashboard summary (project/task counts); Team Members can also change task status right from the dashboard | ✅ | ✅ | ✅ |

See `docs/FEATURE_COMPLETION.md` for the full, detailed feature checklist, and `docs/TESTING_GUIDE.md`
for a step-by-step manual walkthrough plus `curl`-based authorization boundary checks per role.

## Architecture

Request flow is strictly layered on the backend: **route → middleware → controller → service → Prisma**.
Authorization is two-layered — coarse role checks in route middleware (`authorize(...roles)`), and
fine-grained ownership/membership checks inside services (e.g. a Project Manager can only manage their
own projects; a Team Member can only change the `status` field on tasks assigned to them).

See `docs/diagrams/` for the Entity Relationship Diagram, Use Case Diagram, and Architecture Diagram
(all PDFs).

## Prerequisites

- Node.js 22+
- Docker (for local MySQL), or a MySQL 8 / compatible instance you already have running

## Setup

### 1. Start MySQL

From the repo root:

```bash
docker-compose up -d
```

This starts a local MySQL 8 instance (`cyphlab-mysql`) on `localhost:3306` with database `cyphlab`,
user `root` / password `root`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit if your DB credentials/ports differ
npm run prisma:migrate     # applies the schema to the database
npm run seed                # seeds demo Admin/PM/2 Members + a demo project
npm run dev                  # starts the API on http://localhost:4000
```

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local   # defaults to http://localhost:4000/api/v1 if you skip this
npm run dev                    # starts the app on http://localhost:3000
```

### 4. Log in

Open [http://localhost:3000](http://localhost:3000) and log in with one of the seeded demo accounts
(password `Password123!` for all):

| Role | Email |
|---|---|
| Admin | `admin@cyphlab.dev` |
| Project Manager | `manager@cyphlab.dev` |
| Team Member | `member1@cyphlab.dev` / `member2@cyphlab.dev` |

## Commands reference

### Backend (`backend/`)

```
npm run dev              # tsx watch src/index.ts — dev server on PORT (default 4000)
npm run build              # tsc -p tsconfig.json -> dist/
npm start                   # node dist/index.js
npm run lint                 # eslint src --ext .ts
npm run typecheck            # tsc --noEmit
npm run prisma:migrate      # prisma migrate dev
npm run prisma:generate     # prisma generate (needed after pulling schema changes)
npm run prisma:studio       # prisma studio — browse the DB
npm run seed                  # seeds demo accounts + a demo project
```

### Frontend (`frontend/`)

```
npm run dev      # next dev
npm run build      # next build
npm start           # next start
npm run lint         # eslint
```

There's no root-level script to run both — start the backend and frontend dev servers in separate
terminals (steps 2 and 3 above).

## API documentation

A Postman collection covering every endpoint is at `docs/Postman Collection.json` (see also
`docs/API Documentation.md` for the human-readable reference). Import the collection into
Postman and set the collection's `baseUrl` variable to `http://localhost:4000/api/v1`.

Every successful response is wrapped as `{ data }` or, for paginated lists, `{ data, meta: { page,
pageSize, total } }`. Errors are `{ error: { message } }`.

## Testing & CI

There is no test framework configured yet (no Jest/Vitest runner). CI runs lint, typecheck, and a
production build for both packages on every push/PR — see `.github/workflows/ci.yml` and
`docs/CI_CD.md` for details.

## Diagrams & reports

- `docs/diagrams/ER Diagram.pdf` — Entity Relationship Diagram
- `docs/diagrams/Use Case Diagram.pdf` — Use Case Diagram
- `docs/diagrams/Architecture Diagram.pdf` — System architecture diagram
- `docs/API Documentation.md` — every endpoint: method, auth/role, request body, response shape, errors
- `docs/Postman Collection.json` — the same API as an importable Postman collection
- `docs/FEATURE_COMPLETION.md` — feature completion report
- `docs/CI_CD.md` — CI/CD pipeline explanation
- `docs/AI_USAGE.md` — AI tools used during development and what they assisted with
- `docs/TESTING_GUIDE.md` — manual UI walkthrough per role + `curl` authorization/validation checks

## Deployment

Not yet deployed. The backend expects a reachable MySQL instance and the env vars documented in
`backend/.env.example`; the frontend needs `NEXT_PUBLIC_API_URL` pointed at the deployed backend
(`frontend/.env.example`).
