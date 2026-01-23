# product_spec.md — ALADIL Platform

## 1) Contexto general

**ALADIL** es la Asociación de Laboratorios de Diagnóstico Latinoamericanos.

El proyecto contempla dos subproductos:

1. **Frontend institucional (web pública)**  
   Replicar fielmente el sitio actual, modernizando la base técnica (la versión previa de Next.js está deprecándose).

2. **Intranet (dashboard administrativo)**  
   Plataforma privada con autenticación por credenciales, control de acceso por **roles y permisos por proyecto**, y administración de contenido y entidades del dominio.

### Sitio actual (fuente única de verdad para la replicación)
https://aladil.org/

Cualquier diferencia visual o estructural respecto a este sitio durante la Fase 0 se considera un bug.

---

## 2) Objetivos

### 2.1 Frontend institucional
- Replicar estructura, navegación, layout, estilos y contenido del sitio actual.
- Migrar a Next.js moderno (App Router, Next 16).
- Preparar el frontend para consumir contenido dinámico desde la base de datos.

### 2.2 Intranet
- Autenticación por credenciales (email + password).
- Recuperación de contraseña vía email.
- Control de acceso avanzado:
  - Roles y permisos **por proyecto**.
- CRUD completo de:
  - Noticias
  - Reuniones
  - Socios / Laboratorios
  - Comité Ejecutivo
  - Usuarios y roles
- Gestión de archivos (imágenes y PDF) en storage privado.

### 2.3 Plataforma
- Arquitectura serverless.
- Bajo costo operativo y escalabilidad automática.
- Separación estricta de responsabilidades (routing, dominio, infraestructura).

---

## 3) Principios de arquitectura

- **Contract-first:**  
  El archivo `schema.prisma` definido por el equipo es la **fuente de verdad** para datos y permisos.
- **Feature-driven:**  
  Todo el código vive en módulos por dominio (`modules/`).
- **App Router minimalista:**  
  La carpeta `app/` solo enruta. No contiene lógica de negocio.
- **RBAC multi-proyecto:**  
  Un usuario puede tener distintos roles en distintos proyectos.
- **Backend como autoridad:**  
  El frontend nunca decide permisos; todo se valida en tRPC.

---

## 4) Tech stack

- **Next.js 16** (App Router)
- **tRPC** (API type-safe)
- **Prisma** (ORM + migraciones)
- **Supabase**
  - PostgreSQL
  - Storage (buckets privados)
- **BetterAuth** (auth por credenciales)
- **Vercel** (deploy frontend + serverless)

Tooling recomendado:
- Zod (validación inputs)
- Mermaid (diagramas en repo)
- Playwright (E2E)
- dbdiagram / DBML / drawSQL (diagramas DB)
- Storybook (opcional)

---

## 5) Base de datos (contrato)

Existe un `schema.prisma` definido previamente que incluye:

- Auth:
  - User
  - Session
  - PasswordResetToken
- RBAC:
  - Project
  - Role
  - Permission
  - UserProjectRole
- Dominio:
  - Lab
  - ExecutiveMember
  - Meeting + MeetingAsset
  - NewsPost + NewsAsset
  - Asset
  - ContactMessage
  - AuditEvent

### Regla
ClaudeCode **no debe modificar** el schema sin instrucción explícita.  
Toda API y lógica debe respetar constraints, relaciones e índices existentes.

---

## 6) Roles y permisos (RBAC)

### 6.1 Modelo
- Los permisos son atómicos (`news.publish`, `meetings.update`, etc.).
- Los roles existen **por proyecto**.
- Un usuario puede tener un rol distinto en cada proyecto.
- Existe un `isSuperAdmin` opcional que bypassa RBAC.

### 6.2 Proyectos base
- INTRANET
- NEWS
- MEETINGS
- LABS
- EXEC_COMMITTEE
- SETTINGS

### 6.3 Permisos (convención)
Formato: `<area>.<action>`

Ejemplos:
- `news.read`, `news.create`, `news.publish`
- `meetings.update`, `meetings.assets.upload`
- `labs.delete`
- `users.disable`
- `roles.manage`

### 6.4 Autorización
En cada endpoint tRPC:
1. Verificar sesión válida.
2. Si `isSuperAdmin` → permitir.
3. Resolver `UserProjectRole` activo.
4. Verificar `Permission` requerida.
5. Caso contrario → `FORBIDDEN`.

---

## 7) Routing y Network Boundary (Next.js 16)

Este proyecto usa **Next.js 16**.

### 7.1 app/
- `app/` funciona **solo como router**:
  - layouts
  - pages
  - route handlers
- No contiene:
  - lógica de negocio
  - llamadas directas a DB
  - reglas de permisos

Cada `page.tsx` importa un componente “Page” desde `modules/`.

---

### 7.2 proxy.tsx (reemplazo de middleware)

En Next.js 16, `middleware.ts` está deprecado.  
Se utiliza **`proxy.ts` / `proxy.tsx`**, ubicado **al mismo nivel que `app/`**.

Responsabilidades de `proxy.tsx`:
- Redirects / rewrites
- Headers
- Gating de alto nivel (ej. bloquear `/admin` sin sesión)

Limitaciones:
- NO reemplaza la validación de permisos.
- El RBAC real ocurre en tRPC.

---

## 8) Estructura de carpetas (definitiva)

```text
src/
├── app/                          # SOLO routing (Next App Router)
│   ├── (public)/                 # Web institucional
│   ├── (admin)/                  # Intranet
│   ├── api/
│   │   └── trpc/[trpc]/route.ts  # Handler tRPC
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
│
├── proxy.tsx                     # Next 16 network boundary
│
├── modules/                      # Feature-driven (todo lo demás)
│   ├── shared/                   # Compartido entre features
│   │   ├── ui/                   # Atoms / Molecules / Organisms
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── validators/
│   │   ├── styles/
│   │   └── config/
│   │
│   ├── core/                     # Infraestructura
│   │   ├── trpc/                 # client / server / context / router
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
│   │   ├── pages/
│   │   └── navigation/
│   │
│   ├── news/                     # Feature dominio
│   │   ├── components/
│   │   ├── hooks/
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
├── env.mjs                       # Validación de env vars
└── next.config.mjs
