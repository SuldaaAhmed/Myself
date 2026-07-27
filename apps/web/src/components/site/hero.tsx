import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import type { HomePayload, SiteSettings } from '@/lib/api/types';

/**
 * Asymmetric editorial hero: oversized serif headline on the left, a live
 * "status card" on the right, stat row underneath. All copy is CMS-driven.
 */
export function Hero({
  settings,
  stats,
}: {
  settings: SiteSettings;
  stats: HomePayload['stats'];
}) {
  const hero = settings.hero ?? {};
  const identity = settings.identity ?? {};
  const primary = hero.primaryCta ?? { label: 'Start a project', href: '/contact' };
  const secondary = hero.secondaryCta ?? { label: 'See selected work', href: '/projects' };

  const statRow = [
    { label: 'Projects shipped', value: stats.projects },
    { label: 'Certifications', value: stats.certificates },
    { label: 'Articles', value: stats.posts },
    { label: 'Client words', value: stats.testimonials },
  ];

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="grid-canvas absolute inset-0 -z-10" aria-hidden />
      <div
        className="absolute -top-40 right-[-10%] -z-10 size-[36rem] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent), transparent 65%)',
        }}
        aria-hidden
      />

      <div className="container-page grid gap-14 py-24 sm:py-32 lg:grid-cols-[1.55fr_1fr] lg:items-end lg:gap-20">
        <div>
          {hero.eyebrow ? (
            <Reveal>
              <p className="eyebrow mb-6 flex items-center gap-2">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--secondary-accent)] opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--secondary-accent)]" />
                </span>
                {hero.eyebrow}
              </p>
            </Reveal>
          ) : null}

          <Reveal delay={0.05}>
            <h1 className="max-w-4xl text-balance text-[clamp(2.6rem,7vw,5.25rem)] leading-[0.98]">
              {hero.headline ?? identity.tagline ?? 'Engineer, designer, builder.'}
            </h1>
          </Reveal>

          {hero.subheadline ? (
            <Reveal delay={0.12}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                {hero.subheadline}
              </p>
            </Reveal>
          ) : null}

          <Reveal delay={0.18}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={primary.href}>
                  {primary.label}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.22} className="lg:pb-2">
          <div className="card relative p-6">
            <p className="eyebrow mb-4">Currently</p>
            <p className="font-display text-2xl leading-snug">
              {hero.availability ?? 'Open to new work'}
            </p>
            <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Role</dt>
                <dd>{identity.role ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Based</dt>
                <dd>{hero.location ?? settings.contact?.location ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Reply time</dt>
                <dd>{settings.contact?.responseTime ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </Reveal>
      </div>

      <div className="container-page pb-14">
        <Reveal delay={0.28}>
          <dl className="grid grid-cols-2 gap-y-8 border-t border-line pt-10 sm:grid-cols-4">
            {statRow.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5">
                <dd className="font-display text-4xl tabular-nums leading-none sm:text-5xl">
                  {stat.value}
                </dd>
                <dt className="eyebrow">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block" aria-hidden>
        <ArrowDown className="size-4 animate-bounce text-muted" />
      </div>
    </section>
  );
}
