import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="max-w-lg text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Error 404</p>
        <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">This page has moved on.</h1>
        <p className="mt-5 text-muted">
          The link may be old, or the content may have been unpublished from the dashboard.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to the home page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/projects">Browse the work</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
