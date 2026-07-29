import { ArrowDownToLine, Mail, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/BrandIcons';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ButtonLink } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { getProfile } from '@/lib/api';
import { firstSentence } from '@/lib/utils';

/**
 * `/about` — the full biography, résumé and social links.
 *
 * Entirely server-rendered: there is no state, no interaction beyond links, and
 * therefore no reason to ship JavaScript for it.
 *
 * Everything optional in the profile is guarded. A person who has not filled in
 * a LinkedIn URL gets a page without a LinkedIn link, not a page with a dead
 * one.
 */

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  return {
    title: 'About',
    description: firstSentence(profile.bio, 155),
  };
}

export default async function AboutPage() {
  const profile = await getProfile();

  // Paragraphs are stored as blank-line-separated plain text and rendered as
  // real `<p>` elements — no `dangerouslySetInnerHTML`, so CMS content can
  // never inject markup into the page.
  const paragraphs = profile.bio.split('\n\n').filter(Boolean);

  return (
    <div className="mx-auto max-w-content px-6 py-12 md:py-20 lg:px-8">
      <SectionHeader
        index="001"
        title="About"
        description={profile.role}
        as="h1"
        id="about-heading"
      />

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_16rem] md:gap-16">
        <div className="max-w-2xl space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="font-body text-base leading-relaxed text-text-muted md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <aside className="space-y-8 border-t border-border pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          {profile.avatarUrl ? (
            <div className="relative aspect-square w-32 overflow-hidden rounded-sm border border-border">
              <Image
                src={profile.avatarUrl}
                // Named, not "avatar" — the alt text should answer "who is this?"
                alt={profile.fullName}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ) : null}

          <dl className="space-y-5">
            {profile.location ? (
              <div>
                <dt className="font-mono text-label uppercase text-text-muted">Based</dt>
                <dd className="mt-1.5 flex items-center gap-1.5 font-body text-sm text-text-primary">
                  <MapPin size={14} aria-hidden className="text-text-muted" />
                  {profile.location}
                </dd>
              </div>
            ) : null}

            <div>
              <dt className="font-mono text-label uppercase text-text-muted">Email</dt>
              <dd className="mt-1.5">
                <a
                  href={`mailto:${profile.email}`}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-body text-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                >
                  <Mail size={14} aria-hidden />
                  {profile.email}
                </a>
              </dd>
            </div>

            {profile.githubUrl || profile.linkedinUrl ? (
              <div>
                <dt className="font-mono text-label uppercase text-text-muted">Elsewhere</dt>
                <dd className="mt-1.5 space-y-1.5">
                  {profile.githubUrl ? (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring flex items-center gap-1.5 rounded-sm font-body text-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                    >
                      <GithubIcon size={14} />
                      GitHub
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : null}

                  {profile.linkedinUrl ? (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring flex items-center gap-1.5 rounded-sm font-body text-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                    >
                      <LinkedinIcon size={14} />
                      LinkedIn
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>

          {profile.resumeUrl ? (
            <ButtonLink
              href={profile.resumeUrl}
              variant="secondary"
              size="sm"
              download
              aria-label={`Download the résumé of ${profile.fullName} (PDF)`}
              className="w-full"
            >
              <ArrowDownToLine size={14} aria-hidden />
              Download résumé
            </ButtonLink>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
