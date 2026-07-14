# CI/CD Pipeline

**Workflow file**: `.github/workflows/ci.yml`
**Trigger**: every `push` and `pull_request` targeting `main`/`master`.

This is a CI (continuous integration) pipeline — it validates every change automatically. There is no
CD (continuous deployment) step, since this submission does not include a live deployment target.

## What it runs

Two independent jobs, one per package, both on `ubuntu-latest` with Node 22:

### `backend` job

1. `npm ci` — install pinned dependencies from `package-lock.json`.
2. `npx prisma generate` — generates the Prisma client from `prisma/schema.prisma`. This only needs
   `DATABASE_URL` to be *defined* (the workflow sets a dummy placeholder value) — it does not connect
   to a real database, so no MySQL service container is needed just for this step.
3. `npm run lint` — ESLint over `src/`.
4. `npm run typecheck` — `tsc --noEmit`.
5. `npm run build` — compiles to `dist/`, proving the app actually builds.

### `frontend` job

1. `npm ci`.
2. `npm run lint` — ESLint (flat config, `next lint` successor).
3. `npm run build` — `next build`. Next.js runs its own TypeScript check as part of the production
   build, so this step also acts as the frontend's typecheck. `NEXT_PUBLIC_API_URL` is set to a
   placeholder since the app only needs it to *exist* at build time, not to be reachable (it's read by
   client code at runtime, not baked into static output).

A push/PR is considered CI-green only if both jobs succeed — a lint error, type error, or build
failure in either package fails the run.

## What CI deliberately does not cover

There is no automated test suite in this repo (no Jest/Vitest configured in either package), so CI
cannot run `npm test`. Functional verification for this submission was done manually: seeded demo
accounts for all three roles were exercised end-to-end against the running dev servers (login, project
CRUD, member management, task CRUD, task status transitions + audit history, and the role-scoped
dashboard) before each commit. Adding a real test runner (e.g. Vitest + Supertest for the backend) and
wiring it into this same workflow is the natural next step beyond this submission.

## Why two separate jobs instead of one

`frontend/` and `backend/` are independent npm projects with separate lockfiles and no shared
workspace config (see the root `README.md`). Splitting them into separate jobs means:

- They install and cache dependencies independently (`cache-dependency-path` points at each package's
  own lockfile), so a change in one package doesn't invalidate the other's cache.
- A failure in one package's pipeline is immediately attributable — the job name in the GitHub Actions
  UI tells you which package broke without reading logs.
- They could run on different runners/Node versions in the future without restructuring the workflow.
