import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { NavItem } from '@/components/site/site-header';
import type { SiteSettings } from '@/lib/api/types';

export function SiteFooter({
  settings,
  footerLinks,
}: {
  settings: SiteSettings;
  footerLinks: NavItem[];
}) {
  const identity = settings.identity ?? {};
  const contact = settings.contact ?? {};
  const socials = settings.social?.links ?? [];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="font-display text-2xl leading-snug">
              {identity.name ?? 'Portfolio'}
              <span className="text-accent">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {identity.footerNote ?? identity.tagline ?? ''}
            </p>
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="link-underline mt-6 inline-flex items-center gap-1.5 text-sm"
              >
                {contact.email}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </div>

          <nav aria-label="More pages">
            <p className="eyebrow mb-4">Explore</p>
            <ul className="grid grid-cols-2 gap-y-2.5 text-sm sm:grid-cols-1">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow mb-4">Elsewhere</p>
            <ul className="flex flex-col gap-2.5 text-sm">
              {socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
                  >
                    {social.label}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            {contact.location ? (
              <p className="mt-6 font-mono text-xs text-muted">{contact.location}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {identity.name ?? ''}. All rights reserved.
          </p>
          <p className="font-mono">
            Built with Next.js and NestJS ·{' '}
            <Link href="/admin" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
