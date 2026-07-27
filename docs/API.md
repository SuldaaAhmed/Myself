# REST API

Base URL `http://localhost:4000/api/v1`. Interactive docs at `/api/docs`, raw
OpenAPI at `/api/docs-json` (83 paths, generated from the DTOs).

## Authentication

Browser sessions use HTTP-only cookies; service clients may send
`Authorization: Bearer <access token>`.

| Endpoint | Purpose |
| -------- | ------- |
| `POST /auth/login` | Sets `access_token` (15 min), `refresh_token` (30 d) and a readable `csrf_token`; returns the session profile |
| `POST /auth/refresh` | Rotates the refresh token and reissues the access token |
| `POST /auth/logout` | Revokes the refresh token and clears cookies |
| `GET /auth/me` | Current profile with resolved permissions |
| `PATCH /auth/me` | Update your own name, job title, avatar |
| `POST /auth/change-password` | Change password; revokes every session |

Refresh tokens are stored hashed and rotate on every use. Presenting a token that
has already been used is treated as theft: every session for that user is revoked.

**CSRF** — mutating requests authenticated by cookie must echo the `csrf_token`
cookie in an `x-csrf-token` header. Bearer clients are exempt because their
credential is never sent ambiently. The browser client does this automatically.

## Shared resource surface

`projects`, `case-studies`, `services`, `skills`, `skill-groups`, `technologies`,
`experience`, `education`, `certificates`, `testimonials`, `blog`, `categories`,
`gallery`, `faq`:

| Method | Path | Auth |
| ------ | ---- | ---- |
| `GET` | `/<resource>` | Public (published only) |
| `GET` | `/<resource>/:idOrSlug` | Public |
| `POST` | `/<resource>` | `<resource>:write` |
| `PATCH` | `/<resource>/:id` | `<resource>:write` |
| `DELETE` | `/<resource>/:id` | `<resource>:delete` |
| `POST` | `/<resource>/reorder` | `<resource>:write` |

Query parameters on list endpoints:

| Param | Meaning |
| ----- | ------- |
| `page`, `limit` | Pagination (limit ≤ 100, default 12) |
| `q` | Free-text search across that resource's searchable columns |
| `sort` | `field:asc\|desc`, restricted to an allow-list per resource |
| `status` | Filter by content status (requires read permission) |
| `includeUnpublished` | Include drafts and archived records (requires read permission) |
| `category`, `tag`, `featured` | Where the resource supports them |

Responses are `{ data: [...], meta: { total, page, limit, pageCount, hasNextPage, hasPreviousPage } }`.

## Other endpoints

| Endpoint | Auth | Purpose |
| -------- | ---- | ------- |
| `GET /site/home` | Public | Every collection the home page needs, in one cached request |
| `GET /settings/public` | Public | Flat map of website-visible settings |
| `GET /settings`, `PUT /settings/:key`, `DELETE /settings/:key` | `settings:*` | Manage settings documents |
| `GET /seo`, `GET /seo?path=`, `PUT /seo`, `DELETE /seo?path=` | public read / `seo:write` | Per-route metadata |
| `GET /seo/sitemap` | Public | Canonical URLs for `sitemap.xml` |
| `POST /messages` | Public, 5 per 10 min | Contact form (honeypot + validation) |
| `GET/PATCH/DELETE /messages/:id` | `messages:*` | Inbox management |
| `POST /analytics/track` | Public, 60/min | Anonymous page view |
| `GET /analytics/overview?days=`, `GET /analytics/top-content` | `analytics:read` | Dashboard metrics |
| `POST /media/upload`, `GET /media`, `DELETE /media/:id` | `media:*` | Media library |
| `GET/POST/PATCH/DELETE /users` | `users:*` | Dashboard accounts |
| `GET/POST/PATCH/DELETE /roles`, `GET /permissions` | `roles:*` | RBAC management |
| `GET /audit-log` | `audit:read` | Who changed what, when |
| `POST /blog/:slug/views` | Public | Read counter |
| `GET /health` | Public | Liveness + database probe |

## Permissions

Keys are `<resource>:<action>` with `action ∈ {read, write, delete}`. `*` grants
everything (the `owner` role); `<resource>:*` grants every action on one resource.
Seeded roles:

- **owner** — `*`
- **editor** — read + write on every content resource, no user or role management
- **viewer** — read on everything

## Errors

```json
{
  "statusCode": 409,
  "code": "DUPLICATE_VALUE",
  "message": "A record with this slug already exists.",
  "path": "/api/v1/projects",
  "timestamp": "2026-07-27T12:00:00.000Z"
}
```

Validation failures return `400` with `message` as an array of field messages.
Unknown properties are rejected rather than ignored (`forbidNonWhitelisted`).

## Rate limits

Global 120 requests/minute per IP. Tighter where it matters: login 8/min,
refresh 30/min, contact form 5 per 10 minutes, analytics 60/min.
