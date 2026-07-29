import { ArrowUpRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/SectionHeader';
import type { Profile } from '@/lib/types';

/**
 * The home page's biography block: the first paragraph and a way through to the
 * full page.
 *
 * The excerpt is taken by splitting the stored bio on its paragraph breaks and
 * showing the opening one. That keeps a single `bio` field in the CMS as the
 * source for the hero pitch, this block and `/about` — three views of one
 * value, rather than three fields that quietly stop agreeing after the second
 * edit.
 */
export function AboutExcerpt({ profile }: { profile: Profile }) {
  const [opening] = profile.bio.split('\n\n');

  return (
    <section id="about" aria-labelledby="about-heading" className="border-b border-border">
      <div className="mx-auto max-w-content px-6 py-12 md:py-24 lg:px-8">
        <SectionHeader
          index="004"
          title="About"
          id="about-heading"
          action={{ href: '/about', label: 'Full profile' }}
        />

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_16rem] md:gap-16">
          <p className="max-w-2xl font-body text-base leading-relaxed text-text-muted md:text-lg">
            {opening}
          </p>

          {/* A short data column, in the ledger's voice: labelled fields with
              monospace values, not a paragraph of self-description. */}
          <dl className="space-y-4 border-t border-border pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div>
              <dt className="font-mono text-label uppercase text-text-muted">Role</dt>
              <dd className="mt-1 font-body text-sm text-text-primary">{profile.role}</dd>
            </div>

            {profile.location ? (
              <div>
                <dt className="font-mono text-label uppercase text-text-muted">Based</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-body text-sm text-text-primary">
                  <MapPin size={13} aria-hidden className="text-text-muted" />
                  {profile.location}
                </dd>
              </div>
            ) : null}

            <div>
              <dt className="font-mono text-label uppercase text-text-muted">Contact</dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${profile.email}`}
                  className="focus-ring rounded-sm font-body text-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                >
                  {profile.email}
                </a>
              </dd>
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-label uppercase text-text-muted transition-colors duration-hover hover:text-accent-amber"
              >
                Read the full bio
                <ArrowUpRight size={13} aria-hidden />
              </Link>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
