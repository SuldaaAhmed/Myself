import Link from 'next/link';

/**
 * 404 — reached by an unknown route, and by `notFound()` in
 * `/projects/[slug]` when a slug does not resolve.
 *
 * Written in the ledger's voice: a missing record, not a sad robot. It offers
 * the two places worth going next rather than a single "go home" button that
 * makes a visitor start over.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-start px-6 py-24 md:py-32 lg:px-8">
      <p className="font-mono text-label uppercase text-accent-amber">Error 404</p>

      <h1 className="mt-5 font-display text-3xl font-semibold text-text-primary md:text-5xl">
        No entry at this address
      </h1>

      <p className="mt-4 max-w-md font-body text-base leading-relaxed text-text-muted">
        The page you asked for is not in the ledger. It may have been renamed, or
        the link may have been mistyped.
      </p>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
        <Link
          href="/"
          className="focus-ring rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
        >
          Return home
        </Link>
        <Link
          href="/projects"
          className="focus-ring rounded-sm font-mono text-label uppercase text-accent-blue transition-colors duration-hover hover:text-accent-amber"
        >
          Browse all projects
        </Link>
      </div>
    </div>
  );
}
