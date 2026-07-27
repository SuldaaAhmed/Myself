'use client';

import * as React from 'react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

/**
 * Counts a read once the visitor has actually stayed on the article, rather
 * than on mount — a bounce is not a read.
 */
export function ReadTracker({ slug, afterMs = 8000 }: { slug: string; afterMs?: number }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetch(`${API_URL}/blog/${slug}/views`, { method: 'POST', keepalive: true }).catch(
        () => undefined,
      );
    }, afterMs);

    return () => clearTimeout(timer);
  }, [slug, afterMs]);

  return null;
}
