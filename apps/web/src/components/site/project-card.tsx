import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/data';
import type { Project } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/**
 * Cover art placeholder: a gradient derived from the slug, so a project without
 * an uploaded image still looks deliberate — and always looks the same.
 */
function CoverFallback({ seed }: { seed: string }) {
  const hue = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;

  return (
    <div
      className="h-full w-full"
      style={{
        background: `radial-gradient(120% 120% at 20% 10%, oklch(0.72 0.14 ${hue}) 0%, oklch(0.28 0.06 ${(hue + 40) % 360}) 60%, oklch(0.2 0.03 ${(hue + 80) % 360}) 100%)`,
      }}
      aria-hidden
    />
  );
}

export function ProjectCard({
  project,
  featured = false,
  className,
}: {
  project: Project;
  featured?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[transform,border-color] duration-500 hover:-translate-y-1.5 hover:border-line-strong',
        className,
      )}
    >
      <Link href={`/projects/${project.slug}`} className="absolute inset-0 z-10" aria-label={project.title}>
        <span className="sr-only">{project.title}</span>
      </Link>

      {/* A featured card spans two grid rows, so its cover grows to fill it. */}
      <div
        className={cn(
          'relative overflow-hidden',
          featured ? 'aspect-[16/10] lg:aspect-auto lg:min-h-72 lg:flex-1' : 'aspect-[16/9]',
        )}
      >
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt=""
            fill
            sizes={featured ? '(max-width: 1024px) 100vw, 60vw' : '(max-width: 768px) 100vw, 33vw'}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
            <CoverFallback seed={project.slug} />
          </div>
        )}
      </div>

      <div className={cn('flex flex-col p-6', featured ? 'lg:shrink-0' : 'flex-1')}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {project.category ? <Badge tone="accent">{project.category.name}</Badge> : null}
          {project.year ? <span className="font-mono text-xs text-muted">{project.year}</span> : null}
        </div>

        <h3 className={cn('leading-snug', featured ? 'text-2xl sm:text-3xl' : 'text-xl')}>
          {project.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>

        {project.metrics?.length ? (
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {project.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label}>
                <dd className="font-display text-lg tabular-nums">{metric.value}</dd>
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                  {metric.label}
                </dt>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <ul className="flex flex-wrap gap-1.5">
            {project.technologies?.slice(0, 4).map((technology) => (
              <li key={technology.id} className="font-mono text-[0.6875rem] text-muted">
                {technology.name}
              </li>
            ))}
          </ul>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}
