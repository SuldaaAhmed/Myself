import type { Metadata } from 'next';
import { ArrowUpRight, CalendarClock, Mail, MapPin } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { ContactForm } from '@/components/site/contact-form';
import { PageHeader, Section } from '@/components/site/section';
import { apiList } from '@/lib/api/server';
import { buildMetadata, getSettings } from '@/lib/api/site';
import type { Faq } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/contact', {
    title: 'Contact',
    description: 'Tell me about the work. I read and answer every message myself.',
  });
}

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([
    getSettings(),
    apiList<Faq>('/faq', { tags: ['faq'], limit: 4 }),
  ]);

  const contact = settings.contact ?? {};

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={contact.formHeading ?? 'Tell me about the work.'}
        description={contact.formSubheading ?? 'A few sentences about the problem is plenty to start.'}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
          <Reveal>
            <ContactForm budgetOptions={contact.budgetOptions ?? []} />
          </Reveal>

          <Reveal delay={0.1} className="space-y-8">
            <div className="card p-6">
              <p className="eyebrow mb-5">Direct</p>
              <ul className="space-y-4 text-sm">
                {contact.email ? (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <a href={`mailto:${contact.email}`} className="link-underline break-all">
                      {contact.email}
                    </a>
                  </li>
                ) : null}
                {contact.location ? (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span className="text-muted">{contact.location}</span>
                  </li>
                ) : null}
                {contact.responseTime ? (
                  <li className="flex items-start gap-3">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span className="text-muted">{contact.responseTime}</span>
                  </li>
                ) : null}
              </ul>

              {contact.calendarUrl ? (
                <a
                  href={contact.calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-6 inline-flex items-center gap-1.5 text-sm"
                >
                  Book a call instead
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              ) : null}
            </div>

            {(settings.social?.links ?? []).length > 0 ? (
              <div className="card p-6">
                <p className="eyebrow mb-5">Elsewhere</p>
                <ul className="space-y-3 text-sm">
                  {(settings.social?.links ?? []).map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        </div>
      </Section>

      {faqs.length > 0 ? (
        <Section className="border-t border-line pt-0">
          <h2 className="mb-8 text-2xl">Before you write</h2>
          <dl className="grid gap-8 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.id}>
                <dt className="font-display text-lg">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}
    </>
  );
}
