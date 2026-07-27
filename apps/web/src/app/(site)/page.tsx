import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Quote, Star } from 'lucide-react';
import { Marquee } from '@/components/motion/ambient';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { Hero } from '@/components/site/hero';
import { ProjectCard } from '@/components/site/project-card';
import { Section, SectionHeading } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/data';
import { apiGetSafe } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { HomePayload } from '@/lib/api/types';
import { formatDate, formatRange } from '@/lib/utils';

const FALLBACK: HomePayload = {
  settings: {},
  featuredProjects: [],
  services: [],
  skillGroups: [],
  technologies: [],
  testimonials: [],
  posts: [],
  experience: [],
  stats: { projects: 0, certificates: 0, posts: 0, testimonials: 0 },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/', {
    title: 'Home',
    description: 'Selected work, case studies and writing from a full-stack engineer.',
  });
}

export default async function HomePage() {
  const home = await apiGetSafe<HomePayload>('/site/home', FALLBACK, {
    tags: ['settings', 'projects', 'services', 'skills', 'technologies', 'testimonials', 'blog'],
    revalidate: 120,
  });

  return (
    <>
      <Hero settings={home.settings} stats={home.stats} />

      {home.technologies.length > 0 ? (
        <div className="border-b border-line py-10">
          <Marquee items={home.technologies.map((technology) => technology.name)} />
        </div>
      ) : null}

      {home.featuredProjects.length > 0 ? (
        <Section id="work">
          <SectionHeading
            eyebrow="Selected work"
            title="Projects where the details mattered."
            description="A short list, chosen for the problems rather than the logos."
            action={{ label: 'All projects →', href: '/projects' }}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {home.featuredProjects.map((project, index) => (
              <Reveal
                key={project.id}
                delay={index * 0.06}
                className={index === 0 ? 'lg:col-span-2 lg:row-span-2' : undefined}
              >
                <ProjectCard project={project} featured={index === 0} className="h-full" />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {home.services.length > 0 ? (
        <Section className="border-y border-line bg-surface-muted/40">
          <SectionHeading
            eyebrow="Services"
            title="How I usually help."
            description="Engagements are scoped to a problem and a measure of success, not to a list of deliverables."
            action={{ label: 'Details →', href: '/services' }}
          />
          <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {home.services.map((service) => (
              <RevealItem key={service.id}>
                <article className="group flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-colors hover:border-accent/40">
                  <h3 className="text-xl">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{service.description}</p>
                  {service.priceFrom ? (
                    <p className="mt-auto pt-4 font-mono text-xs text-accent">{service.priceFrom}</p>
                  ) : null}
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      ) : null}

      {home.skillGroups.length > 0 ? (
        <Section>
          <SectionHeading
            eyebrow="Capabilities"
            title="What I bring to a team."
            action={{ label: 'Full skill map →', href: '/skills' }}
          />
          <div className="grid gap-10 md:grid-cols-3">
            {home.skillGroups.map((group, groupIndex) => (
              <Reveal key={group.id} delay={groupIndex * 0.08}>
                <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-muted">
                  {group.name}
                </h3>
                <ul className="space-y-4">
                  {(group.skills ?? []).map((skill) => (
                    <li key={skill.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-sm">{skill.name}</span>
                        <span className="font-mono text-[0.6875rem] text-muted">{skill.level}</span>
                      </div>
                      <div className="h-px w-full bg-line">
                        <div
                          className="h-px bg-accent transition-[width] duration-700"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {home.experience.length > 0 ? (
        <Section className="border-y border-line">
          <SectionHeading
            eyebrow="Track record"
            title="Where I have been."
            action={{ label: 'Full history →', href: '/experience' }}
          />
          <ol className="space-y-0">
            {home.experience.map((role, index) => (
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

      {home.testimonials.length > 0 ? (
        <Section>
          <SectionHeading
            eyebrow="In their words"
            title="What working together looks like."
            action={{ label: 'All testimonials →', href: '/testimonials' }}
          />
          <RevealGroup className="grid gap-6 md:grid-cols-3">
            {home.testimonials.slice(0, 3).map((testimonial) => (
              <RevealItem key={testimonial.id}>
                <figure className="flex h-full flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6">
                  <Quote className="size-5 text-accent" aria-hidden />
                  <blockquote className="flex-1 text-[0.9375rem] leading-relaxed">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="border-t border-line pt-4">
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(', ')}
                    </p>
                    {testimonial.rating ? (
                      <div className="mt-2 flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
                        {Array.from({ length: testimonial.rating }).map((_, index) => (
                          <Star key={index} className="size-3 fill-accent text-accent" aria-hidden />
                        ))}
                      </div>
                    ) : null}
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      ) : null}

      {home.posts.length > 0 ? (
        <Section className="border-t border-line">
          <SectionHeading
            eyebrow="Writing"
            title="Notes from the work."
            action={{ label: 'All articles →', href: '/blog' }}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {home.posts.map((post, index) => (
              <Reveal key={post.id} delay={index * 0.06}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-center gap-3">
                    {post.category ? <Badge tone="accent">{post.category.name}</Badge> : null}
                    <span className="font-mono text-[0.6875rem] text-muted">
                      {post.readingTime ?? 5} min
                    </span>
                  </div>
                  <h3 className="text-xl leading-snug transition-colors group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                  <p className="mt-auto pt-4 font-mono text-[0.6875rem] text-muted">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <Reveal className="card relative overflow-hidden p-10 text-center sm:p-16">
          <div
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                'radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%)',
            }}
            aria-hidden
          />
          <p className="eyebrow mb-5">Next step</p>
          <h2 className="mx-auto max-w-2xl text-balance text-3xl leading-tight sm:text-5xl">
            Have something that needs building properly?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted">
            Tell me the problem in a few sentences. If I am not the right person, I will say so and point
            you somewhere better.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Start a conversation
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/resume">Read the résumé</Link>
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
