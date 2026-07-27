import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { Section } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api/server';
import { SITE_URL } from '@/lib/api/site';
import type { CaseStudy } from '@/lib/api/types';

type Params = Promise<{ slug: string }>;

async function loadCaseStudy(slug: string): Promise<CaseStudy | null> {
  try {
    return await apiGet<CaseStudy>(`/case-studies/${slug}`, { tags: ['case-studies'] });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await loadCaseStudy(slug);
  if (!caseStudy) return { title: 'Case study not found' };

  return {
    title: caseStudy.title,
    description: caseStudy.summary,
    alternates: { canonical: `${SITE_URL}/case-studies/${caseStudy.slug}` },
    openGraph: {
      type: 'article',
      title: caseStudy.title,
      description: caseStudy.summary,
      images: caseStudy.coverUrl ? [{ url: caseStudy.coverUrl }] : undefined,
    },
  };
}

const CHAPTERS = [
  { key: 'context', label: 'Context' },
  { key: 'problem', label: 'The problem' },
  { key: 'approach', label: 'The approach' },
  { key: 'outcome', label: 'The outcome' },
] as const;

export default async function CaseStudyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const caseStudy = await loadCaseStudy(slug);
  if (!caseStudy) notFound();

  return (
    <>
      <header className="border-b border-line">
        <div className="container-page py-16 sm:py-24">
          <Link
            href="/case-studies"
            className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All case studies
          </Link>
          <h1 className="max-w-4xl text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {caseStudy.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{caseStudy.summary}</p>

          {caseStudy.project ? (
            <Button asChild variant="outline" size="sm" className="mt-8">
              <Link href={`/projects/${caseStudy.project.slug}`}>
                See the project
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {caseStudy.metrics?.length ? (
        <div className="border-b border-line bg-surface-muted/40">
          <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
            {caseStudy.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="font-display text-4xl tabular-nums sm:text-5xl">{metric.value}</p>
                <p className="eyebrow mt-2">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {caseStudy.coverUrl ? (
        <div className="container-page pt-12">
          <Reveal>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] border border-line">
              <Image src={caseStudy.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      ) : null}

      <Section>
        <div className="grid gap-14 lg:grid-cols-[16rem_1fr] lg:gap-20">
          <nav className="hidden lg:block" aria-label="Sections">
            <ol className="sticky top-28 space-y-3 text-sm">
              {CHAPTERS.map((chapter, index) => (
                <li key={chapter.key}>
                  <a
                    href={`#${chapter.key}`}
                    className="flex items-baseline gap-3 text-muted transition-colors hover:text-foreground"
                  >
                    <span className="font-mono text-[0.6875rem]">0{index + 1}</span>
                    {chapter.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-14">
            {CHAPTERS.map((chapter, index) => (
              <Reveal key={chapter.key} delay={index * 0.04}>
                <section id={chapter.key} className="scroll-mt-28">
                  <p className="eyebrow mb-4">
                    0{index + 1} — {chapter.label}
                  </p>
                  <div className="prose-editorial">
                    {caseStudy[chapter.key]
                      .split('\n')
                      .filter(Boolean)
                      .map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>{paragraph}</p>
                      ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="max-w-xl text-3xl leading-snug">Have a problem shaped like this one?</h2>
          <Button asChild size="lg">
            <Link href="/contact">
              Start a conversation
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </Section>
    </>
  );
}
