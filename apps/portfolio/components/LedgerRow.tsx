'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { GithubIcon } from '@/components/BrandIcons';
import Link from 'next/link';
import { useId, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { riseIn } from '@/lib/motion';
import type { Project } from '@/lib/types';
import { cn, formatEntryId } from '@/lib/utils';

/**
 * One entry in the ledger.
 *
 * The row is a table-like line, not a card: an entry ID derived from the
 * project's start date, the title and summary, the tech stack, and a status
 * badge. It has two behaviours, chosen by the caller:
 *
 *   `accordion` — used on the home page's featured list. The row expands in
 *                 place to reveal the full description and links. A visitor
 *                 skimming three highlighted projects should not have to leave
 *                 the page and come back twice.
 *
 *   `link`      — used on `/projects`. The row navigates to the detail page.
 *                 A filterable ledger of every project is a directory, and a
 *                 directory's job is to get you out of it.
 *
 * Accessibility notes, since this is the component most likely to get it wrong:
 *
 *  - The accordion trigger is a real `<button>`. Enter and Space therefore work
 *    without a `keydown` handler, and a `div` with `onClick` — which supports
 *    neither — never enters the codebase.
 *  - `aria-expanded` and `aria-controls` tie the trigger to its panel, so a
 *    screen reader announces the state rather than silently revealing content.
 *  - The title is an `<h3>` wrapping the button, which keeps the ledger
 *    navigable by heading and preserves the document outline.
 *  - In `link` mode the anchor covers the whole row via a stretched overlay, so
 *    the click target is the full line while the accessible name stays the
 *    project title rather than the entire row's text read aloud.
 */

interface LedgerRowProps {
  project: Project;
  mode: 'accordion' | 'link';
  /**
   * Whether this row participates in the page-load stagger. Only the first few
   * rows do; see `MAX_STAGGERED_ROWS` in `lib/motion.ts`.
   */
  animate?: boolean;
}

/** Hover and focus feedback: a background tint and a border shift. No scale, no shadow. */
const ROW_INTERACTION =
  'transition-colors duration-hover hover:border-accent-amber/40 hover:bg-surface ' +
  'focus-within:border-accent-amber/40 focus-within:bg-surface';

export function LedgerRow({ project, mode, animate = false }: LedgerRowProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const titleId = useId();

  const entryId = formatEntryId(project.startedAt);

  // The grid is the row's whole layout contract: three columns on desktop
  // (ID · content · status), stacked on mobile where the ID and the status
  // share the first line and the content follows underneath.
  const grid = 'grid gap-3 md:grid-cols-[5.5rem_1fr_9rem] md:items-start md:gap-6';

  const rowBody = (
    <div className={grid}>
      <div className="flex items-center justify-between gap-4 md:block">
        <span className="font-mono text-label uppercase text-text-muted">{entryId}</span>
        {/* On mobile the badge rides beside the ID; on desktop it moves to
            column three. Rendering it twice and hiding one is cheaper and far
            less fragile than reordering a grid item across breakpoints. */}
        <span className="md:hidden">
          <StatusBadge status={project.status} />
        </span>
      </div>

      <div className="min-w-0">
        <h3
          id={titleId}
          className="font-display text-base font-medium tracking-normal text-text-primary md:text-lg"
        >
          {project.title}
        </h3>

        <p className="mt-1.5 font-body text-sm leading-relaxed text-text-muted">
          {project.summary}
        </p>

        {/*
          Tech stack as hairline chips. `aria-label` names the group so a screen
          reader introduces it instead of reading six disconnected words after
          the summary.
        */}
        <ul aria-label="Tech stack" className="mt-3 flex flex-wrap gap-1.5">
          {project.techStack.map((tech) => (
            <li
              key={tech}
              className="border border-border px-1.5 py-0.5 font-mono text-micro uppercase text-text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden items-center justify-end gap-3 md:flex">
        <StatusBadge status={project.status} />
        {mode === 'accordion' ? (
          <ChevronDown
            size={16}
            aria-hidden
            className={cn(
              'shrink-0 text-text-muted transition-transform duration-hover',
              expanded && 'rotate-180 text-accent-amber',
            )}
          />
        ) : null}
      </div>
    </div>
  );

  const content =
    mode === 'accordion' ? (
      <article className={cn('border-b border-border', ROW_INTERACTION)}>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="focus-ring block w-full rounded-sm px-4 py-5 text-left md:px-6"
        >
          {rowBody}
        </button>

        {/*
          Unmounted when collapsed rather than hidden. Content inside a
          `display: none` panel is out of the accessibility tree anyway, and
          unmounting keeps the links out of the tab order without relying on
          that.
        */}
        {expanded ? (
          <div
            id={panelId}
            role="region"
            aria-labelledby={titleId}
            className="border-t border-border/60 px-4 pb-6 pt-5 md:px-6 md:pl-[8.5rem]"
          >
            <p className="max-w-2xl font-body text-sm leading-relaxed text-text-muted">
              {project.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                >
                  <ExternalLink size={13} aria-hidden />
                  Live site
                  <span className="sr-only">for {project.title} (opens in a new tab)</span>
                </a>
              ) : null}

              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                >
                  <GithubIcon size={13} />
                  Repository
                  <span className="sr-only">for {project.title} (opens in a new tab)</span>
                </a>
              ) : null}

              <Link
                href={`/projects/${project.slug}`}
                className="focus-ring rounded-sm font-mono text-label uppercase text-text-muted transition-colors duration-hover hover:text-accent-amber"
              >
                Full entry →<span className="sr-only"> for {project.title}</span>
              </Link>
            </div>
          </div>
        ) : null}
      </article>
    ) : (
      <article className={cn('relative border-b border-border', ROW_INTERACTION)}>
        <div className="px-4 py-5 md:px-6">{rowBody}</div>

        {/*
          The stretched link. `absolute inset-0` makes the entire row clickable
          while the anchor's accessible name stays "Sarif V2 — remittance core",
          which is what a link list should read like. The visible title is
          `aria-hidden` on the anchor's behalf via `sr-only` text instead of
          nesting interactive content.
        */}
        <Link href={`/projects/${project.slug}`} className="focus-ring absolute inset-0 rounded-sm">
          <span className="sr-only">{project.title} — read the full entry</span>
        </Link>
      </article>
    );

  // Rows outside the stagger window render as plain list items: a `motion.li`
  // with no variant still mounts Framer's machinery for nothing.
  if (!animate) return <li>{content}</li>;

  return <motion.li variants={riseIn}>{content}</motion.li>;
}
