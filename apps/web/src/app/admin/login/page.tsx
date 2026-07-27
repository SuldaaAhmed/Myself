'use client';

import { ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form-controls';
import { apiErrorMessage } from '@/lib/api/client';
import { useLogin } from '@/lib/hooks/use-api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      router.replace(searchParams.get('next') ?? '/admin');
    } catch (caught) {
      setError(apiErrorMessage(caught));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-line p-12 lg:flex">
        <div className="grid-canvas absolute inset-0 -z-10 opacity-70" aria-hidden />
        <Link href="/" className="font-display text-xl">
          ← Back to the site
        </Link>
        <div>
          <p className="eyebrow mb-5">Content management</p>
          <h1 className="max-w-md text-balance text-4xl leading-tight">
            Every page of the website is edited from here.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            Projects, case studies, writing, testimonials, SEO and theme — all without a deploy.
          </p>
        </div>
        <p className="font-mono text-xs text-muted">Protected by JWT sessions, RBAC and audit logging.</p>
      </div>

      <div className="grid place-items-center px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <span className="mb-6 grid size-11 place-items-center rounded-xl border border-line">
            <Lock className="size-4 text-accent" aria-hidden />
          </span>

          <h2 className="font-display text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-muted">Use the account seeded with the database.</p>

          <div className="mt-8 space-y-4">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {error ? (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted">
            Change the seeded password immediately after the first sign-in. Sessions are stored in
            HTTP-only cookies and rotate automatically.
          </p>
        </form>
      </div>
    </div>
  );
}

/**
 * `useSearchParams` opts the subtree into client rendering, so the page shell
 * stays static and only the form suspends.
 */
export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <span className="font-mono text-xs text-muted">Loading…</span>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
