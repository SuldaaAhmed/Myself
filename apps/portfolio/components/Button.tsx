import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The site's two button treatments, defined once.
 *
 * The hero, the contact form and the project detail pages all need the same
 * primary/secondary pair. Defining them here rather than repeating a class
 * string means the focus ring, the height and the disabled state cannot drift
 * apart between call sites — which is how a "mostly accessible" UI happens.
 */

type Variant = 'primary' | 'secondary';
type Size = 'md' | 'sm';

const BASE =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-sm border font-display ' +
  'uppercase tracking-ui transition-colors duration-hover ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  // Amber is loud on purpose and used once per viewport: the single next action.
  primary:
    'border-accent-amber bg-accent-amber text-ink hover:bg-accent-amber/85 hover:border-accent-amber/85',
  // Outline. Present, clearly clickable, not competing with the primary.
  secondary:
    'border-border bg-transparent text-text-primary hover:border-accent-amber/60 hover:text-accent-amber',
};

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  sm: 'h-9 px-4 text-label',
};

function buttonClass(variant: Variant, size: Size, className?: string): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** A real `<button>`. Use for actions: submitting, toggling, filtering. */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

/**
 * A link that looks like a button. Use for navigation.
 *
 * Kept separate from `Button` rather than accepting an optional `href`, because
 * the distinction is semantic: "go somewhere" is an anchor and belongs in the
 * browser's history and context menu, "do something" is a button. Internal
 * hrefs route through `next/link` for prefetching; anything external or
 * protocol-prefixed (`mailto:`, `/resume.pdf`) falls through to a plain anchor
 * and gets `rel="noreferrer"`.
 */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const classes = buttonClass(variant, size, className);
  const isInternal = href.startsWith('/') && !href.startsWith('//') && !href.endsWith('.pdf');

  if (isInternal) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  const isExternal = /^https?:\/\//.test(href);

  return (
    <a
      href={href}
      className={classes}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...props}
    >
      {children}
    </a>
  );
}
