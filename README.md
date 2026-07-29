# Aurora — Enterprise Portfolio Platform

A production-shaped portfolio system: a public website, an admin CMS, a versioned
REST API, PostgreSQL, role-based access control and first-party analytics. Every
page of the website is edited from the dashboard — no redeploy, no code change.

| Layer     | Stack |
| --------- | ----- |
| Website   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Dashboard | Same app under `/admin` — TanStack Query, React Hook Form, Zod, Radix UI |
| Portfolio | `apps/portfolio` — a second front end on the same API ("Ledger" redesign) |
| API       | NestJS 11, Prisma 6, PostgreSQL, JWT + refresh rotation, RBAC, Swagger, Redis cache |
| Ops       | Docker, Nginx, GitHub Actions |

## Quick start

```bash
cp .env.example .env          # then set the two JWT secrets
npm install
npm run db:migrate            # create the schema
npm run db:seed               # owner account + demo content
npm run dev:api               # http://localhost:4000/api/v1  (docs at /api/docs)
npm run dev:web               # http://localhost:3000         (dashboard at /admin)
```

Sign in at `/admin/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and
change that password immediately.

Prefer containers:

```bash
npm run docker:up             # db, redis, api, web, nginx → http://localhost:8080
```

## What is included

**Public website** — Home, About, Services, Skills, Technologies, Experience,
Education, Projects (+ detail), Case studies (+ detail), Certificates,
Testimonials, Blog (+ detail), Gallery, Résumé, FAQ, Contact. Every page is
server-rendered from the API with tag-based caching, per-route SEO metadata from
the CMS, JSON-LD where it helps, and a generated `sitemap.xml` and `robots.txt`.

**Admin dashboard** — Dashboard, Analytics, Messages, 14 content collections,
Media library, Site settings, SEO, Users, Roles & permissions, Audit log. Tables
and forms are generated from one registry (`apps/web/src/lib/admin/resources.ts`),
so a new field is a one-line change rather than a new screen.

**API** — 80+ endpoints sharing one CRUD surface per resource (list, detail,
create, update, delete, reorder) with pagination, search, sort allow-lists,
draft/publish, cache invalidation and audit rows. OpenAPI is generated from the
DTOs.

**Security** — bcrypt password hashing, short-lived access tokens in HTTP-only
cookies, refresh-token rotation with reuse detection, double-submit CSRF,
fine-grained `resource:action` permissions, Helmet headers, rate limiting,
parameterised queries through Prisma, and audit logging with redacted payloads.

## Repository layout

```
apps/
  api/            NestJS REST API + Prisma schema, migrations and seed
    src/common/   Cross-cutting: CRUD base classes, guards, cache, filters
    src/modules/  Feature modules; content/*.resource.ts is one file per collection
  web/            Next.js website (route group "(site)") and dashboard ("/admin")
    src/lib/      API clients, admin registry, hooks
  portfolio/      "Ledger" portfolio front end — Next.js + Tailwind design tokens
                  Runs on :3001, reads the same API, falls back to fixtures
docs/             Architecture, deployment, testing, API and content model
infra/nginx/      Reverse proxy configuration
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit and why
- [docs/CONTENT-MODEL.md](docs/CONTENT-MODEL.md) — data model and CMS workflow
- [docs/API.md](docs/API.md) — endpoints, auth flow, permissions
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Docker, Vercel, environment, backups
- [docs/TESTING.md](docs/TESTING.md) — test strategy and what runs in CI

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev:web` / `dev:api` / `dev:portfolio` | Start one app in watch mode |
| `npm run build` | Build API then website |
| `npm run typecheck` | `tsc --noEmit` across both apps |
| `npm run test` | Jest unit tests (API) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma workflows |
| `npm run docker:up` / `docker:down` | Full stack in containers |
