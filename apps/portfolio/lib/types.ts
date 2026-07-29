/**
 * The data contract between this front end and the portfolio API.
 *
 * These interfaces are the *only* description of content in the app. No
 * component invents a field, and no component hardcodes a value that belongs to
 * a profile, a project or a skill. When the backend schema changes, it changes
 * here first and TypeScript points at every call site that has to follow.
 *
 * Everything is serialised JSON, so dates are ISO strings rather than `Date`
 * objects — they cross the server/client boundary and `Date` does not survive
 * that trip intact.
 */

/** The single profile record that drives the hero, status bar, about page and footer. */
export interface Profile {
  fullName: string;
  role: string;
  /** Short, present-tense sentence shown in the status bar. Editorial, not computed. */
  statusLine: string;
  /** Full biography. The home page shows an excerpt; `/about` shows all of it. */
  bio: string;
  resumeUrl?: string;
  avatarUrl?: string;
  email: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  /** ISO timestamp. The status bar renders this as a relative "2h ago". */
  updatedAt: string;
}

/** The four groups the skills manifest renders as columns, in display order. */
export const SKILL_CATEGORIES = ['Frontend', 'Backend', 'Infra', 'Tools'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** Sort key within a category. Lower comes first. */
  order: number;
}

/** Lifecycle of a project. Drives the badge colour via `lib/status.ts`. */
export type ProjectStatus = 'LIVE' | 'IN_PROGRESS' | 'ARCHIVED';

export interface Project {
  id: string;
  title: string;
  /** URL segment for `/projects/[slug]`. Unique. */
  slug: string;
  /** One line. Shown in the ledger row, collapsed. */
  summary: string;
  /** Full prose. Shown when a row expands, and on the detail page. */
  description: string;
  techStack: string[];
  status: ProjectStatus;
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  /** ISO date. Rendered as the ledger entry ID, `YYYY.MM`. */
  startedAt: string;
  /** Whether the project appears in the home page's featured ledger. */
  featured: boolean;
}

/**
 * The contact form payload. Defined here rather than inside the form component
 * so the Zod schema (`lib/contact-schema.ts`), the route handler and the form
 * are all checked against one shape.
 */
export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

/**
 * Everything the home page needs, resolved in one place so the page component
 * does not fan out into four separate awaits inline.
 */
export interface HomePageData {
  profile: Profile;
  featuredProjects: Project[];
  skills: Skill[];
}
