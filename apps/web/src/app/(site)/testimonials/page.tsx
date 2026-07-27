import type { Metadata } from 'next';
import Image from 'next/image';
import { Quote, Star } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Testimonial } from '@/lib/api/types';
import { initials } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/testimonials', {
    title: 'Testimonials',
    description: 'What clients and colleagues say about working together.',
  });
}

export default async function TestimonialsPage() {
  const testimonials = await apiList<Testimonial>('/testimonials', { tags: ['testimonials'] });

  return (
    <>
      <PageHeader
        eyebrow="References"
        title="In their words."
        description="Unedited, attributed, and happy to be contacted for a longer conversation."
      />

      <Section>
        {testimonials.length === 0 ? (
          <EmptyState title="No testimonials published yet" />
        ) : (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {testimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delay={(index % 3) * 0.06} className="mb-6 break-inside-avoid">
                <figure className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-7">
                  <Quote className="size-5 text-accent" aria-hidden />
                  <blockquote className="text-[0.9375rem] leading-relaxed">“{testimonial.quote}”</blockquote>

                  <figcaption className="flex items-center gap-3 border-t border-line pt-5">
                    {testimonial.avatarUrl ? (
                      <Image
                        src={testimonial.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-full bg-surface-muted font-mono text-xs">
                        {initials(testimonial.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{testimonial.name}</p>
                      <p className="truncate text-xs text-muted">
                        {[testimonial.role, testimonial.company].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    {testimonial.rating ? (
                      <div
                        className="ml-auto flex shrink-0 gap-0.5"
                        aria-label={`${testimonial.rating} out of 5`}
                      >
                        {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                          <Star key={starIndex} className="size-3 fill-accent text-accent" aria-hidden />
                        ))}
                      </div>
                    ) : null}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
