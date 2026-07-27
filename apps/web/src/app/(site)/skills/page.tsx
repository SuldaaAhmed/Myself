import type { Metadata } from 'next';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { SkillGroup } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/skills', {
    title: 'Skills',
    description: 'Engineering, interface and operations capabilities, with honest proficiency levels.',
  });
}

export default async function SkillsPage() {
  const groups = await apiList<SkillGroup>('/skill-groups', { tags: ['skills'], limit: 20 });

  return (
    <>
      <PageHeader
        eyebrow="Capabilities"
        title="What I actually do, and how well."
        description="Levels are self-assessed and deliberately unflattering — an 80 means I am productive, not that I have nothing left to learn."
      />

      <Section>
        {groups.length === 0 ? (
          <EmptyState title="No skills published yet" />
        ) : (
          <div className="space-y-20">
            {groups.map((group, groupIndex) => (
              <Reveal key={group.id} delay={groupIndex * 0.05}>
                <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-16">
                  <div>
                    <p className="font-mono text-xs text-muted">
                      {String(groupIndex + 1).padStart(2, '0')}
                    </p>
                    <h2 className="mt-2 text-3xl">{group.name}</h2>
                  </div>

                  <ul className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
                    {(group.skills ?? []).map((skill) => (
                      <li key={skill.id}>
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-base font-medium">{skill.name}</h3>
                          <span className="font-mono text-xs tabular-nums text-muted">
                            {skill.years ? `${skill.years}y · ` : ''}
                            {skill.level}
                          </span>
                        </div>
                        <div className="mt-2.5 h-px w-full bg-line">
                          <div className="h-px bg-accent" style={{ width: `${skill.level}%` }} />
                        </div>
                        {skill.description ? (
                          <p className="mt-2.5 text-sm leading-relaxed text-muted">{skill.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
