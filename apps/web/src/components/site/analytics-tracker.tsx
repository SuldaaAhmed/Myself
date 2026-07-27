'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

const sessionId = () => {
  const existing = sessionStorage.getItem('aurora:session');
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem('aurora:session', created);
  return created;
};

/**
 * First-party page-view tracking. No third-party script, no cookie: the API
 * derives an anonymous visitor hash server-side and we only send the path.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const enteredAt = React.useRef(Date.now());

  React.useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const durationMs = Date.now() - enteredAt.current;
    enteredAt.current = Date.now();

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
      sessionId: sessionId(),
      durationMs: durationMs > 500 ? durationMs : undefined,
    });

    // keepalive so the request survives the navigation that triggered it.
    void fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
