'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/SectionHeader';
import { LedgerRow } from '@/components/LedgerRow';
import { MAX_STAGGERED_ROWS, staggerContainer } from '@/lib/motion';
import type { Project } from '@/lib/types';

/**
 * A ledger: a heading and a list of project rows.
 *
 * The list is an `<ol>`, not a grid of cards. That is the design decision the
 * whole page rests on — entries are ordered records with an index, and the
 * markup should say so. It also means the reading order, the keyboard order and
 * the visual order are the same thing by construction.
 *
 * A client component because it is the parent of the page-load stagger: Framer
 * propagates `hidden`/`visible` from this `motion.ol` down to the `motion.li`
 * inside each row, so the animation is declared once here instead of being
 * timed row by row.
 */

interface LedgerSectionProps {
  projects: Project[];
  /** `accordion` expands rows in place; `link` routes to the detail page. */
  mode: 'accordion' | 'link';
  /** Monospace index shown above the heading, e.g. `002`. */
  index: string;
  title: string;
  description?: string;
  /** Heading level. `/projects` passes `h1`; the home page uses the default. */
  as?: 'h1' | 'h2';
  action?: { href: string; label: string };
  /**
   * Whether to run the page-load stagger. Sections below the fold pass `false`:
   * animating them would either fire off-screen and be missed, or require
   * scroll-triggered motion, which the brief rules out.
   */
  animateOnLoad?: boolean;
  /** Anchor target, so the nav and skip link can jump straight here. */
  id?: string;
}

export function LedgerSection({
  projects,
  mode,
  index,
  title,
  description,
  as = 'h2',
  action,
  animateOnLoad = false,
  id,
}: LedgerSectionProps) {
  const headingId = `${id ?? title.toLowerCase().replace(/\s+/g, '-')}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className="border-b border-border">
      <div className="mx-auto max-w-content px-6 py-12 md:py-24 lg:px-8">
        <SectionHeader
          index={index}
          title={title}
          description={description}
          as={as}
          id={headingId}
          action={action}
        />

        {projects.length === 0 ? (
          /*
            The empty state is content, not an absence of it. A blank area or a
            permanent spinner leaves a visitor unsure whether the site is broken
            or the ledger is genuinely empty; this says which.
          */
          <p className="mt-10 border border-dashed border-border px-6 py-12 text-center font-mono text-label uppercase text-text-muted">
            No entries yet
          </p>
        ) : (
          <motion.ol
            variants={staggerContainer}
            initial={animateOnLoad ? 'hidden' : false}
            animate="visible"
            className="ledger-rail mt-10 border-t border-border"
          >
            {projects.map((project, position) => (
              <LedgerRow
                key={project.id}
                project={project}
                mode={mode}
                animate={animateOnLoad && position < MAX_STAGGERED_ROWS}
              />
            ))}
          </motion.ol>
        )}
      </div>
    </section>
  );
}
