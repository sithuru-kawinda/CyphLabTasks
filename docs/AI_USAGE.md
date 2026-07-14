# AI Tools Used

> **Before submitting**: please review and adjust this file — it accurately describes what Claude Code
> did in the session that produced this document, but you should confirm/edit the parts about earlier
> work (Day 1–2) based on your own recollection, since that happened before this session.

**Tool**: [Claude Code](https://claude.com/claude-code) (Anthropic), used as an interactive AI pair
programmer throughout development.

## What was AI-assisted

- **Project scaffolding and architecture** (`CLAUDE.md`, layered route → middleware → controller →
  service → Prisma pattern, two-layer authorization model) — established early and followed
  consistently across the backend.
- **This session specifically**, working from the existing Day 1/2 backend and uncommitted Day 3
  frontend work already in the repo:
  - Diagnosed and fixed a bug in the projects/tasks list pages: they destructured `.data` from
    `serverApiFetch<Paginated<T>>`, but the API client's `parseResponse` already unwraps the response
    envelope, so the destructure returned `undefined` and crashed page rendering (500s on
    `/projects`, `/tasks`, `/projects/[id]`).
  - Verified all major flows end-to-end against the running dev servers, logged in as each of the
    three seeded roles (Admin, Project Manager, Team Member).
  - Wired the dashboard page to the previously-unused `GET /dashboard/summary` backend endpoint
    (backend logic itself was pre-existing from Day 2).
  - Wrote the GitHub Actions CI workflow (`.github/workflows/ci.yml`).
  - Wrote this documentation set: root `README.md`, ERD/use-case/architecture diagrams
    (`docs/diagrams/`), `docs/Feature Completion Report.md`, `docs/CI-CD Workflow Explanation.md`, and
    this file — all derived by
    reading the actual schema/routes/services rather than written from a generic template.

## What was not AI-generated

- The screen recording video and any live deployment steps are performed directly by the candidate,
  not by the AI tool.
- Product/scope decisions (which features to prioritize, role/permission design) were directed by the
  candidate; the AI implemented and verified against those decisions rather than inventing them
  independently.
