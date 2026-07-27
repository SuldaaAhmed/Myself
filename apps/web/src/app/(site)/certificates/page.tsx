import type { Metadata } from 'next';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Badge, EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { Certificate } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/certificates', {
    title: 'Certificates',
    description: 'Verified certifications and completed professional courses.',
  });
}

export default async function CertificatesPage() {
  const certificates = await apiList<Certificate>('/certificates', { tags: ['certificates'] });
  const now = Date.now();

  return (
    <>
      <PageHeader
        eyebrow="Credentials"
        title="Certified, and still current."
        description="Every entry links to its verification page where the issuer provides one."
      />

      <Section>
        {certificates.length === 0 ? (
          <EmptyState title="No certificates published yet" />
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-2">
            {certificates.map((certificate, index) => {
              const expired = certificate.expiresAt
                ? new Date(certificate.expiresAt).getTime() < now
                : false;

              return (
                <Reveal key={certificate.id} delay={(index % 2) * 0.06} className="bg-surface">
                  <li className="flex h-full flex-col gap-4 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <BadgeCheck
                        className={expired ? 'size-5 text-muted' : 'size-5 text-[var(--secondary-accent)]'}
                        aria-hidden
                      />
                      {expired ? <Badge>Expired</Badge> : <Badge tone="mint">Valid</Badge>}
                    </div>

                    <div>
                      <h2 className="text-xl leading-snug">{certificate.title}</h2>
                      <p className="mt-1.5 text-sm text-muted">{certificate.issuer}</p>
                    </div>

                    <dl className="mt-auto space-y-1.5 pt-4 font-mono text-xs text-muted">
                      <div className="flex justify-between gap-4">
                        <dt>Issued</dt>
                        <dd>{formatDate(certificate.issuedAt)}</dd>
                      </div>
                      {certificate.expiresAt ? (
                        <div className="flex justify-between gap-4">
                          <dt>Expires</dt>
                          <dd>{formatDate(certificate.expiresAt)}</dd>
                        </div>
                      ) : null}
                      {certificate.credentialId ? (
                        <div className="flex justify-between gap-4">
                          <dt>ID</dt>
                          <dd className="truncate">{certificate.credentialId}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {certificate.credentialUrl ? (
                      <a
                        href={certificate.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex w-fit items-center gap-1.5 text-sm"
                      >
                        Verify credential
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    ) : null}
                  </li>
                </Reveal>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
