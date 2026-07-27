'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { EmptyState, Table, Td, Tr } from '@/components/ui/data';
import { useAnalytics } from '@/lib/hooks/use-api';
import { cn, formatDate } from '@/lib/utils';

const RANGES = [7, 30, 90, 365];

export default function AnalyticsPage() {
  const [days, setDays] = React.useState(30);
  const { data, isLoading } = useAnalytics(days);

  return (
    <>
      <PageTitle
        title="Analytics"
        description="First-party, cookie-free traffic data collected by the API."
        action={
          <div className="flex gap-1.5">
            {RANGES.map((range) => (
              <Button
                key={range}
                size="sm"
                variant={days === range ? 'primary' : 'outline'}
                onClick={() => setDays(range)}
              >
                {range}d
              </Button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : !data ? (
        <EmptyState title="No analytics available" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Page views', value: data.traffic.views },
              { label: 'Unique visitors', value: data.traffic.visitors },
              {
                label: 'Views per visitor',
                value:
                  data.traffic.visitors > 0
                    ? (data.traffic.views / data.traffic.visitors).toFixed(1)
                    : '0',
              },
            ].map((metric) => (
              <div key={metric.label} className="card p-5">
                <p className="eyebrow">{metric.label}</p>
                <p className="mt-2 font-display text-4xl tabular-nums">{metric.value}</p>
              </div>
            ))}
          </div>

          <section className="card p-6">
            <h2 className="mb-6 font-display text-xl">Views per day</h2>
            {data.traffic.daily.length === 0 ? (
              <p className="text-sm text-muted">Nothing recorded in this range.</p>
            ) : (
              <div className="flex h-48 items-end gap-1">
                {data.traffic.daily.map((point) => {
                  const max = Math.max(...data.traffic.daily.map((entry) => entry.views), 1);
                  return (
                    <div key={point.day} className="group relative flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
                        style={{ height: `${Math.max(2, (point.views / max) * 100)}%` }}
                      />
                      <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.625rem] group-hover:block">
                        {point.views} · {formatDate(point.day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card overflow-hidden">
              <h2 className="border-b border-line px-6 py-4 font-display text-xl">Top pages</h2>
              <Table className="min-w-0">
                <tbody>
                  {data.traffic.topPages.map((page) => (
                    <Tr key={page.path}>
                      <Td className="font-mono text-xs">{page.path}</Td>
                      <Td className="w-20 text-right tabular-nums">{page.views}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </section>

            <section className="card overflow-hidden">
              <h2 className="border-b border-line px-6 py-4 font-display text-xl">Referrers</h2>
              {data.traffic.topReferrers.length === 0 ? (
                <p className="p-6 text-sm text-muted">No referrers recorded — mostly direct traffic.</p>
              ) : (
                <Table className="min-w-0">
                  <tbody>
                    {data.traffic.topReferrers.map((referrer) => (
                      <Tr key={referrer.referrer ?? 'direct'}>
                        <Td className="max-w-xs truncate font-mono text-xs">
                          {referrer.referrer ?? 'Direct'}
                        </Td>
                        <Td className="w-20 text-right tabular-nums">{referrer.views}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>
          </div>

          <section className="card p-6">
            <h2 className="mb-5 font-display text-xl">Devices</h2>
            <div className="space-y-3">
              {data.traffic.devices.map((device) => {
                const share = data.traffic.views > 0 ? (device.views / data.traffic.views) * 100 : 0;
                return (
                  <div key={device.device}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="capitalize">{device.device}</span>
                      <span className="font-mono text-xs text-muted">
                        {device.views} · {share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-muted">
                      <div
                        className={cn('h-1.5 rounded-full bg-accent')}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
