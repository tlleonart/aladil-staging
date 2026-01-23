# Changelog

All notable changes to this project will be documented in this file.

## [0.4.1] - 2026-01-23

### Added
- **Supabase Storage Integration**
  - Added `@supabase/supabase-js` client for asset uploads
  - Created `scripts/upload-assets.ts` for member photos
  - Created `scripts/upload-all-assets.ts` for comprehensive asset management
  - All assets now served from Supabase Storage

- **Executive Member Photos** (4 members)
  - Fabián Fay, Milton Fornella, Giancarlo Sanguinetti, Paulo Díaz Meyer

- **Laboratory Logos** (7 labs)
  - Cibic, LAC, Amadita, Meyer Lab, LABIN, Biotest, Biomédica de Referencia

- **Meeting Covers** (8 meetings)
  - Covers for meetings #30-#37 (Rosario, Montevideo, Asunción, Santa Cruz, Guatemala, etc.)

- **General Assets**
  - Logo, history image, about background, hero banner
  - Country flags (AR, DO, PY, UY)
  - Meeting PDF (Asunción topics)

### Infrastructure
- Scripts: `upload-assets.ts`, `upload-all-assets.ts`
- Total: 28 assets uploaded to Supabase Storage

---

## [0.4.0] - 2026-01-23

### Fixed
- **Home Page Routing**: Removed default Next.js `src/app/page.tsx` that was overriding the public site home page
- **Public Pages Data Loading**: Converted public pages from Client Components with ORPC to Server Components with direct Prisma queries for reliable data loading
  - `MeetingsPage` - Now loads meetings server-side
  - `NewsPage` - Now loads news posts server-side
  - `ExecutivePage` - Now loads executive members server-side
  - `LaboratoriesPage` - Hybrid approach: Server-side data fetching with client-side interactive map

### Changed
- Public pages now use Server Components for better performance and SEO
- `LaboratoriesContent` extracted as client component for Leaflet map interactivity
- Data transformation moved to server-side for cleaner client components

---

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
