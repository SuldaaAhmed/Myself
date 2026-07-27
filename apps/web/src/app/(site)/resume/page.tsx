import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { PrintButton } from '@/components/site/print-button';
import { PageHeader, Section } from '@/components/site/section';
import { Button } from '@/components/ui/button';
import { apiList } from '@/lib/api/server';
import { buildMetadata, getSettings } from '@/lib/api/site';
import type { Certificate, Education, Experience, SkillGroup } from '@/lib/api/types';
import { formatDate, formatRange } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/resume', {
    title: 'Résumé',
    description: 'A printable summary of experience, education, skills and certifications.',
  });
}

export default async function ResumePage() {
  const [settings, experience, education, groups, certificates] = await Promise.all([
    getSettings(),
    apiList<Experience>('/experience', { tags: ['experience'] }),
    apiList<Education>('/education', { tags: ['education'] }),
    apiList<SkillGroup>('/skill-groups', { tags: ['skills'], limit: 20 }),
    apiList<Certificate>('/certificates', { tags: ['certificates'] }),
  ]);

  const resume = settings.resume ?? {};
  const identity = settings.identity ?? {};
  const contact = settings.contact ?? {};

  return (
    <>
      <PageHeader eyebrow="Résumé" title={resume.headline ?? identity.role ?? 'Résumé'} description={resume.summary}>
        <div className="flex flex-wrap gap-3">
          {resume.fileUrl ? (
            <Button asChild>
              <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="size-4" />
                Download PDF
              </a>
            </Button>
          ) : null}
          <PrintButton />
        </div>
      </PageHeader>

      <Section>
        <div className="mx-auto max-w-4xl space-y-16">
          <header className="border-b border-line pb-8">
            <h2 className="font-display text-3xl">{identity.name}</h2>
            <p className="mt-1 text-muted">{identity.role}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
              {contact.email ? <li>{contact.email}</li> : null}
              {contact.phone ? <li>{contact.phone}</li> : null}
              {contact.location ? <li>{contact.location}</li> : null}
              {(settings.social?.links ?? []).map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link-underline" target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </header>

          {resume.highlights?.length ? (
            <section>
              <h3 className="eyebrow mb-5">Selected highlights</h3>
              <ul className="space-y-2.5">
                {resume.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm text-muted">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    {highlight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {experience.length > 0 ? (
            <section>
              <h3 className="eyebrow mb-6">Experience</h3>
              <ol className="space-y-8">
                {experience.map((role) => (
                  <li key={role.id} className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
                    <p className="font-mono text-xs text-muted">{formatRange(role.startDate, role.endDate)}</p>
                    <div>
                      <p className="text-base font-medium">
                        {role.role} — {role.company}
                      </p>
                      {role.location ? <p className="text-xs text-muted">{role.location}</p> : null}
                      {role.highlights.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {role.highlights.map((highlight) => (
                            <li key={highlight} className="text-sm text-muted">
                              — {highlight}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {groups.length > 0 ? (
            <section>
              <h3 className="eyebrow mb-6">Skills</h3>
              <dl className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
                    <dt className="text-sm font-medium">{group.name}</dt>
                    <dd className="text-sm text-muted">
                      {(group.skills ?? []).map((skill) => skill.name).join(' · ')}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {education.length > 0 ? (
            <section>
              <h3 className="eyebrow mb-6">Education</h3>
              <ol className="space-y-6">
                {education.map((entry) => (
                  <li key={entry.id} className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
                    <p className="font-mono text-xs text-muted">
                      {formatRange(entry.startDate, entry.endDate)}
                    </p>
                    <div>
                      <p className="text-base font-medium">{entry.degree}</p>
                      <p className="text-sm text-muted">
                        {entry.institution}
                        {entry.grade ? ` · ${entry.grade}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {certificates.length > 0 ? (
            <section>
              <h3 className="eyebrow mb-6">Certifications</h3>
              <ol className="space-y-3">
                {certificates.map((certificate) => (
                  <li key={certificate.id} className="grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-8">
                    <p className="font-mono text-xs text-muted">{formatDate(certificate.issuedAt)}</p>
                    <p className="text-sm">
                      {certificate.title} <span className="text-muted">· {certificate.issuer}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </Section>
    </>
  );
}

