# CLAUDE.md
## Project Goals

**Current milestone:** Full-stack implementation with public site and admin intranet.

## Recent Updates

- **Mapa Interactivo de Laboratorios**: Implementado con Leaflet + React-Leaflet en `/laboratories`. Muestra ubicación de todos los labs miembros con popups interactivos.
- **Editor de Noticias tipo WordPress**: Implementado con TipTap. Incluye formato de texto, encabezados, listas, citas, imágenes, enlaces y alineación.
- **Base de datos poblada**: Seeds con 14 laboratorios, 4 miembros ejecutivos, 37 reuniones históricas.
- **Assets copiados**: Logos, fotos de miembros, banners desde el sitio productivo.

## Architecture Overview

Next.js 16 application with Supabase PostgreSQL DB, ORPC for type-safe APIs, Better Auth for authentication.

```
src/
├── app/                          # SOLO routing (Next App Router)
│   ├── (public)/                 # Web institucional
│   ├── (auth)/                   # Auth pages (login, etc.)
│   ├── (admin)/                  # Intranet
│   ├── api/
│   │   ├── auth/[...all]/        # Better Auth handler
│   │   └── rpc/[...rest]/        # ORPC handler
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
│
├── modules/                      # Feature-driven (todo lo demás)
│   ├── shared/                   # Compartido entre features
│   │   ├── ui/                   # Atoms / Molecules / Organisms
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── validators/
│   │   └── config/
│   │
│   ├── core/                     # Infraestructura
│   │   ├── orpc/                 # client / server / context / router
│   │   ├── auth/                 # BetterAuth + RBAC helpers
│   │   ├── db/                   # Prisma client + repos
│   │   ├── storage/              # Supabase storage helpers
│   │   └── observability/        # logger + audit
│   │
│   ├── public-site/              # Web pública (composición)
│   │   ├── pages/
│   │   ├── components/
│   │   └── adapters/
│   │
│   ├── admin/                    # Shell intranet
│   │   ├── components/
│   │   └── pages/
│   │
│   ├── news/                     # Feature dominio
│   │   ├── components/
│   │   ├── pages/
│   │   ├── server/               # router / service / policy
│   │   ├── schemas.ts
│   │   └── index.ts
│   │
│   ├── meetings/
│   ├── labs/
│   ├── executive/
│   ├── users/
│   └── contact/
│
└── next.config.ts
```

## Design Style Guide

**Tech stack:** Next.js ^16 (App Router), Tailwind CSS 4, Shadcn UI, ORPC, Prisma 7, Supabase, Better Auth, Vitest

**Key UI Libraries:**
- **Leaflet + React-Leaflet**: Mapas interactivos (página de laboratorios)
- **TipTap**: Editor WYSIWYG tipo WordPress (formulario de noticias)
- **Radix UI**: Primitivos de UI accesibles (tooltips, dialogs, etc.)
- **Lucide React**: Iconos

**Visual Style:**
- Clean, sober, minimal interface.
- Shadcn components for consistency.
- Responsive design.
- No dark mode.

**Component patterns:**
- Shadcn UI for all interactive elements (buttons, inputs, cards).
- Tailwind for layout and spacing.
- Keep components focused and simple.
- Arrow functions for functional components.
- Props interfaces for all components.

## Product & UX Guidelines

**Core UX principles:**
- Speed over perfection.
- Simple, direct, and clear.

**Copy and texts tone:**
- Professional, but approachable.
- Clear hierarchy.

## Constraints & Policies

**Security - MUST follow:**
- NEVER expose sensitive data in client code.
- ALWAYS use enviroment variables for secrets.
- NEVER commit `.env.local` or any file with API keys.
- Validate and sanitize all user inputs.

**Code quality:**
- Typescript strict mode.
- Run `pnpm lint` before commits.
- No `any` types without justification.
- Always TDD.

**Testing - MUST follow:**
- Maintain **minimum 80% code coverage** at all times.
- Write tests BEFORE implementing features (TDD).
- Run `pnpm test` before every commit.
- Run `pnpm test:coverage` to verify coverage threshold.
- All new features require unit tests.
- Critical paths (auth, RBAC, CRUD operations) require integration tests.
- PRs with coverage below 80% will be rejected.

## Frequently used commands
```bash
# Development
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build (also catches type errors)
pnpm start        # Run production build locally
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome

# Testing
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report (must be >= 80%)

# Database (Prisma 7)
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database (dev)
pnpm db:migrate   # Create and apply migrations
pnpm db:studio    # Open Prisma Studio GUI
pnpm db:seed      # Seed RBAC (projects, permissions, admin user)
pnpm db:seed-content # Seed content (labs, executive, meetings)

# Shadcn UI
pnpm dlx shadcn@latest add [component]
```

## Documentation

- [Project Spec](docs/project_spec.md)
- [Architecture](docs/architecture.md)
- [Changelog](docs/changelog.md)
- [Project Status](docs/project_status.md)
- Update files in the docs folder after major milestones and major additions to the project.