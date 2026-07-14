# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CyphLab is a project/task management app (projects, tasks, members, role-based dashboards). It's a two-package
monorepo with no shared package manager workspace config — `frontend/` and `backend/` are independent npm projects,
each with its own `node_modules`, run separately.

- `backend/` — Express + TypeScript REST API, Prisma ORM, MySQL, cookie-based JWT auth.
- `frontend/` — Next.js 16 (App Router) + React 19, TypeScript, Tailwind v4, shadcn/ui (base-ui primitives).
- `docs/api/postman_collection.json` — Postman collection for the API.
- `docker-compose.yml` (repo root) — local MySQL only; there is no containerized app service.
- `.gitignore` (repo root) — ignores `node_modules/`, both packages' env files (`.env`, `.env.local` —
  only the `.env.example` templates are tracked), build output (`frontend/.next/`, `frontend/out/`,
  `frontend/.turbo/`, `backend/dist/`, `backend/build/`), `*.log`, and editor/IDE dirs (`.vscode/`,
  `.idea/`, `.claude/`). Don't try to commit anything under these paths.

There is no test framework configured in either package (no test runner, no `test` script). Do not assume Jest/Vitest
are available.

## Commands

All commands are run from within `backend/` or `frontend/` respectively — there is no root package.json.

### Backend (`backend/`)
```
npm run dev              # tsx watch src/index.ts — dev server on PORT (default 4000)
npm run build             # tsc -p tsconfig.json -> dist/
npm start                 # node dist/index.js
npm run lint               # eslint src --ext .ts
npm run typecheck          # tsc --noEmit
npm run prisma:migrate    # prisma migrate dev
npm run prisma:generate   # prisma generate (needed after pulling schema changes)
npm run prisma:studio     # prisma studio
npm run seed               # tsx prisma/seed.ts — seeds demo Admin/PM/2 Members + a demo project (see below)
```
Requires MySQL running (`docker-compose up -d` from repo root) and `backend/.env` (copy from `.env.example`) with
`DATABASE_URL`, `JWT_SECRET`, etc.

### Frontend (`frontend/`)
```
npm run dev      # next dev
npm run build     # next build
npm start          # next start
npm run lint       # eslint
```
Requires `frontend/.env.local` with `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api/v1` if unset).

There's no root-level script to run both — start the backend and frontend dev servers in separate terminals.

### Seeded demo accounts (password `Password123!` for all)
- `admin@cyphlab.dev` (ADMIN), `manager@cyphlab.dev` (PROJECT_MANAGER), `member1@cyphlab.dev` / `member2@cyphlab.dev` (TEAM_MEMBER)

## Important: this is not the Next.js you know

The frontend pins **Next.js 16.2.10** with React 19 — a version with breaking API/convention changes relative to
older Next.js knowledge. Before writing Next.js code, check `frontend/node_modules/next/dist/docs/` for the current
APIs and heed deprecation notices. One concrete example already in this codebase: the routing middleware file is
named `src/proxy.ts`, not `middleware.ts`.

## Architecture

### Backend: layered Express + Prisma

Request flow is strictly layered: **route → middleware → controller → service → Prisma**. Follow this pattern for
any new endpoint rather than putting logic in controllers or routes.

- **Routes** (`src/routes/*.routes.ts`) wire `authenticate` → `authorize(...roles)` → `validateBody`/`validateQuery`
  → controller. Route nesting mirrors REST resources, e.g. project-scoped member/task routes live in
  `project.routes.ts` (`/projects/:projectId/members`, `/projects/:projectId/tasks`) alongside the flatter
  `task.routes.ts` (`/tasks/:id`, `/tasks/my`).
- **Controllers** (`src/controllers/*.controller.ts`) are thin: wrapped in `asyncHandler`, they call
  `requireUser(req)` for the authenticated user, delegate to a service, and shape the `{ data }` / `{ data, meta }`
  JSON envelope. No business logic here.
- **Services** (`src/services/*.service.ts`) hold all business logic, authorization checks, and Prisma calls. Cross-
  cutting authorization helpers like `assertProjectAccess` and `assertManagerOrAdmin` live in `project.service.ts`
  and are imported by other services (e.g. `task.service.ts`) rather than duplicated.
- **Validators** (`src/validators/*.validators.ts`) are Zod schemas; their inferred types (`z.infer<...>`) are the
  service-layer input types.

**Authorization model** — two layers, don't conflate them:
1. Coarse-grained, route-level: `authorize("ADMIN", "PROJECT_MANAGER")` middleware gates by role only.
2. Fine-grained, service-level: ownership/membership checks that need DB data (e.g. "is this user the project's
   manager or a member?") happen inside services, via `assertProjectAccess` / `assertManagerOrAdmin` /
   `scopeWhere(user)` (query-scoping for list endpoints). See `project.service.ts` and `task.service.ts` for the
   pattern — e.g. `TEAM_MEMBER`s updating a task can only change its `status` field on tasks assigned to them; this
   is enforced by allow-listing changed keys in `task.service.ts::updateTask`, not by the route middleware.

**Auth**: JWT signed with `sub`/`role`, stored in an `httpOnly` cookie named `token` (see `auth.controller.ts`,
`lib/jwt.ts`). `authenticate` middleware reads the cookie, verifies, and sets `req.user = { id, role }`
(`src/types/express.d.ts` augments `Express.Request`). There is no refresh-token flow — the cookie simply expires
with the JWT (`JWT_EXPIRES_IN`, default 8h).

**Errors**: throw `AppError(statusCode, message)` from anywhere in the service/controller layer; `asyncHandler`
forwards rejections to `errorHandler`, which serializes `AppError`s as `{ error: { message } }` and logs+500s
anything else. Don't `try/catch` in controllers — let it bubble.

**Response envelope**: every success response is `{ data }` or, for paginated lists, `{ data, meta: { page,
pageSize, total } }` (built via `lib/pagination.ts`'s `parsePagination`/`buildMeta`). The frontend's `apiFetch`/
`serverApiFetch` (see below) unwrap this envelope and throw on `{ error }`.

**Data model** (`prisma/schema.prisma`): `User` (Role: ADMIN/PROJECT_MANAGER/TEAM_MEMBER) → manages `Project`s
(1 manager per project) → has `ProjectMember`s (join table) and `Task`s. `Task` has an optional `assignee` and a
required `creator`, plus an append-only `TaskStatusLog` audit trail written transactionally whenever `status`
changes (see `task.service.ts::updateTask`).

### Frontend: Next.js App Router with route groups

- `src/app/(auth)/` — login/register, public layout.
- `src/app/(dashboard)/` — authenticated app shell (`DashboardShell` in `components/layout/`), containing
  `dashboard/`, `projects/`, `projects/[projectId]/`, `tasks/`, `tasks/[taskId]/`.
- `src/proxy.ts` — the Next 16 equivalent of middleware: redirects unauthenticated requests to `/login` and
  gates `/admin`-prefixed paths to `ADMIN` role, based on an **unverified, decoded-only** read of the JWT cookie
  (`lib/session.ts::decodeToken`). This is optimistic UX gating only — the backend independently re-verifies the
  signature and re-checks role/ownership on every request, so treat proxy.ts checks as non-authoritative and never
  rely on them for real access control when adding new protected routes.
- `src/lib/api.ts` — two fetch wrappers sharing one envelope-unwrapping/`ApiError` path:
  `apiFetch` (Client Components; browser attaches the cookie automatically) and `serverApiFetch` (Server
  Components; manually forwards the incoming request's `Cookie` header via `next/headers`). Use `apiFetch` in
  `"use client"` components and `serverApiFetch` when fetching during server-side render.
- `src/contexts/AuthContext.tsx` — client-side `useAuth()` (`user`, `loading`, `refresh`, `logout`), backed by
  `GET /auth/me`. This is the source of truth for the current user in Client Components; it does not read the JWT
  itself.
- `src/types/index.ts` — hand-maintained TypeScript types mirroring the Prisma schema/API responses (`User`,
  `Project`, `ProjectDetail`, `Task`, `TaskStatusLogEntry`, `Paginated<T>`, etc.). Keep these in sync manually when
  the backend's Prisma schema or serializers change — there's no codegen.
- `src/components/ui/` — shadcn/ui primitives (style: `base-nova`, base-ui react, not Radix); add new primitives via
  `npx shadcn add <component>` rather than hand-rolling, to stay consistent with `components.json`.
- Feature components are organized by domain under `src/components/{auth,projects,tasks,shared,layout}/`.
