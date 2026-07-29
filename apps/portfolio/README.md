# Ledger — portfolio front end

A redesign of the public portfolio, built as its own Next.js app so it can be
developed and reviewed without touching `apps/web`. Same monorepo, same API, a
different front door.

The design system is called **Ledger / System Log**. The subject builds
backend and admin systems for a cross-border remittance platform, so the site is
shaped like the things he works on: an ordered list of entries with an index, a
status, and a timestamp — a ledger, not a gallery of cards.

```bash
npm run dev:portfolio      # http://localhost:3001
```

It runs with no backend. When `NEXT_PUBLIC_API_URL` is unset the data layer
serves `lib/mock-data.ts`, so `npm run build` works on a laptop and in CI with
nothing else running.

---

## The three rules the code is built around

**1. Nothing about a project, skill or profile is written in a component.**
Every string a visitor reads comes from `lib/api.ts`, which returns the types in
`lib/types.ts`. A component that imports `mock-data.ts` directly has hardcoded
its content; nothing does.

**2. Every colour, size and radius routes through `tailwind.config.ts`.**
There are no arbitrary colour values (`bg-[#131820]`) anywhere in `app/` or
`components/`. If a token is missing it gets added to the config, which is a
decision made in one file rather than an accident made in a JSX file.

**3. There is one animation.** A staggered fade-and-rise on page load, covering
the hero and the first three ledger rows. Hover and focus are CSS transitions.
No scroll effects, no parallax, no canvas.

---

## Layout

```
app/
  layout.tsx              Shell: Nav + StatusBar + Footer, one profile fetch
  page.tsx                Home — hero, featured ledger, skills, about, contact
  projects/
    page.tsx              Full ledger, filterable
    [slug]/page.tsx       Project detail (prerendered per project)
  about/page.tsx          Full bio, résumé, socials
  api/contact/route.ts    POST target for the contact form
  error.tsx               Route error boundary
  not-found.tsx           404
  icon.svg                Favicon (App Router convention)
  robots.ts / sitemap.ts  Generated from the project list

components/
  Nav.tsx                 Route links, active state, mobile menu
  StatusBar.tsx           Status line + relative "last updated", client-side
  Hero.tsx                Name, role, pitch, two CTAs — origin of the stagger
  LedgerSection.tsx       Section heading + the row list; stagger parent
  LedgerRow.tsx           One entry. Accordion or link, chosen by the caller
  SkillsManifest.tsx      Four columns, one per layer of the stack
  AboutExcerpt.tsx        Home-page bio block
  ContactForm.tsx         RHF + Zod, inline errors, pending and success states
  Footer.tsx              Socials, copyright, built-with note
  SectionHeader.tsx       Shared heading (index / title / description / action)
  StatusBadge.tsx         LIVE · IN PROGRESS · ARCHIVED
  ProjectLedger.tsx       Client-side tag + status filtering for /projects
  Button.tsx              The two button treatments, defined once
  BrandIcons.tsx          GitHub and LinkedIn marks
  MotionProvider.tsx      MotionConfig reducedMotion="user"

lib/
  types.ts                The data contract — mirrors the backend models
  api.ts                  Typed fetch wrappers, cached, with fixture fallback
  mock-data.ts            Fixtures matching types.ts exactly
  utils.ts                cn, date formatting, relative time, excerpting
  status.ts               Status → label + Tailwind classes, in one place
  motion.ts               The entire motion vocabulary
  contact-schema.ts       Zod schema shared by the form and the route handler
  fonts.ts                next/font declarations → CSS variables

styles/globals.css        Document defaults, skip link, ledger rail, RM fallback
tailwind.config.ts        Design tokens + the .focus-ring component plugin
```

---

## Design tokens

Defined in `tailwind.config.ts`. Nothing else declares a colour.

| Token | Value | Used for |
| --- | --- | --- |
| `ink` | `#0B0E11` | Page background |
| `surface` | `#131820` | Rows, cards, form fields |
| `border` | `#232B35` | Every divider — there are no shadows |
| `text-primary` | `#EDEFF2` | Headings and body |
| `text-muted` | `#8A94A3` | Secondary copy, labels |
| `accent-amber` | `#E8A33D` | Primary CTA, focus ring, live dot |
| `accent-blue` | `#4C8DB5` | Links and data points only |
| `status-live` / `-progress` / `-archived` | `#4ADE80` / `#E8A33D` / `#5A6472` | Status badges |

Type is three roles: `font-display` (IBM Plex Mono — headings, labels, nav),
`font-body` (Inter — prose), `font-mono` (IBM Plex Mono — tags, timestamps,
figures). Radii stop at 2px.

---

## Accessibility

Verified in a headless browser, not assumed:

- The skip link is the first focusable element on every route.
- `.focus-ring` is a Tailwind plugin component applied to every interactive
  element, so the ring cannot drift between a button and a ledger row.
- Ledger rows expand on Enter **and** Space, because the trigger is a real
  `<button>`, wired to its panel with `aria-expanded` + `aria-controls`.
- Status is never carried by colour alone — every badge spells out its label.
- `prefers-reduced-motion` drops the slide and keeps opacity, handled once in
  `MotionProvider` for Framer and once in `globals.css` for CSS.
- All body and label text meets WCAG AA against `ink` and `surface`. One
  exception is documented at its source: `status.archived` measures 3.2:1, so
  the `ARCHIVED` badge draws its label in `text.muted` while the dot and border
  keep the archived colour (`lib/status.ts`).

---

## Going live against the real API

Set `NEXT_PUBLIC_API_URL` and nothing in `app/` or `components/` changes:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

The data layer then expects:

| Endpoint | Returns |
| --- | --- |
| `GET /profile` | `Profile` |
| `GET /projects` | `Project[]` |
| `GET /skills` | `Skill[]` |
| `POST /messages` | Accepts `{ name, email, subject?, message }` |

Responses are cached for 60 seconds and tagged (`profile`, `projects`,
`skills`), so a CMS webhook can call `revalidateTag` instead of triggering a
rebuild. If a request fails, the page serves fixtures and logs a warning rather
than returning a 500 — a portfolio showing slightly stale content beats one
showing an error page.

`POST /api/contact` is a route handler, not a direct call to the backend: it
keeps the API origin server-side, re-validates with the same Zod schema the form
uses, rate-limits by IP, and silently discards honeypot submissions.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev -w @aurora/portfolio` | Dev server on `:3001` |
| `npm run build -w @aurora/portfolio` | Production build |
| `npm run typecheck -w @aurora/portfolio` | `tsc --noEmit`, strict |
| `npm run lint -w @aurora/portfolio` | ESLint over `app`, `components`, `lib` |
