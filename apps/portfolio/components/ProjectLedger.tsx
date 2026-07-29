'use client';

import { useMemo, useState } from 'react';
import { LedgerRow } from '@/components/LedgerRow';
import { PROJECT_STATUSES, statusPresentation } from '@/lib/status';
import type { Project, ProjectStatus } from '@/lib/types';
import { cn, collectTechStack } from '@/lib/utils';

/**
 * The full project ledger with tag and status filters — the body of
 * `/projects`.
 *
 * Filtering happens in the browser over the already-fetched list rather than by
 * re-requesting the API per filter. A portfolio has tens of projects, not
 * thousands: the entire list is smaller than the round trip it would take to
 * narrow it, and filtering locally means every combination responds instantly
 * and works offline once the page is loaded.
 *
 * Filter state is component state, not URL state. The tradeoff is deliberate
 * and worth naming: putting it in the query string would make a filtered view
 * shareable and survive the back button, at the cost of a `useSearchParams`
 * Suspense boundary around this tree. For a list this size the sharing case is
 * thin — if it stops being thin, this is the component to change, and nothing
 * else has to move.
 *
 * Rows render in `link` mode: this is a directory, and its job is to get you to
 * a project's own page.
 */

/** `null` means "no filter applied", which is distinct from any real value. */
type StatusFilter = ProjectStatus | null;
type TechFilter = string | null;

export function ProjectLedger({ projects }: { projects: Project[] }) {
  const [status, setStatus] = useState<StatusFilter>(null);
  const [tech, setTech] = useState<TechFilter>(null);

  // Derived from the data, so the filter list is exactly the set of tags that
  // can match something. A hardcoded list eventually offers a filter that
  // returns nothing.
  const techOptions = useMemo(() => collectTechStack(projects), [projects]);

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        if (status && project.status !== status) return false;
        if (tech && !project.techStack.includes(tech)) return false;
        return true;
      }),
    [projects, status, tech],
  );

  const hasFilters = status !== null || tech !== null;

  return (
    <div>
      {/* No top border: the section header above already draws one, and two
          hairlines separated by a margin reads as a mistake rather than as a
          rule. */}
      <div className="space-y-5 border-b border-border py-6">
        <FilterGroup label="Status">
          <FilterChip active={status === null} onClick={() => setStatus(null)}>
            All
          </FilterChip>
          {PROJECT_STATUSES.map((value) => (
            <FilterChip
              key={value}
              active={status === value}
              onClick={() => setStatus(status === value ? null : value)}
            >
              {statusPresentation(value).label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Stack">
          <FilterChip active={tech === null} onClick={() => setTech(null)}>
            All
          </FilterChip>
          {techOptions.map((value) => (
            <FilterChip
              key={value}
              active={tech === value}
              onClick={() => setTech(tech === value ? null : value)}
            >
              {value}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>

      {/*
        The result count is announced politely, so a screen-reader user who
        changes a filter hears how many entries are left instead of having to
        go and count them.
      */}
      <p aria-live="polite" className="mt-6 font-mono text-label uppercase text-text-muted">
        Showing {filtered.length} of {projects.length}{' '}
        {projects.length === 1 ? 'entry' : 'entries'}
        {hasFilters ? (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => {
                setStatus(null);
                setTech(null);
              }}
              className="focus-ring rounded-sm uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
            >
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 border border-dashed border-border px-6 py-12 text-center font-mono text-label uppercase text-text-muted">
          No entries match these filters
        </p>
      ) : (
        <ol className="ledger-rail mt-6 border-t border-border">
          {filtered.map((project) => (
            <LedgerRow key={project.id} project={project} mode="link" />
          ))}
        </ol>
      )}
    </div>
  );
}

/** A labelled row of filter chips. `role="group"` names the set for assistive tech. */
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <span className="shrink-0 font-mono text-label uppercase text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * A toggle, not a link.
 *
 * `aria-pressed` is what makes it announce as "pressed"/"not pressed" rather
 * than as an unlabelled button — without it, the only signal that a filter is
 * active is the amber border, which is exactly the kind of colour-only state
 * this design has to avoid.
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-ring rounded-sm border px-2.5 py-1 font-mono text-label uppercase transition-colors duration-hover',
        active
          ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
          : 'border-border text-text-muted hover:border-text-muted hover:text-text-primary',
      )}
    >
      {children}
    </button>
  );
}
