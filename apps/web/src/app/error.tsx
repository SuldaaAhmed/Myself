'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Something broke</p>
        <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">That did not go to plan.</h1>
        <p className="mt-5 text-muted">
          The page failed to render. Trying again is usually enough; if it is not, the API may be
          unavailable.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
