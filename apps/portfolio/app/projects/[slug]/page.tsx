import { ArrowLeft, ExternalLink } from 'lucide-react';
import { GithubIcon } from '@/components/BrandIcons';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { getProjectBySlug, getProjectSlugs } from '@/lib/api';
import { formatEntryId, formatMonthYear } from '@/lib/utils';

/**
 * `/projects/[slug]` — a single entry, in full.
 *
 * Three things worth pointing at:
 *
 *  - `generateStaticParams` prerenders one page per project at build time, so a
 *    detail page is a static file rather than a request that waits on the API.
 *    New projects added in the admin panel are still served: `dynamicParams`
 *    defaults to `true`, so an unknown slug is rendered on demand and cached.
 *  - `generateMetadata` reads the same record the page does. Because
 *    `getProjectBySlug` is memoised with React's `cache()`, that is one fetch,
 *    not two.
 *  - A slug with no project calls `notFound()`. Rendering an empty shell for a
 *    missing record would return HTTP 200 for a page that does not exist, which
 *    search engines index and users bookmark.
 */

interface PageProps {
  // Next 15+ passes route params as a promise.
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: 'Entry not found' };

  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      type: 'article',
      images: project.imageUrl ? [{ url: project.imageUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <article className="mx-auto max-w-content px-6 py-12 md:py-20 lg:px-8">
      <Link
        href="/projects"
        className="focus-ring inline-flex items-center gap-2 rounded-sm font-mono text-label uppercase text-text-muted transition-colors duration-hover hover:text-accent-amber"
      >
        <ArrowLeft size={14} aria-hidden />
        Back to ledger
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-label uppercase text-accent-amber">
            Entry {formatEntryId(project.startedAt)}
          </span>
          <StatusBadge status={project.status} />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold text-text-primary md:text-5xl">
          {project.title}
        </h1>

        <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-text-muted md:text-lg">
          {project.summary}
        </p>
      </header>

      {/*
        The image is optional, and when present its alt text is the project
        title rather than "project image" — a description that adds nothing is
        the same as no description, except it also suppresses the filename a
        screen reader would otherwise fall back to.
      */}
      {project.imageUrl ? (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-sm border border-border bg-surface">
          <Image
            src={project.imageUrl}
            alt={`Screenshot of ${project.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 64rem"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_15rem] md:gap-16">
        <div className="max-w-2xl">
          <h2 className="font-mono text-label uppercase text-text-muted">Description</h2>
          {/*
            `description` is plain text from the CMS. Splitting on blank lines
            gives real paragraphs without rendering user-supplied HTML — the
            entire class of injection problems avoided by not having the
            feature.
          */}
          <div className="mt-4 space-y-4">
            {project.description.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className="font-body text-base leading-relaxed text-text-muted"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <aside className="space-y-6 border-t border-border pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div>
            <h2 className="font-mono text-label uppercase text-text-muted">Started</h2>
            <p className="mt-2 font-mono text-sm text-text-primary">
              <time dateTime={project.startedAt}>{formatMonthYear(project.startedAt)}</time>
            </p>
          </div>

          <div>
            <h2 className="font-mono text-label uppercase text-text-muted">Stack</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <li
                  key={tech}
                  className="border border-border px-1.5 py-0.5 font-mono text-micro uppercase text-text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          {project.liveUrl || project.repoUrl ? (
            <div>
              <h2 className="font-mono text-label uppercase text-text-muted">Links</h2>
              <ul className="mt-3 space-y-2">
                {project.liveUrl ? (
                  <li>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                    >
                      <ExternalLink size={13} aria-hidden />
                      Live site
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}

                {project.repoUrl ? (
                  <li>
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                    >
                      <GithubIcon size={13} />
                      Repository
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
