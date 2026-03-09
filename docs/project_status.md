# Project Status - ALADIL Platform

**Last Updated:** 2026-01-23

---

## Current Phase

### Phase 1: Project & Database Setup ✅

| Task | Status |
|------|--------|
| Next.js 16 project init | Done |
| Prisma 7 setup | Done |
| Database schema design | Done |
| Prisma client singleton | Done |
| Module folder structure | Done |
| Environment config | Done |

### Phase 2: Core Infrastructure ✅

| Task | Status |
|------|--------|
| ORPC setup (client/server/context) | Done |
| Better Auth integration | Done |
| RBAC middleware/helpers | Done |
| Admin shell layout | Done |
| Login page | Done |
| News module CRUD | Done |
| Testing setup (Vitest + 80% coverage) | Done |

### Phase 3: Complete CRUD Modules ✅

| Task | Status |
|------|--------|
| CRUD: Meetings | Done |
| CRUD: Labs | Done |
| CRUD: Executive Committee | Done |
| CRUD: Users & Roles | Done |
| CRUD: Contact Messages | Done |
| Supabase storage helpers | Done |

### Phase 4: Public Site ✅

| Task | Status |
|------|--------|
| Home page | Done |
| About page | Done |
| Laboratories page (with Leaflet map) | Done |
| Executive Committee page | Done |
| Meetings page + detail pages | Done |
| News page + detail pages | Done |
| Contact page (with Leaflet map) | Done |
| SEO: metadata for all pages | Done |
| SEO: sitemap.xml (dynamic) | Done |
| SEO: robots.txt | Done |
| Real logo in Header/Footer | Done |
| Fix routing (remove default page.tsx) | Done |
| Convert public pages to Server Components | Done |

---

### Phase 5: Programa PILA (In Progress)

| Task | Status |
|------|--------|
| PilaIndicator model (configurable, DB-stored) | Done |
| PilaReport + PilaReportValue models | Done |
| PILA ProjectKey + PilaReportStatus enum | Done |
| User-Lab association (labId on User) | Done |
| PILA permissions (submit, read_own, read_all, manage) | Done |
| PILA roles (lab_reporter, pila_admin) | Done |
| 11 indicators seeded with full metadata | Done |
| PILA ORPC router + dual authorization | Done |
| PILA schemas (Zod validation) | Done |
| Indicator CRUD (admin: create/edit/toggle/delete) | Done |
| Lab reporter: list reports, create, edit, submit | Done |
| Lab reporter: pending report notification | Done |
| Admin: all reports view with filters + stats | Done |
| Admin: reopen/delete reports | Done |
| Admin: indicators management page | Done |
| User-Lab assignment UI | Pending |
| PILA role assignment to users | Pending |
| Tests | Pending |

---

## Upcoming Phase

### Phase 6: Polish & Deploy
- [ ] Password reset flow
- [ ] Email notifications
- [ ] Observability (logging + audit)
- [ ] Production deployment to Vercel

---

## Database Models

| Model | Fields | Status |
|-------|--------|--------|
| User | email, displayName, passwordHash, isSuperAdmin | Schema ready |
| Session | tokenHash, expiresAt | Schema ready |
| Account | Better Auth accounts | Schema ready |
| Verification | Email verification tokens | Schema ready |
| Project | key, name, isActive | Schema ready |
| Role | key, name, permissions | Schema ready |
| Permission | key, description | Schema ready |
| RolePermission | Role -> Permission mapping | Schema ready |
| UserProjectRole | User membership per project | Schema ready |
| Lab | name, countryCode, websiteUrl | Schema ready |
| ExecutiveMember | fullName, position, countryCode | Schema ready |
| Meeting | number, title, slug, dates, content | Schema ready |
| MeetingAsset | Meeting gallery images | Schema ready |
| NewsPost | title, slug, excerpt, content | Schema ready |
| NewsAsset | News attachments | Schema ready |
| Asset | type, bucket, path, filename | Schema ready |
| ContactMessage | name, email, message | Schema ready |
| AuditEvent | action, entity, metadata | Schema ready |
| PilaIndicator | code, name, formula, labels, considerations, exclusions | Schema ready |
| PilaReport | labId, year, month, status, notes | Schema ready |
| PilaReportValue | reportId, indicatorId, numerator, denominator | Schema ready |

---

## Public Site Pages

| Page | Route | Features |
|------|-------|----------|
| Home | `/` | Hero, About section, Recent meetings, Executive preview, News |
| About | `/about` | Mission, Vision, History, Values |
| Laboratories | `/laboratories` | Interactive Leaflet map + Grid view |
| Executive | `/executive` | Committee members grid |
| Meetings | `/meetings` | Published meetings list |
| Meeting Detail | `/meetings/[slug]` | Full content, gallery, sidebar |
| News | `/news` | Published news list |
| News Detail | `/news/[slug]` | Full article, attachments |
| Contact | `/contact` | Contact form, info cards, Leaflet map |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase PostgreSQL |
| ORM | Prisma 7 |
| API | ORPC (type-safe RPC) |
| Auth | Better Auth |
| Storage | Supabase Storage |
| Styling | Tailwind CSS 4 + Shadcn UI |
| Maps | Leaflet + React-Leaflet |
| Editor | TipTap (WYSIWYG) |
| Testing | Vitest + Testing Library (80% coverage) |
| Deploy | Vercel |
