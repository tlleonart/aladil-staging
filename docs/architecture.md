# Architecture

## System Overview

Aladil is a web application built with Next.js 16 and Supabase. It follows a feature-driven architecture with focus on scalability and maintainability.

**Two main areas:**
- **Public Site** - Institutional website for external users
- **Intranet** - Private dashboard for administrators (CRUD for news, meetings, labs, executive, users)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase PostgreSQL |
| ORM | Prisma 7 |
| API | ORPC (type-safe RPC) |
| Auth | Better Auth |
| Storage | Supabase Storage |
| Styling | Tailwind CSS + Shadcn UI |
| Testing | Vitest + Testing Library (80% coverage) |
| Deploy | Vercel |

## Database Schema

Located at `prisma/schema.prisma`. Uses Prisma 7 with pg adapter.

### Core Models

```
Auth & RBAC
├── User              # Credentials + profile
├── Session           # Active sessions
├── Account           # Better Auth accounts
├── Verification      # Email verification tokens
├── Project           # RBAC projects (NEWS, MEETINGS, etc.)
├── Role              # Roles per project
├── Permission        # Atomic permissions
├── RolePermission    # Role -> Permission mapping
└── UserProjectRole   # User membership per project

Business Domain
├── Lab               # Member laboratories
├── ExecutiveMember   # Executive committee
├── Meeting           # Annual meetings
├── MeetingAsset      # Meeting gallery images
├── NewsPost          # News articles
├── NewsAsset         # News attachments
├── Asset             # Supabase storage references
├── ContactMessage    # Contact form submissions
└── AuditEvent        # Admin action log
```

### RBAC Model

- Permissions are atomic: `news.create`, `meetings.publish`
- Roles exist **per project**
- Users can have different roles in different projects
- `isSuperAdmin` bypasses all RBAC checks

## Folder Structure

```
src/
├── app/                    # Routing only (Next App Router)
│   ├── (public)/           # Public website routes
│   ├── (auth)/             # Auth pages (login, etc.)
│   ├── (admin)/            # Intranet routes
│   └── api/
│       ├── auth/           # Better Auth handler
│       └── rpc/            # ORPC handler
│
└── modules/                # Feature-driven code
    ├── core/               # Infrastructure
    │   ├── db/             # Prisma client singleton
    │   ├── auth/           # Better Auth + RBAC
    │   ├── orpc/           # ORPC setup (client/server/context)
    │   ├── storage/        # Supabase storage helpers
    │   └── observability/  # Logging + audit
    │
    ├── shared/             # Cross-feature utilities
    │   ├── ui/             # Shared components (DataTable, StatusBadge, etc.)
    │   ├── hooks/
    │   ├── types/
    │   └── validators/
    │
    ├── admin/              # Admin shell layout
    │   ├── components/     # AdminShell, Sidebar, Header
    │   └── pages/          # LoginPage
    │
    └── [feature]/          # Domain modules (news, meetings, labs, etc.)
        ├── components/
        ├── hooks/
        ├── pages/
        ├── server/         # ORPC router + service + policy
        └── schemas.ts
```

## Key Principles

1. **Contract-first**: `schema.prisma` is the source of truth
2. **Feature-driven**: Code organized by domain, not by type
3. **App Router minimal**: `app/` only routes, no business logic
4. **Backend authority**: Frontend never decides permissions
5. **Test-driven**: 80% minimum coverage, TDD approach

## Data Flow

```
Client Component
    ↓
ORPC Client (type-safe)
    ↓
ORPC Router (validates session + permissions)
    ↓
Service Layer (business logic)
    ↓
Prisma Client (database)
```

## Testing Strategy

- **Unit tests**: Business logic, utilities, schemas
- **Integration tests**: ORPC routers, auth flows
- **Component tests**: React components with Testing Library
- **Coverage threshold**: 80% minimum (enforced in CI)

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
```
