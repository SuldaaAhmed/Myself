import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Code2 } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { ProjectCard } from '@/components/site/project-card';
import { Prose } from '@/components/site/prose';
import { Section } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/data';
import { apiGet, apiList } from '@/lib/api/server';
import { SITE_URL, getSettings } from '@/lib/api/site';
import type { CaseStudy, Project } from '@/lib/api/types';

type Params = Promise<{ slug: string }>;

async function loadProject(slug: string): Promise<Project | null> {
  try {
    return await apiGet<Project>(`/projects/${slug}`, { tags: ['projects', `project:${slug}`] });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadProject(slug);
  if (!project) return { title: 'Project not found' };

  const url = `${SITE_URL}/projects/${project.slug}`;
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: project.title,
      description: project.summary,
      images: project.coverUrl ? [{ url: project.coverUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await loadProject(slug);
  if (!project) notFound();

  const [related, caseStudies, settings] = await Promise.all([
    apiList<Project>('/projects', { tags: ['projects'], limit: 6 }),
    apiList<CaseStudy>('/case-studies', { tags: ['case-studies'], limit: 20 }),
    getSettings(),
  ]);

  const caseStudy = caseStudies.find((entry) => entry.project?.id === project.id);
  const others = related.filter((entry) => entry.id !== project.id).slice(0, 3);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: `${SITE_URL}/projects/${project.slug}`,
    dateCreated: project.publishedAt ?? project.createdAt,
    author: { '@type': 'Person', name: settings.identity?.name ?? 'Portfolio owner' },
    keywords: project.technologies?.map((technology) => technology.name).join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD we build ourselves — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="border-b border-line">
        <div className="container-page py-16 sm:py-20">
          <Link
            href="/projects"
            className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All projects
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {project.category ? <Badge tone="accent">{project.category.name}</Badge> : null}
                {project.year ? <span className="font-mono text-xs text-muted">{project.year}</span> : null}
              </div>
              <h1 className="max-w-3xl text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                {project.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{project.summary}</p>
            </div>

            <dl className="grid gap-4 text-sm">
              {project.client ? (
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">Client</dt>
                  <dd className="text-right">{project.client}</dd>
                </div>
              ) : null}
              {project.role ? (
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">Role</dt>
                  <dd className="text-right">{project.role}</dd>
                </div>
              ) : null}
              {project.technologies?.length ? (
                <div className="flex justify-between gap-6 border-b border-line pb-3">
                  <dt className="text-muted">Stack</dt>
                  <dd className="text-right">
                    {project.technologies.map((technology) => technology.name).join(' · ')}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {project.liveUrl ? (
                  <Button asChild size="sm">
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      Visit live
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </Button>
                ) : null}
                {project.repoUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                      <Code2 className="size-3.5" />
                      Source
                    </a>
                  </Button>
                ) : null}
              </div>
            </dl>
          </div>
        </div>
      </header>

      {project.coverUrl ? (
        <div className="container-page -mt-px">
          <Reveal>
            <div className="relative aspect-[16/9] overflow-hidden rounded-b-[var(--radius-card)] border-x border-b border-line">
              <Image
                src={project.coverUrl}
                alt={project.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      ) : null}

      {project.metrics?.length ? (
        <div className="border-b border-line">
          <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
            {project.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="font-display text-4xl tabular-nums">{metric.value}</p>
                <p className="eyebrow mt-1.5">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {project.content ? (
        <Section>
          <Reveal>
            <Prose content={project.content} />
          </Reveal>
        </Section>
      ) : null}

      {project.gallery.length > 0 ? (
        <Section className="pt-0">
          <div className="grid gap-6 sm:grid-cols-2">
            {project.gallery.map((image) => (
              <Reveal key={image}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line">
                  <Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {caseStudy ? (
        <Section className="border-y border-line bg-surface-muted/40">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow mb-3">Deep dive</p>
              <h2 className="max-w-2xl text-3xl leading-snug">{caseStudy.title}</h2>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link href={`/case-studies/${caseStudy.slug}`}>
                Read the case study
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section>
          <h2 className="mb-10 text-2xl">More work</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {others.map((entry) => (
              <ProjectCard key={entry.id} project={entry} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
