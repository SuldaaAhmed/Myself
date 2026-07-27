import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { Prose } from '@/components/site/prose';
import { ReadTracker } from '@/components/site/read-tracker';
import { Section } from '@/components/site/section';
import { Badge } from '@/components/ui/data';
import { apiGet, apiList } from '@/lib/api/server';
import { SITE_URL, getSettings } from '@/lib/api/site';
import type { Post } from '@/lib/api/types';
import { formatDate, initials } from '@/lib/utils';

type Params = Promise<{ slug: string }>;

async function loadPost(slug: string): Promise<Post | null> {
  try {
    return await apiGet<Post>(`/blog/${slug}`, { tags: ['blog', `post:${slug}`] });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: 'Article not found' };

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt ?? undefined,
      tags: post.tags,
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([loadPost(slug), getSettings()]);
  if (!post) notFound();

  const more = (await apiList<Post>('/blog', { tags: ['blog'], limit: 4 }))
    .filter((entry) => entry.id !== post.id)
    .slice(0, 3);

  const author = post.author?.name ?? settings.identity?.name ?? 'Author';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: author },
    keywords: post.tags.join(', '),
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD we build ourselves — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ReadTracker slug={post.slug} />

      <article>
        <header className="border-b border-line">
          <div className="container-page py-16 sm:py-20">
            <Link
              href="/blog"
              className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All writing
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              {post.category ? <Badge tone="accent">{post.category.name}</Badge> : null}
              <time className="font-mono text-xs text-muted" dateTime={post.publishedAt ?? post.createdAt}>
                {formatDate(post.publishedAt ?? post.createdAt)}
              </time>
              <span className="font-mono text-xs text-muted">{post.readingTime ?? 5} min read</span>
            </div>

            <h1 className="max-w-4xl text-balance text-4xl leading-[1.08] sm:text-5xl">{post.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{post.excerpt}</p>

            <div className="mt-8 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-surface-muted font-mono text-xs">
                {initials(author)}
              </span>
              <div className="text-sm">
                <p>{author}</p>
                {post.author?.jobTitle ? <p className="text-xs text-muted">{post.author.jobTitle}</p> : null}
              </div>
            </div>
          </div>
        </header>

        {post.coverUrl ? (
          <div className="container-page pt-12">
            <Reveal>
              <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line">
                <Image src={post.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
              </div>
            </Reveal>
          </div>
        ) : null}

        <Section>
          <Prose content={post.content} className="mx-auto" />

          {post.tags.length > 0 ? (
            <div className="mx-auto mt-14 flex max-w-[68ch] flex-wrap gap-2 border-t border-line pt-8">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge>#{tag}</Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </Section>
      </article>

      {more.length > 0 ? (
        <Section className="border-t border-line">
          <h2 className="mb-10 text-2xl">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {more.map((entry) => (
              <Link
                key={entry.id}
                href={`/blog/${entry.slug}`}
                className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-colors hover:border-line-strong"
              >
                <span className="font-mono text-[0.6875rem] text-muted">
                  {formatDate(entry.publishedAt ?? entry.createdAt)}
                </span>
                <h3 className="text-lg leading-snug transition-colors group-hover:text-accent">
                  {entry.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted">{entry.excerpt}</p>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
