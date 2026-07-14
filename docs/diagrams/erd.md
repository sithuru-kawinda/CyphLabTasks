# Entity Relationship Diagram

Generated from `backend/prisma/schema.prisma`. Renders automatically on GitHub.

```mermaid
erDiagram
    USER ||--o{ PROJECT : "manages"
    USER ||--o{ PROJECT_MEMBER : "is a member via"
    USER ||--o{ TASK : "assigned to"
    USER ||--o{ TASK : "created"
    USER ||--o{ TASK_STATUS_LOG : "changed status"
    PROJECT ||--o{ PROJECT_MEMBER : "has"
    PROJECT ||--o{ TASK : "contains"
    TASK ||--o{ TASK_STATUS_LOG : "has audit trail"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "ADMIN | PROJECT_MANAGER | TEAM_MEMBER"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        string id PK
        string name
        string description
        enum status "PLANNED | ACTIVE | ON_HOLD | COMPLETED"
        datetime startDate
        datetime endDate
        string managerId FK
        datetime createdAt
        datetime updatedAt
    }

    PROJECT_MEMBER {
        string id PK
        string projectId FK
        string userId FK
        datetime addedAt
    }

    TASK {
        string id PK
        string title
        string description
        enum status "TODO | IN_PROGRESS | IN_REVIEW | DONE"
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        datetime dueDate
        string projectId FK
        string assigneeId FK
        string creatorId FK
        datetime createdAt
        datetime updatedAt
    }

    TASK_STATUS_LOG {
        string id PK
        string taskId FK
        enum oldStatus
        enum newStatus
        string changedById FK
        datetime changedAt
    }
```

## Notes

- `ProjectMember` is a join table between `User` and `Project`, unique on `(projectId, userId)` — a user
  can only be added to a given project once. Deleting a project or a user cascades to their memberships.
- `Task.assigneeId` is nullable (a task can be unassigned); `Task.creatorId` is required.
- `TaskStatusLog` is append-only — it is written transactionally alongside every `Task.status` change
  (see `backend/src/services/task.service.ts::updateTask`) and forms an audit trail, never updated or
  deleted directly.
- Deleting a `Project` cascades to its `Task`s and `ProjectMember`s; deleting a `Task` cascades to its
  `TaskStatusLog` entries.
