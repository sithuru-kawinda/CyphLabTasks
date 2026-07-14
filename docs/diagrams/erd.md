# Entity Relationship Diagram

Generated from `backend/prisma/schema.prisma`. Renders automatically on GitHub.

```mermaid
erDiagram
    USER ||--o{ PROJECT : "manages"
    USER ||--o{ PROJECT_MEMBER : "is a member via"
    USER ||--o{ TASK : "assigned to"
    USER ||--o{ TASK : "created"
    USER ||--o{ TASK_STATUS_LOG : "changed status"
    USER ||--o{ TASK_COMMENT : "authored"
    PROJECT ||--o{ PROJECT_MEMBER : "has"
    PROJECT ||--o{ TASK : "contains"
    TASK ||--o{ TASK_STATUS_LOG : "has audit trail"
    TASK ||--o{ TASK_COMMENT : "has"

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

    TASK_COMMENT {
        string id PK
        string taskId FK
        string authorId FK
        string body
        datetime createdAt
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
  `TaskStatusLog` and `TaskComment` entries.
- `TaskComment` access is scoped by the same `assertProjectAccess` check used for reading a task: any
  member of the task's project, the project's manager, or an Admin may read and post comments — not
  limited to the task's assignee (unlike status updates).
