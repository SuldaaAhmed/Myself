import type { Metadata } from 'next';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Technology } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/technologies', {
    title: 'Technologies',
    description: 'The tools I reach for, grouped by where they sit in the stack.',
  });
}

const GROUP_LABELS: Record<string, string> = {
  frontend: 'Front end',
  backend: 'Back end',
  devops: 'Infrastructure',
  design: 'Design',
  tooling: 'Tooling',
  other: 'Other',
};

export default async function TechnologiesPage() {
  const technologies = await apiList<Technology>('/technologies', { tags: ['technologies'] });

  const grouped = technologies.reduce<Record<string, Technology[]>>((accumulator, technology) => {
    const key = technology.group ?? 'other';
    accumulator[key] = [...(accumulator[key] ?? []), technology];
    return accumulator;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Stack"
        title="Tools, not religion."
        description="I pick what fits the problem and the team that has to maintain it. These are the ones I know deeply."
      />

      <Section>
        {technologies.length === 0 ? (
          <EmptyState title="No technologies published yet" />
        ) : (
          <div className="space-y-16">
            {Object.entries(grouped).map(([group, items], groupIndex) => (
              <Reveal key={group} delay={groupIndex * 0.05}>
                <h2 className="eyebrow mb-6">{GROUP_LABELS[group] ?? group}</h2>
                <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((technology) => (
                    <li key={technology.id} className="bg-surface p-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-3">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: technology.color ?? 'var(--accent)' }}
                            aria-hidden
                          />
                          <span className="font-medium">{technology.name}</span>
                        </span>
                        {technology.level ? (
                          <span className="font-mono text-xs tabular-nums text-muted">
                            {technology.level}
                          </span>
                        ) : null}
                      </div>
                      {technology.level ? (
                        <div className="mt-3 h-px w-full bg-line">
                          <div
                            className="h-px"
                            style={{
                              width: `${technology.level}%`,
                              background: technology.color ?? 'var(--accent)',
                            }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
