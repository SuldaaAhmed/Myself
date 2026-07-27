# Content model & CMS workflow

Schema: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).

## Collections

| Model | Powers | Notes |
| ----- | ------ | ----- |
| `Project` | `/projects`, home grid | Slug, markdown body, gallery, impact metrics, category, technologies (m2m), view counter |
| `CaseStudy` | `/case-studies` | Context → problem → approach → outcome, metrics, optional 1:1 link to a project |
| `Service` | `/services` | Feature list, price-from label, icon name |
| `SkillGroup` → `Skill` | `/skills`, home | Grouped, 0–100 level, years of practice |
| `Technology` | `/technologies`, marquee | Group (frontend/backend/…), brand colour, level |
| `Experience` | `/experience`, `/resume` | Date range, `current` flag, highlights, stack |
| `Education` | `/education`, `/resume` | Institution, degree, grade |
| `Certificate` | `/certificates`, `/resume` | Issuer, issued/expiry dates, verification URL |
| `Testimonial` | `/testimonials`, home | Quote, rating, featured flag |
| `Post` | `/blog` | Excerpt, markdown, tags, reading time (computed), views |
| `GalleryItem` | `/gallery` | Album, tags, dimensions |
| `Faq` | `/faq`, `/contact` | Grouped by category, emitted as `FAQPage` JSON-LD |
| `Category` | filters | Shared by projects and posts |
| `Message` | `/admin/messages` | Contact submissions with status and internal notes |
| `Media` | media library | Cloudinary or local disk, with dimensions and owner |
| `Setting` | every page | JSON documents: hero, about, contact, social, theme, resume, navigation, identity |
| `SeoMeta` | metadata | Per-route title, description, keywords, OG image, `noIndex` |
| `Visitor`, `PageView` | analytics | Anonymous, salted-hash visitor id |
| `User`, `Role`, `Permission`, `RefreshToken`, `AuditLog` | access control | RBAC and session state |

## Publishing

Content models carry `status` (`DRAFT` / `PUBLISHED` / `ARCHIVED`):

- Public endpoints return published records only.
- Editors reading the same endpoint with `?includeUnpublished=true` see everything —
  the API checks for the `<resource>:read` permission before honouring it.
- `publishedAt` is stamped the first time a record becomes published and then left
  alone, so re-editing does not reorder a blog archive.

## Ordering

Most collections have `order` (ascending). `POST /<resource>/reorder` with
`{ ids: [...] }` writes a whole new ordering in one transaction.

## Slugs

Derived from the title (or name/question/degree) on create, made unique with a
`-2`, `-3` suffix, and never regenerated afterwards — a published URL keeps working
after a title edit. Detail endpoints accept either an id or a slug.

## Settings documents

Free-form JSON keyed by name, grouped for the dashboard tabs. `GET /settings/public`
returns a flat map of the website-visible groups, which is what the layout, hero,
footer, contact page and theme read. `SETTINGS_FORMS` in the admin registry
describes the fields for each document, so the shape stays predictable while
remaining schema-less in the database.

Seeded documents: `identity`, `hero`, `about`, `contact`, `social`, `theme`,
`resume`, `navigation`.

## Theme control

The `theme` document drives the site's default mode (dark, light, or follow the
visitor's system), the accent colours and the ambient effects. Colour values are
validated against a colour-literal pattern before being injected as CSS custom
properties — a CMS field cannot smuggle arbitrary CSS into the page.

## SEO

`SeoMeta` rows override the per-page defaults for title, description, keywords,
canonical URL, social image and indexing. Pages fall back to their own copy when no
row exists, so the site is never missing metadata. `GET /seo/sitemap` returns every
canonical URL including dynamic slugs, which `app/sitemap.ts` renders.

## Media

Uploads go to Cloudinary when it is configured and to local disk otherwise; the same
`Media` row shape is returned either way. Type and size are validated server-side
(images and PDFs, 8 MB), and image dimensions are read with sharp. Deleting a row
removes the blob on a best-effort basis — a missing file never blocks the delete.
