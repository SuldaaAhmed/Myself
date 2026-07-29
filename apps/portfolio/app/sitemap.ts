import type { MetadataRoute } from 'next';
import { getProjects } from '@/lib/api';

/**
 * `sitemap.xml`, generated from the same data the pages render.
 *
 * A hand-maintained sitemap is wrong the day after a project is added. This one
 * cannot be, because it reads the project list rather than a copy of it.
 *
 * `lastModified` uses each project's `startedAt` — the only date the contract
 * carries. If the backend later exposes an `updatedAt` per project, that is the
 * field to switch to.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: new Date(project.startedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
