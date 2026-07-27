import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { CaseStudy } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/case-studies', {
    title: 'Case studies',
    description: 'Longer write-ups: the problem, the approach and the measured outcome.',
  });
}

export default async function CaseStudiesPage() {
  const caseStudies = await apiList<CaseStudy>('/case-studies', { tags: ['case-studies'] });

  return (
    <>
      <PageHeader
        eyebrow="Case studies"
        title="The full story, numbers included."
        description="Where a project card gives you the headline, these give you the reasoning."
      />

      <Section>
        {caseStudies.length === 0 ? (
          <EmptyState title="No case studies published yet" />
        ) : (
          <div className="space-y-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
            {caseStudies.map((caseStudy, index) => (
              <Reveal key={caseStudy.id} delay={index * 0.05} className="bg-surface">
                <Link
                  href={`/case-studies/${caseStudy.slug}`}
                  className="group grid gap-6 p-8 transition-colors hover:bg-surface-muted/50 sm:p-10 lg:grid-cols-[1.7fr_1fr] lg:items-center"
                >
                  <div>
                    <p className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, '0')}
                      {caseStudy.project ? ` · ${caseStudy.project.title}` : ''}
                    </p>
                    <h2 className="mt-3 max-w-2xl text-2xl leading-snug transition-colors group-hover:text-accent sm:text-3xl">
                      {caseStudy.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{caseStudy.summary}</p>
                  </div>

                  <div className="flex items-end justify-between gap-6">
                    {caseStudy.metrics?.length ? (
                      <dl className="flex flex-wrap gap-x-8 gap-y-3">
                        {caseStudy.metrics.slice(0, 2).map((metric) => (
                          <div key={metric.label}>
                            <dd className="font-display text-2xl tabular-nums">{metric.value}</dd>
                            <dt className="eyebrow">{metric.label}</dt>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <span />
                    )}
                    <ArrowUpRight
                      className="size-5 shrink-0 text-muted transition-[transform,color] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent"
                      aria-hidden
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
