import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '@/components/site/providers';
import { getSettings, SITE_URL } from '@/lib/api/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-code',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0c0b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings.identity?.name ?? 'Portfolio';
  const role = settings.identity?.role ?? '';

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${name}${role ? ` — ${role}` : ''}`, template: `%s · ${name}` },
    description: settings.hero?.subheadline ?? settings.identity?.tagline ?? '',
    applicationName: name,
    authors: [{ name }],
    creator: name,
    formatDetection: { telephone: false },
    icons: { icon: '/icon.svg', apple: '/icon.svg' },
  };
}

/**
 * Theme colours arrive from the CMS, so they are validated before they reach a
 * style tag — only literal colour values are allowed through.
 */
const COLOUR_PATTERN = /^(#[0-9a-f]{3,8}|(rgb|hsl|oklch|oklab)\([0-9a-z%.,/\s-]+\))$/i;
const safeColour = (value?: string): string | null =>
  value && COLOUR_PATTERN.test(value.trim()) ? value.trim() : null;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const theme = settings.theme ?? {};
  const accent = safeColour(theme.accent);
  const accentSecondary = safeColour(theme.accentSecondary);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrument.variable} ${mono.variable}`}
    >
      <body className={theme.showGrain === false ? undefined : 'grain'}>
        {/* Accent colours are CMS-controlled, so they are injected as tokens. */}
        {accent || accentSecondary ? (
          <style
            // Only validated colour literals reach this style tag (see safeColour).
            dangerouslySetInnerHTML={{
              __html: `:root{${accent ? `--accent:${accent};--ring:${accent};` : ''}${
                accentSecondary ? `--secondary-accent:${accentSecondary};` : ''
              }}`,
            }}
          />
        ) : null}
        <AppProviders defaultTheme={theme.defaultMode ?? 'dark'}>{children}</AppProviders>
      </body>
    </html>
  );
}
