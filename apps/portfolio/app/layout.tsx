import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { MotionProvider } from '@/components/MotionProvider';
import { Nav } from '@/components/Nav';
import { StatusBar } from '@/components/StatusBar';
import { getProfile } from '@/lib/api';
import { fontVariables } from '@/lib/fonts';
import { firstSentence } from '@/lib/utils';
import '@/styles/globals.css';

/**
 * Root layout — the shell every route renders inside.
 *
 * It is a server component and it does one fetch: the profile. The name in the
 * navigation, the status bar's text and timestamp, and every link in the footer
 * come from that single record, so the chrome around the site is as
 * content-driven as the pages inside it.
 *
 * The fetch is not duplicated work. `getProfile` is wrapped in React's
 * `cache()`, so the home page asking for the same record during the same render
 * reuses this result rather than issuing a second request.
 */

/** The site's own origin, used to make Open Graph URLs absolute. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

/**
 * Metadata is generated rather than declared, for the same reason as everything
 * else here: the title and description are content. Editing the bio in the
 * admin panel changes the search result too.
 */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const description = firstSentence(profile.bio, 155);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${profile.fullName} — ${profile.role}`,
      // Inner pages set only their own title; this appends the identity.
      template: `%s · ${profile.fullName}`,
    },
    description,
    authors: [{ name: profile.fullName }],
    openGraph: {
      type: 'website',
      siteName: profile.fullName,
      title: `${profile.fullName} — ${profile.role}`,
      description,
      url: SITE_URL,
    },
    twitter: {
      card: 'summary',
      title: `${profile.fullName} — ${profile.role}`,
      description,
    },
  };
}

export const viewport: Viewport = {
  // Matches `colors.ink`, so the mobile browser chrome continues the page
  // instead of framing it in white.
  themeColor: '#0B0E11',
  colorScheme: 'dark',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();

  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen">
        <MotionProvider>
          {/* First focusable element on every page. See `.skip-link` in
              `styles/globals.css`. */}
          <a href="#main" className="skip-link">
            Skip to content
          </a>

          {/* `sticky` rather than `fixed`: the header stays reachable while
              scrolling without being removed from the document flow, so no
              page has to compensate with top padding. */}
          <header className="sticky top-0 z-40">
            <Nav profileName={profile.fullName} />
            <StatusBar statusLine={profile.statusLine} updatedAt={profile.updatedAt} />
          </header>

          {/* `tabIndex={-1}` makes the skip link's target focusable. Without it
              the browser scrolls to `#main` but leaves focus in the header, and
              the next Tab goes back to the navigation. */}
          <main id="main" tabIndex={-1}>
            {children}
          </main>

          <Footer profile={profile} />
        </MotionProvider>
      </body>
    </html>
  );
}
