import type { MetadataRoute } from 'next';

/**
 * `robots.txt`.
 *
 * Everything is crawlable except the API route — there is nothing there for a
 * crawler to index, and a bot that follows it is just POSTing to a contact
 * endpoint. The sitemap is advertised so crawlers find the project pages
 * without walking the ledger.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
