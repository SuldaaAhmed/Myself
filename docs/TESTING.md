# Testing strategy

## What is tested, and why there

The valuable tests here cover the code that everything else depends on — the
shared CRUD spine and the authorisation rules. A bug in either affects fourteen
collections at once, so that is where unit tests earn their keep.

| Layer | Tool | Covers |
| ----- | ---- | ------ |
| Unit | Jest | Query building, publish/draft visibility, sort allow-list, slug uniqueness, reading time, permission resolution |
| Contract | `tsc --noEmit` | DTOs, API response types and the admin registry stay in step |
| Build | `next build` | Every route renders, including with the API unavailable |
| End-to-end | Jest + supertest (`apps/api/test`) | Auth flow and resource lifecycle against a real database |

Run them:

```bash
npm run test          # unit tests
npm run typecheck     # both apps
npm run build         # API then website
npm run test:e2e -w @aurora/api   # needs DATABASE_URL pointing at a scratch database
```

## Current unit coverage

`apps/api/src/**/*.spec.ts` — 26 tests:

- **`crud.service.spec.ts`** — anonymous callers only ever see published records;
  `includeUnpublished` is ignored without permission; search builds a
  case-insensitive `OR`; category/tag/featured filters apply; sorting rejects
  fields outside the allow-list (the test asserts `passwordHash` is refused).
- **`permissions.guard.spec.ts`** — verb-to-action mapping (`POST` → write,
  `DELETE` → delete), explicit `@Permissions` overriding the resource default,
  wildcard expansion, anonymous denial.
- **`slug.spec.ts`** — slugification, collision suffixes, reading-time floor.

## Manual verification performed

The stack was run end to end against PostgreSQL and exercised with real requests:
login and cookie issuance, CSRF rejection of a cookie-authenticated write without
the header, draft creation hidden from the public list but visible to an admin,
publish stamping `publishedAt`, delete, contact-form validation, audit rows for
each mutation, analytics tracking and overview, refresh rotation plus refusal of a
replayed refresh token, and all 22 public routes returning 200 with CMS content
(plus `/admin` redirecting to the login page).

## Writing an e2e test

```ts
const app = await NestFactory.create(AppModule);          // or Test.createTestingModule
await app.get(PrismaService).truncateAll();               // reset between suites
await request(app.getHttpServer()).post('/api/v1/auth/login').send(credentials).expect(201);
```

`PrismaService.truncateAll()` exists for exactly this. Point `DATABASE_URL` at a
scratch database — it truncates every table.

## CI

`.github/workflows/ci.yml` runs three jobs on every push and pull request:

1. **api** — PostgreSQL and Redis services, `prisma generate`, `db push`,
   typecheck, unit tests, build.
2. **web** — typecheck and build with no API reachable, which proves the site's
   fallback behaviour still renders.
3. **docker** — both images build, with layer caching.

## Gaps worth closing next

- Browser tests (Playwright) for the dashboard's create → publish → view loop.
- e2e suites for media upload and the RBAC matrix.
- Accessibility assertions in CI (axe) — the components are keyboard- and
  screen-reader-oriented, but nothing enforces that yet.
