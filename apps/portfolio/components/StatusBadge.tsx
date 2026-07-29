import { statusPresentation } from '@/lib/status';
import type { ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * `LIVE` / `IN PROGRESS` / `ARCHIVED`, in the status colour.
 *
 * Colour is not the only carrier of meaning here — the label is always spelled
 * out. A badge that communicated "live" purely as a green square would be
 * unreadable to anyone who cannot distinguish it from the amber one, which is
 * the most common failure in status UI.
 */
export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const { label, text, border, background, dot } = statusPresentation(status);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-label uppercase',
        text,
        border,
        background,
        className,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5', dot)} />
      {label}
    </span>
  );
}
