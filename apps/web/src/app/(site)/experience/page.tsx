import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Badge, EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Experience } from '@/lib/api/types';
import { duration, formatRange } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/experience', {
    title: 'Experience',
    description: 'Roles, responsibilities and the outcomes attached to them.',
  });
}

export default async function ExperiencePage() {
  const roles = await apiList<Experience>('/experience', { tags: ['experience'] });

  return (
    <>
      <PageHeader
        eyebrow="Track record"
        title="Where I have worked."
        description="Each role lists what changed while I was there, not just what I was responsible for."
      />

      <Section>
        {roles.length === 0 ? (
          <EmptyState title="No roles published yet" />
        ) : (
          <ol className="relative">
            {/* The vertical rule that ties the timeline together. */}
            <span className="absolute left-0 top-2 hidden h-full w-px bg-line lg:block" aria-hidden />

            {roles.map((role, index) => (
              <Reveal as="li" key={role.id} delay={index * 0.05}>
                <div className="relative grid gap-6 border-b border-line py-10 lg:grid-cols-[14rem_1fr] lg:gap-14 lg:pl-10">
                  <span
                    className="absolute left-[-4px] top-12 hidden size-2 rounded-full bg-accent lg:block"
                    aria-hidden
                  />

                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-xs text-muted">{formatRange(role.startDate, role.endDate)}</p>
                    <p className="font-mono text-[0.6875rem] text-muted">
                      {duration(role.startDate, role.endDate)}
                    </p>
                    {role.current ? <Badge tone="mint" className="w-fit">Current</Badge> : null}
                  </div>

                  <div>
                    <h2 className="text-2xl leading-snug sm:text-3xl">{role.role}</h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                      {role.url ? (
                        <a
                          href={role.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-underline inline-flex items-center gap-1"
                        >
                          {role.company}
                          <ArrowUpRight className="size-3" aria-hidden />
                        </a>
                      ) : (
                        <span>{role.company}</span>
                      )}
                      {role.location ? <span>· {role.location}</span> : null}
                      {role.employmentType ? <span>· {role.employmentType}</span> : null}
                    </p>

                    {role.summary ? (
                      <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                        {role.summary}
                      </p>
                    ) : null}

                    {role.highlights.length > 0 ? (
                      <ul className="mt-5 space-y-2">
                        {role.highlights.map((highlight) => (
                          <li key={highlight} className="flex gap-3 text-sm text-muted">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {role.stack.length > 0 ? (
                      <ul className="mt-6 flex flex-wrap gap-1.5">
                        {role.stack.map((item) => (
                          <li key={item}>
                            <Badge>{item}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        )}
      </Section>
    </>
  );
}
