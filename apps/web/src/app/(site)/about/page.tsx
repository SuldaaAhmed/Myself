import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section, SectionHeading } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { apiList } from '@/lib/api/server';
import { buildMetadata, getSettings } from '@/lib/api/site';
import type { Education, Experience } from '@/lib/api/types';
import { formatRange } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/about', {
    title: 'About',
    description: 'Who I am, how I work, and what I care about in software.',
  });
}

export default async function AboutPage() {
  const [settings, experience, education] = await Promise.all([
    getSettings(),
    apiList<Experience>('/experience', { tags: ['experience'], limit: 4 }),
    apiList<Education>('/education', { tags: ['education'], limit: 3 }),
  ]);

  const about = settings.about ?? {};
  const identity = settings.identity ?? {};

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={about.lead ?? `I am ${identity.name ?? 'an engineer'}.`}
        description={identity.tagline}
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
          <div className="prose-editorial">
            {(about.body ?? []).map((paragraph, index) => (
              <Reveal key={index} delay={index * 0.05}>
                <p>{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <div className="space-y-8">
            {about.portraitUrl ? (
              <Reveal>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line">
                  <Image
                    src={about.portraitUrl}
                    alt={identity.name ?? 'Portrait'}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.1}>
              <div className="card p-6">
                <p className="eyebrow mb-4">At a glance</p>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Role</dt>
                    <dd>{identity.role ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Based</dt>
                    <dd>{settings.contact?.location ?? '—'}</dd>
                  </div>
                  {education[0] ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Studied</dt>
                      <dd className="text-right">{education[0].degree}</dd>
                    </div>
                  ) : null}
                  {experience[0] ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Now</dt>
                      <dd className="text-right">{experience[0].company}</dd>
                    </div>
                  ) : null}
                </dl>
                <Button asChild variant="outline" size="sm" className="mt-6 w-full">
                  <Link href="/resume">Full résumé</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {about.principles?.length ? (
        <Section className="border-y border-line bg-surface-muted/40">
          <SectionHeading eyebrow="How I work" title="Three things I do not compromise on." />
          <div className="grid gap-6 md:grid-cols-3">
            {about.principles.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 0.07}>
                <div className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-6">
                  <span className="font-mono text-xs text-accent">0{index + 1}</span>
                  <h3 className="text-xl">{principle.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{principle.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {experience.length > 0 ? (
        <Section>
          <SectionHeading
            eyebrow="Experience"
            title="Recent roles."
            action={{ label: 'Full history →', href: '/experience' }}
          />
          <ol>
            {experience.map((role, index) => (
              <Reveal as="li" key={role.id} delay={index * 0.05}>
                <div className="grid gap-2 border-t border-line py-7 sm:grid-cols-[10rem_1fr] sm:gap-8">
                  <p className="font-mono text-xs text-muted">{formatRange(role.startDate, role.endDate)}</p>
                  <div>
                    <h3 className="text-xl">
                      {role.role} <span className="text-muted">· {role.company}</span>
                    </h3>
                    {role.summary ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{role.summary}</p>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </Section>
      ) : null}
    </>
  );
}
