import type { SVGProps } from 'react';

/**
 * GitHub and LinkedIn marks.
 *
 * These are hand-rolled rather than imported because `lucide-react` v1 removed
 * brand glyphs from the icon set — Lucide only ships icons it can license, and
 * company logos are trademarks. Rather than pin an old major or pull in a whole
 * second icon package for two shapes, the two paths live here.
 *
 * Both follow the same contract as a Lucide icon so they drop into the same
 * call sites: a `size` prop, `currentColor` fill, `aria-hidden` by default. The
 * link's visible text is what names the destination — an icon that repeats the
 * label only adds a second thing for a screen reader to read out.
 */

interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Edge length in pixels; matches Lucide's `size` prop. */
  size?: number;
}

export function GithubIcon({ size = 16, ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d="M12 .5a11.5 11.5 0 0 0-3.635 22.41c.575.106.786-.25.786-.556 0-.274-.01-1-.016-1.963-3.198.695-3.874-1.542-3.874-1.542-.523-1.329-1.277-1.682-1.277-1.682-1.044-.714.079-.7.079-.7 1.155.082 1.763 1.186 1.763 1.186 1.026 1.758 2.692 1.25 3.348.956.104-.744.402-1.25.731-1.538-2.553-.29-5.237-1.277-5.237-5.686 0-1.256.449-2.283 1.185-3.088-.119-.291-.514-1.462.113-3.047 0 0 .966-.31 3.166 1.18a10.99 10.99 0 0 1 5.766 0c2.198-1.49 3.163-1.18 3.163-1.18.628 1.585.233 2.756.114 3.047.738.805 1.183 1.832 1.183 3.088 0 4.42-2.688 5.392-5.25 5.677.413.355.78 1.056.78 2.129 0 1.537-.014 2.776-.014 3.154 0 .308.208.667.792.554A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 16, ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
