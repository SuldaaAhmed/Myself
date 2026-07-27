import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Service } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/services', {
    title: 'Services',
    description: 'Product engineering, performance audits, design systems and platform work.',
  });
}

export default async function ServicesPage() {
  const services = await apiList<Service>('/services', { tags: ['services'] });

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Ways of working together."
        description="Every engagement is scoped around a problem and a measure of success — not a list of deliverables."
      />

      <Section>
        {services.length === 0 ? (
          <EmptyState title="No services published yet" description="Add them from the dashboard." />
        ) : (
          <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-2">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index * 0.06} className="bg-surface">
                <article className="flex h-full flex-col gap-5 p-8 sm:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl sm:text-3xl">{service.title}</h2>
                    <span className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-[0.9375rem] leading-relaxed text-muted">{service.description}</p>

                  {service.features.length > 0 ? (
                    <ul className="space-y-2.5 border-t border-line pt-5">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-[var(--secondary-accent)]" aria-hidden />
                          <span className="text-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    {service.priceFrom ? (
                      <span className="font-mono text-sm text-accent">{service.priceFrom}</span>
                    ) : (
                      <span />
                    )}
                    <Link
                      href={`/contact?service=${service.slug}`}
                      className="link-underline inline-flex items-center gap-1.5 text-sm"
                    >
                      Enquire
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl">Not sure which one fits?</h2>
            <p className="mt-3 max-w-xl text-muted">
              Describe the problem and I will tell you what I would do first — even if that is nothing.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/contact">
              Get in touch
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </Section>
    </>
  );
}
