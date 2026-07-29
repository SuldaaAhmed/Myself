import { IBM_Plex_Mono, Inter } from 'next/font/google';

/**
 * Fonts are loaded once, here, and exposed to Tailwind as CSS variables.
 *
 * `next/font` self-hosts both families at build time: no request to Google at
 * runtime, no layout shift while the face downloads, and no third-party origin
 * in the critical path. The `variable` names are the same strings referenced by
 * `fontFamily` in `tailwind.config.ts`, so `font-display` and `font-body`
 * resolve through these declarations rather than through a global CSS rule.
 */

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  // 400 for body/tag text, 500 for labels and status, 600 for headings. Loading
  // only what is used keeps the font payload at three files rather than seven.
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  // Inter is variable, so a range costs no more than a single weight.
  variable: '--font-inter',
  display: 'swap',
});

/** Applied to `<html>` so both variables are in scope for the whole document. */
export const fontVariables = `${plexMono.variable} ${inter.variable}`;
