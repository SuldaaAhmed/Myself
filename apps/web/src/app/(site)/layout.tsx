import { CursorSpotlight } from '@/components/motion/ambient';
import { AnalyticsTracker } from '@/components/site/analytics-tracker';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getSettings } from '@/lib/api/site';

const FALLBACK_PRIMARY = [
  { label: 'Work', href: '/projects' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Writing', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const FALLBACK_FOOTER = [
  { label: 'Case studies', href: '/case-studies' },
  { label: 'Skills', href: '/skills' },
  { label: 'Technologies', href: '/technologies' },
  { label: 'Experience', href: '/experience' },
  { label: 'Education', href: '/education' },
  { label: 'Certificates', href: '/certificates' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Résumé', href: '/resume' },
  { label: 'FAQ', href: '/faq' },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const identity = settings.identity ?? {};

  return (
    <>
      <CursorSpotlight enabled={settings.theme?.showSpotlight !== false} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Skip to content
      </a>

      <SiteHeader
        items={settings.navigation?.primary ?? FALLBACK_PRIMARY}
        monogram={identity.initials ?? 'AA'}
        name={identity.name ?? 'Portfolio'}
      />

      <main id="main" className="relative">
        {children}
      </main>

      <SiteFooter settings={settings} footerLinks={settings.navigation?.footer ?? FALLBACK_FOOTER} />
      <AnalyticsTracker />
    </>
  );
}
