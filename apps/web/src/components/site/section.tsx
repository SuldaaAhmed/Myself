import Link from 'next/link';
import * as React from 'react';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

/** Section wrapper: consistent vertical rhythm across every page. */
export function Section({
  children,
  className,
  id,
  bleed = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn('py-20 sm:py-28', className)}>
      {bleed ? children : <div className="container-page">{children}</div>}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  align?: 'left' | 'center';
}) {
  return (
    <Reveal
      className={cn(
        'mb-12 flex flex-col gap-4 sm:mb-16',
        align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="text-balance text-3xl leading-[1.1] sm:text-4xl lg:text-[2.75rem]">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="link-underline shrink-0 self-start font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-foreground sm:self-end"
        >
          {action.label}
        </Link>
      ) : null}
    </Reveal>
  );
}

/** The masthead every inner page starts with. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative border-b border-line">
      <div className="grid-canvas absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="container-page py-20 sm:py-28">
        <Reveal>
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1 className="max-w-4xl text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </div>
    </header>
  );
}
