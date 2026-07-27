import 'server-only';
import type { Paginated } from './types';

const BASE_URL = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1'
).replace(/\/$/, '');

export interface FetchOptions {
  /** Cache tags, so a CMS change can revalidate exactly the affected pages. */
  tags?: string[];
  revalidate?: number | false;
  query?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string, query?: FetchOptions['query']): string {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Server-side read against the API. Every public page renders from these calls,
 * cached by tag: publishing a project revalidates `projects` and nothing else.
 */
export async function apiGet<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { tags = [], revalidate = 60, query } = options;

  const response = await fetch(buildUrl(path, query), {
    headers: { accept: 'application/json' },
    next: { tags, revalidate: revalidate === false ? undefined : revalidate },
    cache: revalidate === false ? 'no-store' : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, path, `GET ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Same as `apiGet` but never throws — pages fall back to sensible empty state
 * so a single unavailable collection cannot blank the whole site.
 */
export async function apiGetSafe<T>(path: string, fallback: T, options: FetchOptions = {}): Promise<T> {
  try {
    return await apiGet<T>(path, options);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[api] ${path}: ${(error as Error).message}`);
    }
    return fallback;
  }
}

export const emptyPage = <T>(): Paginated<T> => ({
  data: [],
  meta: { total: 0, page: 1, limit: 12, pageCount: 1, hasNextPage: false, hasPreviousPage: false },
});

/** Convenience wrapper for the many `?limit=…` collection reads. */
export async function apiList<T>(
  path: string,
  options: FetchOptions & { limit?: number } = {},
): Promise<T[]> {
  const { limit = 100, ...rest } = options;
  const page = await apiGetSafe<Paginated<T>>(path, emptyPage<T>(), {
    ...rest,
    query: { limit, ...rest.query },
  });
  return page.data;
}
