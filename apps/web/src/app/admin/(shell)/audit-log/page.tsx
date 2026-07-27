'use client';

import { Loader2, Search } from 'lucide-react';
import * as React from 'react';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState, Table, Td, Th, Tr } from '@/components/ui/data';
import { Input } from '@/components/ui/form-controls';
import { useAuditLog } from '@/lib/hooks/use-api';

const ACTION_TONES: Record<string, 'accent' | 'mint' | 'danger' | 'neutral'> = {
  create: 'mint',
  update: 'accent',
  delete: 'danger',
  login: 'neutral',
};

export default function AuditLogPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useAuditLog({ page, limit: 30, q: query || undefined });

  return (
    <>
      <PageTitle
        title="Audit log"
        description="Every mutation, with the account that made it. Sensitive values are redacted before storage."
        action={
          <div className="relative min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resource, action, user…"
              className="pl-10"
            />
          </div>
        }
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <EmptyState title="Nothing logged yet" description="Changes made from the dashboard appear here." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th className="w-44">When</Th>
                  <Th className="w-28">Action</Th>
                  <Th>Resource</Th>
                  <Th>Who</Th>
                  <Th className="w-32">IP</Th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((entry) => (
                  <Tr key={entry.id}>
                    <Td className="font-mono text-xs text-muted">
                      {new Date(entry.createdAt).toLocaleString('en-GB')}
                    </Td>
                    <Td>
                      <Badge tone={ACTION_TONES[entry.action] ?? 'neutral'}>{entry.action}</Badge>
                    </Td>
                    <Td>
                      <span className="text-sm">{entry.resource}</span>
                      {entry.resourceId ? (
                        <span className="ml-2 font-mono text-[0.625rem] text-muted">
                          {entry.resourceId.slice(0, 10)}…
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-sm">
                      {entry.user ? entry.user.name : <span className="text-muted">system</span>}
                    </Td>
                    <Td className="font-mono text-xs text-muted">{entry.ip ?? '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>

          {data && data.meta.pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-muted">
                Page {data.meta.page} of {data.meta.pageCount} · {data.meta.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
