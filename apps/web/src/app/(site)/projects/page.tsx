import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { ProjectCard } from '@/components/site/project-card';
import { PageHeader, Section } from '@/components/site/section';
import { Badge, EmptyState } from '@/components/ui/data';
import { apiGetSafe, apiList, emptyPage } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Category, Paginated, Project } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/projects', {
    title: 'Projects',
    description: 'Products, platforms and interfaces designed and shipped end to end.',
  });
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);

  const [projects, categories] = await Promise.all([
    apiGetSafe<Paginated<Project>>('/projects', emptyPage<Project>(), {
      tags: ['projects'],
      query: { page: currentPage, limit: 9, category, sort: 'order:asc' },
    }),
    apiList<Category>('/categories', { tags: ['categories'], limit: 20 }),
  ]);

  const activeCategories = categories.filter((item) => (item._count?.projects ?? 1) > 0);

  return (
    <>
      <PageHeader
        eyebrow={`${projects.meta.total} project${projects.meta.total === 1 ? '' : 's'}`}
        title="Selected work."
        description="Each entry lists what the problem was, what I built and what changed as a result."
      />

      <Section>
        {activeCategories.length > 0 ? (
          <nav className="mb-10 flex flex-wrap gap-2" aria-label="Filter by category">
            <Link href="/projects" scroll={false}>
              <Badge tone={category ? 'neutral' : 'accent'} className="px-3 py-1.5 text-xs">
                All
              </Badge>
            </Link>
            {activeCategories.map((item) => (
              <Link key={item.id} href={`/projects?category=${item.slug}`} scroll={false}>
                <Badge
                  tone={category === item.slug ? 'accent' : 'neutral'}
                  className="px-3 py-1.5 text-xs"
                >
                  {item.name}
                </Badge>
              </Link>
            ))}
          </nav>
        ) : null}

        {projects.data.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Published projects will appear on this page automatically."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.data.map((project, index) => (
              <Reveal key={project.id} delay={(index % 3) * 0.06}>
                <ProjectCard project={project} className="h-full" />
              </Reveal>
            ))}
          </div>
        )}

        {projects.meta.pageCount > 1 ? (
          <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: projects.meta.pageCount }).map((_, index) => {
              const target = index + 1;
              const query = new URLSearchParams();
              if (category) query.set('category', category);
              if (target > 1) query.set('page', String(target));
              const href = `/projects${query.size ? `?${query}` : ''}`;

              return (
                <Link
                  key={target}
                  href={href}
                  aria-current={target === projects.meta.page ? 'page' : undefined}
                  className={cn(
                    'grid size-10 place-items-center rounded-lg border text-sm transition-colors',
                    target === projects.meta.page
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-line text-muted hover:border-line-strong hover:text-foreground',
                  )}
                >
                  {target}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </Section>
    </>
  );
}
