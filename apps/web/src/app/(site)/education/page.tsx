import type { Metadata } from 'next';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Education } from '@/lib/api/types';
import { formatRange } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/education', {
    title: 'Education',
    description: 'Degrees, courses and the formal side of the training.',
  });
}

export default async function EducationPage() {
  const entries = await apiList<Education>('/education', { tags: ['education'] });

  return (
    <>
      <PageHeader
        eyebrow="Education"
        title="Where the foundations came from."
        description="Formal study, plus the courses that actually changed how I work."
      />

      <Section>
        {entries.length === 0 ? (
          <EmptyState title="No education entries published yet" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {entries.map((entry, index) => (
              <Reveal key={entry.id} delay={index * 0.06}>
                <article className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-7">
                  <p className="font-mono text-xs text-muted">
                    {formatRange(entry.startDate, entry.endDate)}
                  </p>
                  <h2 className="text-2xl leading-snug">{entry.degree}</h2>
                  <p className="text-sm text-muted">
                    {entry.institution}
                    {entry.location ? ` · ${entry.location}` : ''}
                  </p>
                  {entry.field ? (
                    <p className="font-mono text-xs text-accent">{entry.field}</p>
                  ) : null}
                  {entry.summary ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{entry.summary}</p>
                  ) : null}
                  {entry.grade ? (
                    <p className="mt-auto pt-4 text-sm">
                      <span className="text-muted">Result: </span>
                      {entry.grade}
                    </p>
                  ) : null}
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
