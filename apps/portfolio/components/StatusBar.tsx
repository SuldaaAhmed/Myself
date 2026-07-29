'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';

/**
 * The thin monospace strip under the navigation:
 *
 *   ● STATUS: BUILDING SARIF V2 — LAST UPDATED 2H AGO
 *
 * Both halves come from the API (`profile.statusLine` and `profile.updatedAt`).
 * Nothing here is written into the component.
 *
 * The relative time is computed *after mount*, never during render, and that is
 * the point of the whole component:
 *
 *  - Pages are statically generated and revalidated on a timer. A relative time
 *    rendered on the server is frozen at build time, so a cached page would
 *    keep insisting the last update was two hours ago for as long as the cache
 *    lived.
 *  - Server and browser clocks disagree. Rendering "2h ago" on the server and
 *    "3h ago" in the browser is a hydration mismatch, and React replaces the
 *    whole subtree when it finds one.
 *
 * So the first paint ships a stable placeholder, and the real value appears on
 * the client. It then refreshes every minute, because a long-lived tab
 * otherwise drifts further from the truth the longer it stays open.
 */

const REFRESH_INTERVAL_MS = 60_000;

interface StatusBarProps {
  /** Editorial status text, e.g. `BUILDING SARIF V2`. */
  statusLine: string;
  /** ISO timestamp of the last content change. */
  updatedAt: string;
}

export function StatusBar({ statusLine, updatedAt }: StatusBarProps) {
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setRelativeTime(formatRelativeTime(updatedAt));

    update();
    const timer = setInterval(update, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [updatedAt]);

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-content items-center gap-3 px-6 py-2 lg:px-8">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-status-live"
        />

        {/*
          `truncate` plus `min-w-0` is what keeps the bar to one line on a
          narrow screen. Without `min-w-0` the flex child refuses to shrink
          below its content width and the text pushes the layout wider instead
          of clipping — the requirement is that the status bar stays visible at
          every size, truncated if it must be.
        */}
        <p className="min-w-0 truncate font-mono text-label uppercase text-text-muted">
          <span className="text-text-muted">STATUS:</span>{' '}
          <span className="text-text-primary">{statusLine}</span>
          {/*
            The timestamp is announced politely: a screen reader reading the
            page does not need to be interrupted a minute later because the
            label ticked from "2h ago" to "3h ago".
          */}
          <span aria-live="polite">
            {relativeTime ? (
              <>
                {' — '}
                <span className="text-text-muted">LAST UPDATED</span>{' '}
                <time dateTime={updatedAt}>{relativeTime.toUpperCase()}</time>
              </>
            ) : null}
          </span>
        </p>
      </div>
    </div>
  );
}
