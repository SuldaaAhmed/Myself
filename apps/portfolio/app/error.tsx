'use client';

import { useEffect } from 'react';
import { Button } from '@/components/Button';

/**
 * Route-level error boundary.
 *
 * Must be a client component — React needs an event handler to reset the
 * boundary, and `reset()` is that handler.
 *
 * The error message itself is deliberately not rendered. In production Next
 * replaces it with a generic string anyway, and surfacing a raw message would
 * risk leaking an internal hostname or query into the page. It is logged
 * instead, where an operator can see it and a visitor cannot.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-content flex-col items-start px-6 py-24 md:py-32 lg:px-8">
      <p className="font-mono text-label uppercase text-accent-amber">System fault</p>

      <h1 className="mt-5 font-display text-3xl font-semibold text-text-primary md:text-5xl">
        Something failed while loading this page
      </h1>

      <p className="mt-4 max-w-md font-body text-base leading-relaxed text-text-muted">
        The content service did not answer as expected. Trying again usually
        resolves it.
      </p>

      {/* The digest is the only identifier that connects what the visitor saw
          to a line in the server log, so it is worth showing. */}
      {error.digest ? (
        <p className="mt-3 font-mono text-micro uppercase text-text-muted">
          Reference {error.digest}
        </p>
      ) : null}

      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </div>
  );
}
