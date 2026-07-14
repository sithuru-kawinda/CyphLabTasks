# System Architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Next.js 16 App Router UI\n(React 19, Tailwind v4, shadcn/ui)"]
    end

    subgraph FE["frontend/ — Next.js server"]
        RSC["Server Components\n(serverApiFetch, forwards Cookie header)"]
        CC["Client Components\n(apiFetch, credentials: include)"]
        PROXY["src/proxy.ts\noptimistic auth/role redirect\n(decoded-only JWT read)"]
    end

    subgraph BE["backend/ — Express API (:4000)"]
        ROUTE["Routes\nauthenticate -> authorize(roles) -> validate -> controller"]
        CTRL["Controllers\nasyncHandler, requireUser, shape {data}/{data,meta}"]
        SVC["Services\nbusiness logic + fine-grained authorization\n(assertProjectAccess / assertManagerOrAdmin / scopeWhere)"]
        PRISMA["Prisma Client"]
    end

    DB[("MySQL 8\ncyphlab")]

    UI -->|"page navigation"| RSC
    UI -->|"form actions / mutations"| CC
    UI -.->|"gated by"| PROXY
    RSC -->|"HTTP + forwarded cookie"| ROUTE
    CC -->|"HTTP, cookie auto-attached"| ROUTE
    ROUTE --> CTRL --> SVC --> PRISMA --> DB

    classDef store fill:#f5f5f5,stroke:#999;
    class DB store;
```

## Request lifecycle

1. **Auth**: on login, the backend signs a JWT (`sub`, `role`) and sets it as an `httpOnly` cookie named
   `token` (8h expiry, no refresh flow).
2. **Optimistic gate**: `frontend/src/proxy.ts` decodes (does **not** verify) that cookie to redirect
   unauthenticated requests to `/login` and gate `/admin`-prefixed routes to the `ADMIN` role. This is
   UX-only.
3. **Authoritative check**: every backend request re-verifies the JWT signature (`authenticate`
   middleware) and re-checks authorization — coarse-grained via `authorize(...roles)` at the route level,
   fine-grained via service-level helpers that check DB-backed ownership/membership
   (`assertProjectAccess`, `assertManagerOrAdmin`, `scopeWhere`).
4. **Response envelope**: controllers return `{ data }` or `{ data, meta }` for paginated lists; errors
   are `{ error: { message } }`. `frontend/src/lib/api.ts` (`apiFetch` for Client Components,
   `serverApiFetch` for Server Components) unwraps this envelope and throws `ApiError` on failure.
5. **Data layer**: services are the only layer that talks to Prisma; `TaskStatusLog` rows are written
   transactionally alongside any `Task.status` change, forming an append-only audit trail.

## Deployment shape (target)

```mermaid
flowchart LR
    Browser --> Vercel["Frontend on Vercel\n(Next.js)"]
    Vercel -->|"NEXT_PUBLIC_API_URL"| API["Backend on Railway/Render/Fly\n(Express, Node 22)"]
    API --> MySQL[("Managed MySQL\n(PlanetScale/Railway/RDS)")]
```

Not currently deployed — see the root `README.md` "Deployment" section.
