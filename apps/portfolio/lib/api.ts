import { cache } from 'react';
import { mockProfile, mockProjects, mockSkills } from './mock-data';
import type { HomePageData, Profile, Project, Skill } from './types';
import { sortByStartedAtDesc } from './utils';

/**
 * The data layer. Every page and component reads content through these
 * functions and through nothing else.
 *
 * Two sources sit behind one interface:
 *
 *   - the REST API, when `NEXT_PUBLIC_API_URL` is set;
 *   - `lib/mock-data.ts`, when it is not.
 *
 * That switch is the reason the component layer never has to change when the
 * backend goes live. It also means `npm run build` works on a laptop or in CI
 * with no API running, and the fixtures stay honest — they are exercised by the
 * same code path the real data will take, so a shape mismatch shows up here
 * rather than in production.
 *
 * Every read is wrapped in React's `cache()`, which deduplicates calls within a
 * single render pass: the home page asks for the profile in the layout, the
 * hero and the footer, and one request is made.
 */

/** Trailing slash removed so path joining never produces a double slash. */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

/** True when the app should talk to the network instead of reading fixtures. */
export const isLiveApi = API_BASE_URL.length > 0;

/**
 * How long a fetched response stays fresh, in seconds.
 *
 * The brief's requirement is that content edited in the admin panel appears
 * without a redeploy; a 60-second window does that while keeping the pages
 * statically served for almost every visitor.
 */
const REVALIDATE_SECONDS = 60;

/** Raised when the API is reachable but does not answer usefully. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Typed `fetch` wrapper.
 *
 * `tags` are attached so a webhook from the CMS can invalidate exactly the
 * affected pages with `revalidateTag('projects')` rather than rebuilding the
 * site. The generic is an assertion, not a validation: the API is the same
 * codebase and its DTOs generate the contract these types mirror, so runtime
 * re-parsing on every request would cost more than it catches.
 */
async function apiGet<T>(path: string, tags: string[]): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags },
    });
  } catch (error) {
    // A DNS failure, a refused connection, a timeout — never a `Response`.
    throw new ApiError(
      `Could not reach the content API (${(error as Error).message})`,
      503,
      path,
    );
  }

  if (!response.ok) {
    throw new ApiError(`The content API answered ${response.status}`, response.status, path);
  }

  return (await response.json()) as T;
}

/**
 * Runs the live request, falling back to fixtures if it fails.
 *
 * A portfolio that returns a 500 because its CMS is briefly down is worse than
 * one showing slightly stale content, so a failed read degrades rather than
 * throws. The warning is deliberate: silent fallback would hide a broken
 * deployment behind a page that looks fine.
 */
async function withFallback<T>(fetcher: () => Promise<T>, fallback: T, label: string): Promise<T> {
  if (!isLiveApi) return fallback;

  try {
    return await fetcher();
  } catch (error) {
    console.warn(`[api] ${label} failed, serving fixture data:`, (error as Error).message);
    return fallback;
  }
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export const getProfile = cache(
  async (): Promise<Profile> =>
    withFallback(() => apiGet<Profile>('/profile', ['profile']), mockProfile, 'getProfile'),
);

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

/** All projects, newest first. Sorting is applied here so no page repeats it. */
export const getProjects = cache(async (): Promise<Project[]> => {
  const projects = await withFallback(
    () => apiGet<Project[]>('/projects', ['projects']),
    mockProjects,
    'getProjects',
  );
  return sortByStartedAtDesc(projects);
});

/**
 * The home page ledger: featured entries only, newest first.
 *
 * Filtering client-side rather than requesting `/projects?featured=true` keeps
 * one cache entry for the project list, so the home page and `/projects` share
 * a single fetch instead of holding two near-identical copies.
 */
export const getFeaturedProjects = cache(async (limit = 4): Promise<Project[]> => {
  const projects = await getProjects();
  return projects.filter((project) => project.featured).slice(0, limit);
});

/** A single project, or `null` when the slug does not exist — `/projects/[slug]` turns that into a 404. */
export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
});

/** Slugs for `generateStaticParams`, so every detail page is prerendered. */
export async function getProjectSlugs(): Promise<string[]> {
  const projects = await getProjects();
  return projects.map((project) => project.slug);
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

/** All skills, pre-sorted by the `order` field the CMS controls. */
export const getSkills = cache(async (): Promise<Skill[]> => {
  const skills = await withFallback(
    () => apiGet<Skill[]>('/skills', ['skills']),
    mockSkills,
    'getSkills',
  );
  return [...skills].sort((a, b) => a.order - b.order);
});

/* -------------------------------------------------------------------------- */
/* Composite reads                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Everything the home page renders, fetched concurrently.
 *
 * Awaiting these in sequence inside the page component would serialise three
 * round trips for no reason; `Promise.all` makes the page's time-to-first-byte
 * the slowest single request rather than the sum of all three.
 */
export async function getHomePageData(): Promise<HomePageData> {
  const [profile, featuredProjects, skills] = await Promise.all([
    getProfile(),
    getFeaturedProjects(),
    getSkills(),
  ]);

  return { profile, featuredProjects, skills };
}
