import 'server-only';
import { cache } from 'react';
import type { Metadata } from 'next';
import { apiGetSafe } from './server';
import type { SeoRecord, SiteSettings } from './types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Deduplicated per request, cached for five minutes per revalidation window. */
export const getSettings = cache(async (): Promise<SiteSettings> =>
  apiGetSafe<SiteSettings>('/settings/public', {}, { tags: ['settings'], revalidate: 300 }),
);

export const getSeo = cache(async (path: string): Promise<SeoRecord | null> =>
  apiGetSafe<SeoRecord | null>('/seo', null, {
    tags: ['seo'],
    revalidate: 300,
    query: { path },
  }),
);

/**
 * Builds a page's metadata from the CMS record for its path, falling back to
 * whatever the page passes in. Editors control titles and descriptions without
 * touching code.
 */
export async function buildMetadata(
  path: string,
  fallback: { title: string; description: string; image?: string | null },
): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo(path), getSettings()]);
  const siteName = settings.identity?.name ?? 'Portfolio';

  const title = seo?.title ?? fallback.title;
  const description = seo?.description ?? fallback.description;
  const image = seo?.ogImage ?? fallback.image ?? undefined;
  const canonical = seo?.canonical ?? `${SITE_URL}${path === '/' ? '' : path}`;

  return {
    // The home page owns the full title; inner pages get the "%s · name" template.
    title: path === '/' ? { absolute: title } : title,
    description,
    keywords: seo?.keywords?.length ? seo.keywords : undefined,
    alternates: { canonical },
    robots: seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      url: canonical,
      siteName,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
