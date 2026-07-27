import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Faq } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/faq', {
    title: 'FAQ',
    description: 'Pricing, process, ownership and availability — answered plainly.',
  });
}

export default async function FaqPage() {
  const faqs = await apiList<Faq>('/faq', { tags: ['faq'] });

  const grouped = faqs.reduce<Record<string, Faq[]>>((accumulator, faq) => {
    const key = faq.category ?? 'General';
    accumulator[key] = [...(accumulator[key] ?? []), faq];
    return accumulator;
  }, {});

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      {faqs.length > 0 ? (
        <script
          type="application/ld+json"
          // JSON-LD we build ourselves — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}

      <PageHeader
        eyebrow="FAQ"
        title="The questions I get asked most."
        description="If yours is not here, ask it directly — I answer every message myself."
      />

      <Section>
        {faqs.length === 0 ? (
          <EmptyState title="No questions published yet" />
        ) : (
          <div className="grid gap-14 lg:grid-cols-[18rem_1fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm leading-relaxed text-muted">
                Everything below is how I actually work — not aspirational policy.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-6">
                <Link href="/contact">
                  Ask something else
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            <div className="space-y-14">
              {Object.entries(grouped).map(([group, items], groupIndex) => (
                <Reveal key={group} delay={groupIndex * 0.05}>
                  <h2 className="eyebrow mb-4">{group}</h2>
                  <Accordion type="single" collapsible className="border-t border-line">
                    {items.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} question={faq.question}>
                        {faq.answer}
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
