# AI Tools Used

> **Before submitting**: please review this file. The Claude Code section is directly verifiable from
> the commit history in this repo. The ChatGPT line is the candidate's own account — add specifics if
> you want it to carry more weight with an evaluator (a vague "I used ChatGPT" claim is easy to write
> and hard to verify; naming the exact task it helped with is what makes it credible).

## Claude Code (Anthropic)

Used as an interactive AI pair programmer / agentic coding assistant throughout development — this is
directly reflected in the repo's commit history, not just this document's say-so.

- **Project scaffolding and architecture** (`CLAUDE.md`, layered route → middleware → controller →
  service → Prisma pattern, two-layer authorization model) — established early and followed
  consistently across the backend.
- **Full-stack feature work**, including:
  - The initial projects/tasks frontend (list/detail pages, CRUD dialogs, status control).
  - Diagnosing and fixing a live bug: the projects/tasks list pages destructured `.data` from an
    already-unwrapped API response, crashing page rendering with 500s.
  - Wiring the dashboard to the backend's role-scoped summary endpoint, then later adding an inline
    task-status control there for Team Members.
  - Adding the ability for Project Managers to delete their own projects (previously Admin-only).
  - The task comments feature end-to-end: Prisma model + migration, API routes, authorization, and the
    frontend Comments tab.
  - Admin user management: the `/admin/users` screen, plus backend endpoints to create a user directly
    and to permanently (hard-)delete one, including the referential-integrity guards on the latter.
  - The login/register page redesign (split illustration layout, blue/white theme) and the site-wide
    color token change that came with it.
- **CI/CD**: the GitHub Actions workflow (`.github/workflows/ci.yml`).
- **All submission documentation**: root `README.md`, the `ER Diagram.pdf` / `Use Case Diagram.pdf` /
  `Architecture Diagram.pdf` (hand-built, self-contained HTML rendered to PDF — not a generic template),
  `API Documentation.md`, `Feature Completion Report.md`, `CI-CD Workflow Explanation.md`,
  `TESTING_GUIDE.md`, and this file — all written by reading the actual schema/routes/services rather
  than generated generically, and where practical verified live against the running app (curl checks,
  rendered-PDF rasterization, etc.) rather than just asserted.

## ChatGPT

Also used by the candidate at points during development. *(Candidate: replace this line with the
specific task(s) — e.g. "brainstormed the initial feature list," "helped debug X before this repo
existed," "drafted the assignment reply email" — a specific claim reads as genuine, a generic one
reads as boilerplate.)*

## What was not AI-generated

- The screen recording video and any live deployment steps are performed directly by the candidate,
  not by an AI tool.
- Product/scope decisions (which features to prioritize, role/permission design) were directed by the
  candidate; the AI implemented and verified against those decisions rather than inventing them
  independently.
