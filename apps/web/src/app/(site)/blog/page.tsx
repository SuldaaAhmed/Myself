import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Badge, EmptyState } from '@/components/ui/data';
import { apiGetSafe, emptyPage } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Paginated, Post } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/blog', {
    title: 'Writing',
    description: 'Notes on interface performance, data modelling and shipping software that lasts.',
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);

  const posts = await apiGetSafe<Paginated<Post>>('/blog', emptyPage<Post>(), {
    tags: ['blog'],
    query: { page: currentPage, limit: 10, tag, sort: 'publishedAt:desc' },
  });

  const tags = [...new Set(posts.data.flatMap((post) => post.tags))].slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="Writing"
        title="Notes from the work."
        description="Short, specific pieces — mostly about performance, data models and the craft of shipping."
      />

      <Section>
        {tags.length > 0 ? (
          <nav className="mb-12 flex flex-wrap gap-2" aria-label="Filter by tag">
            <Link href="/blog" scroll={false}>
              <Badge tone={tag ? 'neutral' : 'accent'} className="px-3 py-1.5 text-xs">
                All
              </Badge>
            </Link>
            {tags.map((item) => (
              <Link key={item} href={`/blog?tag=${encodeURIComponent(item)}`} scroll={false}>
                <Badge tone={tag === item ? 'accent' : 'neutral'} className="px-3 py-1.5 text-xs">
                  {item}
                </Badge>
              </Link>
            ))}
          </nav>
        ) : null}

        {posts.data.length === 0 ? (
          <EmptyState title="No articles yet" description="Published posts appear here automatically." />
        ) : (
          <ol className="border-t border-line">
            {posts.data.map((post, index) => (
              <Reveal as="li" key={post.id} delay={(index % 4) * 0.05}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-4 border-b border-line py-9 transition-colors hover:bg-surface-muted/40 sm:grid-cols-[9rem_1fr] sm:gap-10"
                >
                  <div className="flex flex-col gap-2">
                    <time className="font-mono text-xs text-muted" dateTime={post.publishedAt ?? post.createdAt}>
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </time>
                    <span className="font-mono text-[0.6875rem] text-muted">
                      {post.readingTime ?? 5} min read
                    </span>
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {post.category ? <Badge tone="accent">{post.category.name}</Badge> : null}
                      {post.tags.slice(0, 3).map((item) => (
                        <span key={item} className="font-mono text-[0.6875rem] text-muted">
                          #{item}
                        </span>
                      ))}
                    </div>
                    <h2 className="max-w-3xl text-2xl leading-snug transition-colors group-hover:text-accent sm:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{post.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ol>
        )}
      </Section>
    </>
  );
}
