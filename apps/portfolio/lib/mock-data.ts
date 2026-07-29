import type { Profile, Project, Skill } from './types';

/**
 * Development fixtures.
 *
 * These objects match the interfaces in `lib/types.ts` exactly, which is the
 * whole point of them: the UI can be built, reviewed and screenshotted before
 * the API exists, and when the API arrives nothing in `/components` changes —
 * only the branch in `lib/api.ts` that decides where data comes from.
 *
 * This module is imported by `lib/api.ts` and by nothing else. A component that
 * imports it directly has hardcoded its content, which is the failure mode the
 * data contract exists to prevent.
 *
 * The copy below is placeholder text with realistic shape (real dates, real
 * tech stacks, a mix of statuses). Replace it by pointing `NEXT_PUBLIC_API_URL`
 * at the live API — not by editing this file.
 */

export const mockProfile: Profile = {
  fullName: 'Shariif Ahmed',
  role: 'Full-stack engineer — backend & internal systems',
  statusLine: 'BUILDING SARIF V2',
  bio: [
    // The first sentence is kept under ~180 characters on purpose: the hero and
    // the page description both render `firstSentence(bio)`, and a longer
    // opening would arrive truncated in both.
    'I build the parts of a product that nobody photographs: the ledger that has to balance, and the admin console the operations team lives in all day. None of it has a marketing screenshot, and all of it stops the company when it breaks.',
    'For the last three years that has meant a cross-border remittance platform — payout rails across four corridors, a compliance queue, and the internal tooling that keeps both honest. Money movement is unforgiving about correctness, and it taught me to prefer boring, observable systems over clever ones.',
    'I work in TypeScript end to end: NestJS and PostgreSQL on the server, Next.js where a person has to see something. I care about the seam between them — typed contracts, migrations that run twice safely, and errors that say what went wrong instead of "something went wrong".',
  ].join('\n\n'),
  resumeUrl: '/resume.pdf',
  email: 'hello@shariif.dev',
  location: 'Nairobi, Kenya · GMT+3',
  githubUrl: 'https://github.com/suldaaahmed',
  linkedinUrl: 'https://www.linkedin.com/in/shariif-ahmed',
  // Deliberately relative to "now" so the status bar shows a plausible
  // "Nh ago" whenever a developer opens the app, instead of a stale date.
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
};

export const mockProjects: Project[] = [
  {
    id: 'prj_sarif_v2',
    title: 'Sarif V2 — remittance core',
    slug: 'sarif-v2',
    summary: 'Double-entry ledger and payout orchestration for a four-corridor remittance platform.',
    description:
      'A rewrite of the transaction core behind a cross-border remittance product. Every movement of money is a pair of ledger entries that must balance, so the service is built around an append-only journal: nothing is ever updated in place, and a balance is a projection rather than a column. Payout providers sit behind one adapter interface with per-corridor retry and reconciliation, which meant adding a fourth corridor took a config change and an adapter rather than a release. Idempotency keys on every write make a retried request safe by construction — the operational lesson from V1, where a duplicated webhook could pay twice.',
    techStack: ['NestJS', 'PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Docker'],
    status: 'IN_PROGRESS',
    liveUrl: 'https://sarif.example.com',
    startedAt: '2025-11-04',
    featured: true,
  },
  {
    id: 'prj_ops_console',
    title: 'Operations console',
    slug: 'operations-console',
    summary: 'Internal admin for compliance review, payout retries and customer support.',
    description:
      'The screen the operations team actually works in: a compliance queue with an audit trail, manual payout retry with a reason code attached to every action, and customer lookup that joins six services without making the operator open six tabs. Permissions are checked per resource and per action rather than per role, so granting a new analyst read-only access to the queue does not require inventing a role. Every mutation writes an audit row with the actor, the before state and the redacted payload — the difference between "the payout was retried" and "we think someone retried it".',
    techStack: ['Next.js', 'TypeScript', 'TanStack Query', 'Tailwind CSS', 'RBAC'],
    status: 'LIVE',
    startedAt: '2025-03-18',
    featured: true,
  },
  {
    id: 'prj_ledger_recon',
    title: 'Reconciliation service',
    slug: 'reconciliation-service',
    summary: 'Nightly three-way match between the internal ledger, bank statements and provider reports.',
    description:
      'A scheduled worker that pulls provider settlement files and bank statements, normalises three incompatible formats, and matches them against the internal journal. Anything that fails to match becomes a break with a category attached — timing, amount, missing, duplicate — rather than a line in a log nobody reads. Breaks surface in the operations console the same morning, which turned month-end reconciliation from a two-day exercise into a queue that is usually empty by 09:00.',
    techStack: ['Node.js', 'PostgreSQL', 'BullMQ', 'S3', 'CSV/MT940'],
    status: 'LIVE',
    repoUrl: 'https://github.com/suldaaahmed/reconciliation-service',
    startedAt: '2024-09-02',
    featured: true,
  },
  {
    id: 'prj_rates_api',
    title: 'FX rate service',
    slug: 'fx-rate-service',
    summary: 'Rate aggregation with per-corridor margin, quote locking and a full price history.',
    description:
      'Aggregates rates from three upstream providers, applies a per-corridor margin, and issues quotes that are locked for a fixed window so the price a customer sees is the price they get. Every quote is stored with the upstream rate and margin that produced it, which makes a pricing dispute a query rather than an argument. Falls back to the last known good rate with a widened spread when an upstream provider is unreachable, instead of failing the transaction.',
    techStack: ['NestJS', 'Redis', 'PostgreSQL', 'OpenAPI'],
    status: 'LIVE',
    startedAt: '2024-04-15',
    featured: false,
  },
  {
    id: 'prj_kyc_pipeline',
    title: 'KYC document pipeline',
    slug: 'kyc-document-pipeline',
    summary: 'Document intake, OCR extraction and a reviewer queue for identity verification.',
    description:
      'Handles identity document upload, runs OCR extraction, and routes anything below a confidence threshold to a human reviewer rather than auto-approving it. Documents are encrypted at rest with per-record keys and expire on a retention schedule, because holding a passport scan longer than the policy allows is a liability rather than a feature. The reviewer queue was built to be boring: one decision per screen, keyboard-driven, with the extracted fields beside the image.',
    techStack: ['Node.js', 'Tesseract', 'PostgreSQL', 'AWS KMS'],
    status: 'ARCHIVED',
    startedAt: '2023-08-21',
    featured: false,
  },
  {
    id: 'prj_status_page',
    title: 'Corridor status page',
    slug: 'corridor-status-page',
    summary: 'Public uptime and payout-latency board, generated from real settlement data.',
    description:
      'A small public page showing, per corridor, whether payouts are flowing and how long they are currently taking — computed from actual settlement timestamps rather than from a synthetic ping. Support stopped answering "is Somalia down?" by hand. Statically regenerated every minute, so it stays up even when the thing it reports on does not.',
    techStack: ['Next.js', 'PostgreSQL', 'Vercel'],
    status: 'LIVE',
    liveUrl: 'https://status.example.com',
    repoUrl: 'https://github.com/suldaaahmed/corridor-status',
    startedAt: '2023-02-06',
    featured: false,
  },
];

export const mockSkills: Skill[] = [
  // Frontend
  { id: 'skl_next', name: 'Next.js', category: 'Frontend', order: 0 },
  { id: 'skl_react', name: 'React', category: 'Frontend', order: 1 },
  { id: 'skl_ts_fe', name: 'TypeScript', category: 'Frontend', order: 2 },
  { id: 'skl_tailwind', name: 'Tailwind CSS', category: 'Frontend', order: 3 },
  { id: 'skl_tanstack', name: 'TanStack Query', category: 'Frontend', order: 4 },
  { id: 'skl_a11y', name: 'Accessibility (WCAG AA)', category: 'Frontend', order: 5 },

  // Backend
  { id: 'skl_nest', name: 'NestJS', category: 'Backend', order: 0 },
  { id: 'skl_node', name: 'Node.js', category: 'Backend', order: 1 },
  { id: 'skl_pg', name: 'PostgreSQL', category: 'Backend', order: 2 },
  { id: 'skl_prisma', name: 'Prisma', category: 'Backend', order: 3 },
  { id: 'skl_redis', name: 'Redis', category: 'Backend', order: 4 },
  { id: 'skl_queues', name: 'Queues & workers', category: 'Backend', order: 5 },
  { id: 'skl_rest', name: 'REST / OpenAPI', category: 'Backend', order: 6 },

  // Infra
  { id: 'skl_docker', name: 'Docker', category: 'Infra', order: 0 },
  { id: 'skl_gha', name: 'GitHub Actions', category: 'Infra', order: 1 },
  { id: 'skl_nginx', name: 'Nginx', category: 'Infra', order: 2 },
  { id: 'skl_aws', name: 'AWS (ECS, S3, KMS)', category: 'Infra', order: 3 },
  { id: 'skl_obs', name: 'Observability', category: 'Infra', order: 4 },

  // Tools
  { id: 'skl_git', name: 'Git', category: 'Tools', order: 0 },
  { id: 'skl_jest', name: 'Jest / Playwright', category: 'Tools', order: 1 },
  { id: 'skl_figma', name: 'Figma', category: 'Tools', order: 2 },
  { id: 'skl_linear', name: 'Linear', category: 'Tools', order: 3 },
];
