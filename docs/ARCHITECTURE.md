# Architecture

## Shape of the system

```
Visitor ─▶ Nginx ─┬─▶ Next.js (SSR + ISR)  ──fetch──▶ NestJS API ──▶ PostgreSQL
                  │        · public site                   · REST /api/v1        · Prisma
                  │        · /admin dashboard              · JWT + RBAC
                  └─▶ /api, /uploads ────────────────▶ NestJS API ──▶ Redis (cache)
```

Two deployable apps in one npm workspace. They share nothing at runtime except the
HTTP contract, which is what allows the site to be hosted on Vercel while the API
runs anywhere with a database.

## Why the website reads through the API

Rendering the site straight from Prisma would be faster to write and worse to
live with: the CMS, a future mobile app and any integration would each need their
own data access. Instead the API is the single source of truth, and the website is
one of its clients:

- `apps/web/src/lib/api/server.ts` — server-side reads with `next: { tags }` so a
  publish invalidates exactly the affected pages.
- `apps/web/src/lib/api/client.ts` — browser client for the dashboard: cookies,
  CSRF header, single-flight token refresh on 401.

## The CRUD spine

Fourteen collections behave identically: paginate, search, sort, publish, order,
invalidate cache, write an audit row. That behaviour is written once:

- `common/crud/crud.service.ts` — query building, slug generation, publish
  stamping, cache invalidation, reordering. Resources pass a small options object
  (`model`, `searchFields`, `sortableFields`, `hasStatus`, …) and override
  `beforeWrite` when they need to map relations.
- `common/crud/crud.controller.ts` — the REST surface, generic over its DTO types.
  Resource controllers extend it and re-declare `create`/`update` with typed DTOs,
  which is what gives per-resource schemas in the OpenAPI document.

Each collection lives in a single vertical slice — `modules/content/<name>.resource.ts`
holds its DTOs, service and controller. One file to open when a resource changes,
and no eleven-file ceremony to add one.

## Authorisation

`@Resource('projects')` on a controller declares ownership. From that,
`PermissionsGuard` derives what each verb needs: reads are public, `POST`/`PATCH`
require `projects:write`, `DELETE` requires `projects:delete`. `@Permissions(...)`
overrides it for endpoints that are not plain CRUD. Permissions resolve from
roles at login and travel in the access token, so authorisation costs no query.

Guards run globally in this order: rate limit → JWT → CSRF → permissions.
`@Public()` marks a route as reachable without a token, but still populates
`request.user` when one is present — which is how `/projects` serves published
records to visitors and drafts to editors from the same endpoint.

## Caching

`common/cache/cache.service.ts` wraps cache-manager with resource tags. Anonymous,
published reads are cached; authenticated reads are not (an editor must always see
what they just saved). A mutation invalidates every key tagged with that resource.
The tag index lives in the cache itself, so the same code works against the
in-memory store in development and Redis in production.

Two caches sit in front of the database: Redis in the API (seconds to minutes) and
Next.js's tag-based data cache (`revalidate` per page). Publishing invalidates the
first immediately; the second expires within its revalidation window.

## Data-driven dashboard

`apps/web/src/lib/admin/resources.ts` describes every collection: columns for the
table, fields for the form, which permission gates it. `/admin/[resource]`,
`/admin/[resource]/new` and `/admin/[resource]/[id]` render from those definitions,
and `SETTINGS_FORMS` does the same for the JSON settings documents. Adding a field
to the CMS is a line in the registry plus a column in Prisma.

## Rendering strategy

| Route | Strategy |
| ----- | -------- |
| `/`, most static pages | Prerendered, revalidated on an interval (1–2 min) |
| `/projects`, `/blog` | Server-rendered per request (filters and pagination live in the URL) |
| `/projects/[slug]`, `/blog/[slug]`, `/case-studies/[slug]` | Server-rendered, cached by tag |
| `/admin/*` | Client-rendered behind a proxy check, `noindex` |
| `sitemap.xml`, `robots.txt` | Generated from the API |

## Failure behaviour

The website degrades instead of breaking. `apiGetSafe` returns an empty
collection when the API is unreachable and logs in development, so a single
unavailable resource cannot blank the page — sections with no data simply do not
render. `AllExceptionsFilter` gives every API error one shape
(`statusCode`, `code`, `message`, `path`, `timestamp`), and Prisma errors are
mapped to meaningful HTTP codes (`P2002` → 409, `P2025` → 404).

## Deliberate limits

- **Markdown, not a block editor.** `renderMarkdown` covers headings, lists,
  emphasis, code and links, and escapes everything before formatting. A block
  editor is a product in itself; this stays a portfolio.
- **In-app analytics, not a product.** Enough to answer "what is being read" —
  salted-hash visitor ids, no cookie, bots dropped.
- **No email delivery.** Contact messages land in the dashboard inbox; wiring a
  provider is a single service away, and the inbox never bounces.
