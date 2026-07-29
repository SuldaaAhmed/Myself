import { Mail } from 'lucide-react';
import type { ComponentType } from 'react';
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons';
import type { Profile } from '@/lib/types';
import { formatEntryId } from '@/lib/utils';

/**
 * Site footer: where to find this person, and a note on what the site is built
 * with.
 *
 * A server component — it is content and links, with nothing to hydrate.
 *
 * Every link is built from the profile record, and a link whose field is empty
 * simply does not render. That is the difference between a portfolio driven by
 * data and one with a LinkedIn icon pointing at `#` because the owner never
 * filled the field in.
 */

/**
 * `Icon` is typed structurally rather than as Lucide's `LucideIcon`, because
 * the GitHub and LinkedIn marks are local SVG components (see
 * `components/BrandIcons.tsx`). All three only need to accept a `size`, so
 * that is all the type asks for.
 */
interface SocialLink {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

function socialLinks(profile: Profile): SocialLink[] {
  const links: SocialLink[] = [];

  if (profile.githubUrl) {
    links.push({ href: profile.githubUrl, label: 'GitHub', Icon: GithubIcon });
  }
  if (profile.linkedinUrl) {
    links.push({ href: profile.linkedinUrl, label: 'LinkedIn', Icon: LinkedinIcon });
  }
  links.push({ href: `mailto:${profile.email}`, label: 'Email', Icon: Mail });

  return links;
}

export function Footer({ profile }: { profile: Profile }) {
  const links = socialLinks(profile);

  // Read at render time. On a statically generated page this is the build year,
  // which is the correct behaviour for a copyright line — and avoids the
  // hydration mismatch a client-side `new Date()` would cause across midnight.
  const year = new Date().getUTCFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-display text-label uppercase tracking-brand text-text-primary">
            {profile.fullName}
          </p>
          {/* The last-updated stamp closes the ledger the way the status bar
              opens it, and unlike a slogan it is a fact the data can back. */}
          <p className="mt-2 font-mono text-label uppercase text-text-muted">
            © {year} · Last entry {formatEntryId(profile.updatedAt)}
          </p>
        </div>

        <ul className="flex items-center gap-5">
          {links.map(({ href, label, Icon }) => {
            const isExternal = href.startsWith('http');

            return (
              <li key={label}>
                <a
                  href={href}
                  {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                  className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-label uppercase text-text-muted transition-colors duration-hover hover:text-accent-amber"
                >
                  <Icon size={15} />
                  {label}
                  {/* The icon is decorative; the visible label already names the
                      destination. This only adds the part a sighted user infers
                      from the icon and the new tab. */}
                  {isExternal ? <span className="sr-only">(opens in a new tab)</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-content px-6 py-4 font-mono text-micro uppercase text-text-muted lg:px-8">
          Built with Next.js, TypeScript and Tailwind CSS · Content served from the portfolio API
        </p>
      </div>
    </footer>
  );
}
