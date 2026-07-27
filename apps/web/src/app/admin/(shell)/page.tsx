'use client';

import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  Inbox,
  Loader2,
  MousePointerClick,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/data';
import { useAnalytics, useSession } from '@/lib/hooks/use-api';
import { formatDate } from '@/lib/utils';

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const body = (
    <div className="card flex h-full flex-col gap-3 p-5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Icon className="size-4 text-muted" aria-hidden />
      </div>
      <p className="font-display text-4xl tabular-nums leading-none">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

/** Bar chart for daily traffic — small enough not to need a chart library. */
function TrafficChart({ data }: { data: { day: string; views: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No traffic recorded yet.</p>;
  }

  const max = Math.max(...data.map((point) => point.views), 1);

  return (
    <div className="flex h-40 items-end gap-1" role="img" aria-label="Daily page views">
      {/* Padding bars keep a sparse range from rendering as one giant block. */}
      {Array.from({ length: Math.max(0, 14 - data.length) }).map((_, index) => (
        <div key={`pad-${index}`} className="h-full flex-1" aria-hidden />
      ))}
      {data.map((point) => (
        <div key={point.day} className="group relative flex h-full flex-1 items-end">
          <div
            className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
            style={{ height: `${Math.max(2, (point.views / max) * 100)}%` }}
          />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.625rem] group-hover:block">
            {point.views} · {formatDate(point.day)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: user } = useSession();
  const { data: analytics, isLoading } = useAnalytics(30);

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <EmptyState
        title="Metrics unavailable"
        description="The analytics endpoint could not be reached. Content management still works."
      />
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <>
      <PageTitle
        title={`Good to see you, ${firstName}.`}
        description="Traffic and content status for the last 30 days."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/" target="_blank">
              View site
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Page views"
          value={analytics.traffic.views}
          hint="last 30 days"
          icon={MousePointerClick}
          href="/admin/analytics"
        />
        <MetricCard
          label="Visitors"
          value={analytics.traffic.visitors}
          hint="unique, anonymised"
          icon={Users}
          href="/admin/analytics"
        />
        <MetricCard
          label="Unread messages"
          value={analytics.inbox.unread}
          hint="in the inbox"
          icon={Inbox}
          href="/admin/messages"
        />
        <MetricCard
          label="Drafts"
          value={analytics.content.drafts}
          hint="not yet published"
          icon={FileText}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-6 font-display text-xl">Daily traffic</h2>
          <TrafficChart data={analytics.traffic.daily} />
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-xl">Most visited</h2>
          {analytics.traffic.topPages.length === 0 ? (
            <p className="text-sm text-muted">Nothing recorded yet.</p>
          ) : (
            <ol className="space-y-3">
              {analytics.traffic.topPages.map((page) => (
                <li key={page.path} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate font-mono text-xs text-muted">{page.path}</span>
                  <span className="tabular-nums">{page.views}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl">Latest messages</h2>
            <Link href="/admin/messages" className="font-mono text-xs text-muted hover:text-foreground">
              Inbox →
            </Link>
          </div>

          {analytics.inbox.recent.length === 0 ? (
            <p className="text-sm text-muted">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.inbox.recent.map((message) => (
                <li key={message.id} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{message.name}</p>
                    <p className="truncate text-xs text-muted">{message.subject ?? message.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {message.status === 'NEW' ? <Badge tone="accent">New</Badge> : null}
                    <p className="mt-1 font-mono text-[0.625rem] text-muted">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-xl">Published content</h2>
          <dl className="grid grid-cols-2 gap-5">
            {[
              { label: 'Projects', value: analytics.content.projects, href: '/admin/projects' },
              { label: 'Case studies', value: analytics.content.caseStudies, href: '/admin/case-studies' },
              { label: 'Articles', value: analytics.content.posts, href: '/admin/blog' },
              { label: 'Testimonials', value: analytics.content.testimonials, href: '/admin/testimonials' },
              { label: 'Certificates', value: analytics.content.certificates, href: '/admin/certificates' },
            ].map((entry) => (
              <Link key={entry.label} href={entry.href} className="group">
                <dd className="font-display text-3xl tabular-nums transition-colors group-hover:text-accent">
                  {entry.value}
                </dd>
                <dt className="eyebrow mt-1">{entry.label}</dt>
              </Link>
            ))}
          </dl>

          <Button asChild variant="outline" size="sm" className="mt-6 w-full">
            <Link href="/admin/projects/new">
              <FolderKanban className="size-3.5" />
              New project
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
