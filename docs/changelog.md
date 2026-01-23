# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-01-23

### Added
- **Complete SEO Implementation**
  - Root layout metadata with Open Graph, Twitter Cards, keywords
  - `src/app/(public)/metadata.ts` with reusable `generatePageMetadata()` and `generateArticleMetadata()` utilities
  - Dynamic `sitemap.xml` generation (`src/app/sitemap.ts`) with static pages + dynamic meetings/news
  - `robots.txt` configuration (`src/app/robots.ts`)
  - Metadata for all public pages with canonical URLs
  - Article-type metadata for meetings and news detail pages

- **Visual Refinements**
  - Real logo in Header component using Next.js Image
  - Real logo in Footer component with brightness/invert filter for dark background

- **Contact Page Enhancements**
  - New `ContactMap` component with Leaflet/React-Leaflet
  - Interactive map centered on Santiago, Chile with ALADIL office marker
  - Replaced placeholder with real map in ContactPage

### Changed
- HTML lang attribute changed from "en" to "es"
- All public page routes now use shared metadata utilities
- Import order fixes for Biome linter compliance

---

## [0.2.0] - 2026-01-18

### Added
- **Testing Infrastructure**
  - Vitest 4.0.17 with coverage reporting
  - Testing Library (React, DOM, User Event)
  - 80% minimum coverage threshold enforced
  - 305 tests across all modules

- **Labs Module** (Complete CRUD)
  - Form component with name, countryCode, city, websiteUrl, sortOrder, isActive
  - DataTable with columns and row actions
  - List, Create, Edit pages

- **Meetings Module** (Complete CRUD)
  - Form component with number, title, slug, city, country, dates, host, status
  - DataTable with columns and row actions
  - List, Create, Edit pages

- **Executive Committee Module** (Complete CRUD)
  - Form component with fullName, position, countryCode, sortOrder, isActive
  - DataTable with columns and row actions
  - List, Create, Edit pages

- **Users Module** (Complete CRUD)
  - Form component with email, name, password, isActive, isSuperAdmin
  - DataTable with columns and row actions
  - List, Create, Edit pages

- **Contact Messages Module** (Read-only admin view)
  - DataTable with columns showing name, email, message preview, status
  - Detail dialog for viewing full message
  - Status management (mark as read, archive)

- **Shared UI Components**
  - `ActiveBadge` - displays active/inactive status
  - `ContactStatusBadge` - displays NEW/READ/ARCHIVED status

### Changed
- Documentation updated: tRPC references changed to ORPC
- `CLAUDE.md` updated with testing requirements (80% coverage)
- `docs/architecture.md` updated with correct tech stack
- `docs/project_status.md` updated with current progress

### Fixed
- Linting errors in vitest.config.ts and users router
- Added missing shadcn components (checkbox, switch)

---

## [0.1.0] - 2026-01-06

### Added
- Initial Next.js 16 project setup with App Router
- Prisma 7 with PostgreSQL adapter for Supabase
- Complete database schema (`prisma/schema.prisma`):
  - Auth models: User, Session, Account, Verification
  - RBAC models: Project, Role, Permission, RolePermission, UserProjectRole
  - Business models: Lab, ExecutiveMember, Meeting, NewsPost, ContactMessage, Asset
  - Audit model: AuditEvent
- Better Auth integration with email/password
- ORPC setup (client/server/context/router)
- RBAC middleware and helpers (hasPermission, requirePermission, isSuperAdmin)
- Admin shell layout (Sidebar, Header, AdminShell)
- Login page with email/password form
- News module (complete CRUD with permissions)
- Shared UI components (DataTable, StatusBadge, ConfirmDialog)
- Prisma client singleton at `src/modules/core/db/`
- Module folder structure under `src/modules/`
- Biome for linting and formatting
- Tailwind CSS v4 setup
- Environment template (`.env.example`)

### Infrastructure
- pnpm as package manager
- Database scripts: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`
