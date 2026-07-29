import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

/**
 * The heading that opens every ledger section.
 *
 * A numbered monospace index on the left, a display heading, an optional line
 * of context, and an optional link out to the full view. Extracted because five
 * sections need exactly this arrangement, and because the heading level has to
 * be a prop: `/projects` uses this as its `h1`, the home page uses it as an
 * `h2`, and hardcoding either would break the document outline on one of them.
 */

interface SectionHeaderProps {
  /** Monospace index printed above the heading, e.g. `002`. */
  index: string;
  title: string;
  /** One line of context under the heading. Optional. */
  description?: string;
  /** Rendered heading level. Keep the document outline in order. */
  as?: 'h1' | 'h2';
  /** `id` for the heading, so a section can be `aria-labelledby` it. */
  id?: string;
  /** Optional "see everything" link, right-aligned on desktop. */
  action?: { href: string; label: string };
}

export function SectionHeader({
  index,
  title,
  description,
  as: Heading = 'h2',
  id,
  action,
}: SectionHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-label uppercase text-text-muted">
          <span className="text-accent-amber">{index}</span>
          <span aria-hidden> / </span>
          {title}
        </p>

        <Heading
          id={id}
          className="mt-3 font-display text-2xl font-semibold text-text-primary md:text-4xl"
        >
          {title}
        </Heading>

        {description ? (
          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
        >
          {action.label}
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      ) : null}
    </header>
  );
}
