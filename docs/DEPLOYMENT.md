# Deployment

## Environment

One `.env` at the repository root feeds Nest, the Prisma CLI and docker compose.
Start from `.env.example`. The API validates its environment at boot and refuses
to start when something is missing or too weak — a misconfigured deploy fails
immediately instead of at the first request.

Must be set in production:

| Variable | Notes |
| -------- | ----- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ≥ 16 chars; use `openssl rand -base64 48` |
| `CORS_ORIGINS` | Comma-separated site origins — the API rejects everything else |
| `COOKIE_DOMAIN`, `COOKIE_SECURE=true` | Required for cross-subdomain cookies over HTTPS |
| `NEXT_PUBLIC_API_URL` | Browser-visible API base (baked into the web build) |
| `API_INTERNAL_URL` | Server-to-server base for SSR (e.g. `http://api:4000/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used in metadata and the sitemap |

Optional: `REDIS_URL` (falls back to an in-process cache),
`CLOUDINARY_*` (falls back to local disk uploads).

## Option 1 — Docker Compose (whole stack)

```bash
cp .env.example .env      # set the JWT secrets
npm run docker:up         # db, redis, api, web, nginx
open http://localhost:8080
```

The API container runs `prisma migrate deploy` on boot, so a fresh container
converges on the current schema. Seed once:

```bash
docker compose exec api npx prisma db seed --schema apps/api/prisma/schema.prisma
```

Behind Nginx: `/api/*` and `/uploads/*` go to the API, everything else to Next.js.
Terminate TLS at Nginx (or a load balancer) and set `COOKIE_SECURE=true`.

## Option 2 — Vercel (website) + container host (API)

1. **API** — deploy `apps/api/Dockerfile` to Fly.io, Railway, Render or ECS.
   Attach PostgreSQL and Redis, set the variables above, run
   `npx prisma migrate deploy` on release.
2. **Website** — import the repo on Vercel with root `apps/web`, build
   `npm run build`, and set `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`,
   `NEXT_PUBLIC_SITE_URL`.
3. Add the Vercel domain to `CORS_ORIGINS`, set `COOKIE_DOMAIN` to the shared
   parent domain and `COOKIE_SECURE=true`.

Cookies are `SameSite=None; Secure` when `COOKIE_SECURE=true`, so the dashboard
works when the site and API sit on different subdomains — they must both be HTTPS.

## Migrations

```bash
npm run db:migrate                  # development: create + apply
npm run prisma:deploy -w @aurora/api  # production: apply committed migrations
```

Migrations are committed under `apps/api/prisma/migrations`. Never edit an applied
migration; add a new one.

## Health, logs, backups

- `GET /api/v1/health` returns status, uptime and a database probe — wire it to
  your platform's health check (compose already does).
- Requests are logged with method, path, status and duration; errors carry stack
  traces. Ship stdout to your log aggregator.
- Back up PostgreSQL (`pg_dump`) on a schedule and test a restore. With Cloudinary
  the media library is backed up for you; with local disk, snapshot the `uploads`
  volume too.
- Expired and long-revoked refresh tokens are pruned nightly by a cron job in the
  API.

## Post-deploy checklist

- [ ] Sign in and change the seeded password
- [ ] Create per-person accounts; keep `owner` for yourself, give others `editor`
- [ ] Set `identity`, `hero`, `about`, `contact` and `social` in Site settings
- [ ] Add SEO records for `/`, `/projects`, `/blog`, `/contact`
- [ ] Replace the seeded demo content with real work
- [ ] Confirm `/sitemap.xml` and `/robots.txt`, then submit the sitemap
- [ ] Verify `/admin` is `noindex` and unreachable without a session
