import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ContentStatus } from '@/lib/api/types';

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'accent' | 'mint' | 'warn' | 'danger' }) {
  const tones = {
    neutral: 'border-line bg-surface-muted text-muted',
    accent: 'border-accent/30 bg-accent-soft text-foreground',
    mint: 'border-secondary-accent/40 bg-secondary-accent/12 text-foreground',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function StatusPill({ status }: { status: ContentStatus }) {
  const map = {
    PUBLISHED: { tone: 'mint', label: 'Published' },
    DRAFT: { tone: 'warn', label: 'Draft' },
    ARCHIVED: { tone: 'neutral', label: 'Archived' },
  } as const;
  const entry = map[status] ?? map.DRAFT;

  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-muted', className)} {...props} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full min-w-3xl border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-line px-4 py-3 text-left text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-line/70 px-4 py-3 align-middle', className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-surface-muted/60', className)} {...props} />;
}

/** Numbers with a label — used on the home page and the dashboard. */
export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1 border-l border-line pl-4', className)}>
      <span className="font-display text-3xl leading-none tabular-nums">{value}</span>
      <span className="eyebrow">{label}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}
