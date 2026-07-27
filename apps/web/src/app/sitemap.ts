import type { MetadataRoute } from 'next';
import { apiGetSafe } from '@/lib/api/server';
import { SITE_URL } from '@/lib/api/site';

interface SitemapEntry {
  path: string;
  updatedAt: string;
  priority: number;
}

/**
 * The API owns the URL list, so publishing a project or post in the dashboard
 * puts it in the sitemap on the next revalidation — no redeploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await apiGetSafe<SitemapEntry[]>('/seo/sitemap', [], {
    tags: ['seo', 'projects', 'blog', 'case-studies'],
    revalidate: 3600,
  });

  if (entries.length === 0) {
    return [{ url: SITE_URL, lastModified: new Date(), priority: 1 }];
  }

  return entries.map((entry) => ({
    url: `${SITE_URL}${entry.path === '/' ? '' : entry.path}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: entry.path === '/' ? 'weekly' : 'monthly',
    priority: entry.priority,
  }));
}
