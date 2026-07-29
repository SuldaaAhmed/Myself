import type { ProjectStatus } from './types';

/**
 * The one place a project status turns into words and colour.
 *
 * Class names are written out in full rather than composed
 * (`` `text-status-${key}` ``) because Tailwind scans source files as text: a
 * class it never sees as a complete literal is never generated, and the badge
 * would render unstyled in production while looking fine in dev.
 */
interface StatusPresentation {
  /** Human-facing text. The API sends `IN_PROGRESS`; nobody should read that. */
  label: string;
  /** Badge text colour. */
  text: string;
  /** Badge border, at low opacity so the hairline reads as a tint. */
  border: string;
  /** Badge fill, barely there — the colour comes from the text. */
  background: string;
  /** The small square that precedes the label. */
  dot: string;
}

const STATUS_PRESENTATION: Record<ProjectStatus, StatusPresentation> = {
  LIVE: {
    label: 'LIVE',
    text: 'text-status-live',
    border: 'border-status-live/40',
    background: 'bg-status-live/10',
    dot: 'bg-status-live',
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    text: 'text-status-progress',
    border: 'border-status-progress/40',
    background: 'bg-status-progress/10',
    dot: 'bg-status-progress',
  },
  ARCHIVED: {
    label: 'ARCHIVED',
    /*
      The one place a status badge does not use its own token for text.
      `status.archived` (#5A6472) measures 3.2:1 against `ink` — enough for a
      graphical element, short of the 4.5:1 that 11px badge text needs. So the
      label is drawn in `text.muted` (6.1:1) while the dot and border keep the
      archived colour, which is what actually carries the "this one is quiet"
      signal. Changing the token instead would have meant overriding a value the
      design system specifies; this keeps the token intact and fixes the single
      usage that fails.
    */
    text: 'text-text-muted',
    border: 'border-status-archived/40',
    background: 'bg-status-archived/10',
    dot: 'bg-status-archived',
  },
};

export function statusPresentation(status: ProjectStatus): StatusPresentation {
  return STATUS_PRESENTATION[status];
}

/** Display order for the status filter on `/projects`. */
export const PROJECT_STATUSES: ProjectStatus[] = ['LIVE', 'IN_PROGRESS', 'ARCHIVED'];
