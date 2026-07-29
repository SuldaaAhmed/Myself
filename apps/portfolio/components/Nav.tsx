'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Site navigation.
 *
 * A client component for three reasons, all of them real: it reads the current
 * pathname to mark the active route, it owns the open/closed state of the
 * mobile menu, and it listens for Escape. Everything it renders is static
 * markup, so the cost is small and confined to the header.
 *
 * `profileName` is passed in from the layout rather than fetched here — the
 * logo is content, and content comes from the API.
 */

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav({ profileName }: { profileName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the menu on navigation. Without this, tapping a link on mobile routes
  // to the new page and leaves the overlay covering it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the menu, matching what every other overlay on the web does.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  /**
   * `/projects` should stay marked while reading `/projects/sarif-v2`, so a
   * nested route counts as active. `/` and hash links must match exactly, or
   * every route would light up the home link.
   */
  const isActive = (href: string): boolean => {
    if (href.startsWith('/#')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    /* Opaque, not translucent. A blurred glass header lets the ledger rows
       smear through it while scrolling, which is the opposite of the crisp
       readout this design is after. */
    <nav aria-label="Primary" className="border-b border-border bg-ink">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="focus-ring rounded-sm font-display text-sm font-semibold uppercase tracking-brand text-text-primary transition-colors duration-hover hover:text-accent-amber"
        >
          {profileName}
        </Link>

        {/* Desktop links — hidden below md, where the hamburger takes over. */}
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'focus-ring rounded-sm font-display text-label uppercase transition-colors duration-hover',
                  isActive(link.href)
                    ? 'text-accent-amber'
                    : 'text-text-muted hover:text-text-primary',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="focus-ring -mr-2 rounded-sm p-2 text-text-muted transition-colors duration-hover hover:text-text-primary md:hidden"
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </div>

      {/*
        The mobile panel is unmounted when closed rather than hidden with CSS,
        so its links are genuinely out of the tab order — a `display: none`
        menu is invisible but a `visibility: visible` one that is merely off
        screen is still focusable, which strands keyboard users on a hidden
        control.
      */}
      {open && (
        <div id={menuId} className="border-t border-border md:hidden">
          <ul className="mx-auto max-w-content px-6 py-2">
            {LINKS.map((link) => (
              <li key={link.href} className="border-b border-border/60 last:border-b-0">
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'focus-ring block rounded-sm py-4 font-display text-label uppercase',
                    isActive(link.href) ? 'text-accent-amber' : 'text-text-muted',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
