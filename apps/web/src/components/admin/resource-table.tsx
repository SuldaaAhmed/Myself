'use client';

import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, StatusPill, Table, Td, Th, Tr } from '@/components/ui/data';
import { Input, Select } from '@/components/ui/form-controls';
import type { ColumnDef, ResourceDef } from '@/lib/admin/resources';
import { useResourceList } from '@/lib/hooks/use-api';
import type { ContentStatus } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';

/** `category.name` → nested lookup, so columns can point anywhere in the row. */
const valueAt = (row: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, row);

function Cell({ column, row }: { column: ColumnDef; row: Record<string, unknown> }) {
  const value = valueAt(row, column.key);

  if (value === undefined || value === null || value === '') {
    return <span className="text-muted">—</span>;
  }

  switch (column.type) {
    case 'status':
      return <StatusPill status={value as ContentStatus} />;
    case 'date':
      return <span className="font-mono text-xs text-muted">{formatDate(String(value))}</span>;
    case 'boolean':
      return value ? <span className="text-[var(--secondary-accent)]">Yes</span> : <span className="text-muted">No</span>;
    case 'number':
      return <span className="tabular-nums">{String(value)}</span>;
    case 'badge':
      return (
        <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-[0.6875rem] text-muted">
          {String(value)}
        </span>
      );
    case 'image':
      return (
        <span className="relative block size-10 overflow-hidden rounded-lg border border-line">
          <Image
            src={String(value)}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized={String(value).endsWith('.svg')}
          />
        </span>
      );
    default:
      return <span className="line-clamp-1">{String(value)}</span>;
  }
}

export function ResourceTable({ resource }: { resource: ResourceDef }) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useResourceList<Record<string, unknown>>(resource.key, {
    page,
    limit: 20,
    q: debounced || undefined,
    status: status || undefined,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${resource.label.toLowerCase()}…`}
            className="pl-10"
            aria-label={`Search ${resource.label}`}
          />
        </div>

        {resource.hasStatus ? (
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="max-w-44"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        ) : null}

        <Button asChild>
          <Link href={`/admin/${resource.key}/new`}>
            <Plus className="size-4" />
            New {resource.singular.toLowerCase()}
          </Link>
        </Button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="grid h-56 place-items-center">
            <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No ${resource.label.toLowerCase()} yet`}
            description={debounced ? 'No results for this search.' : 'Create the first record to get going.'}
            action={
              <Button asChild size="sm" className="mt-2">
                <Link href={`/admin/${resource.key}/new`}>New {resource.singular.toLowerCase()}</Link>
              </Button>
            }
          />
        ) : (
          <Table className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
            <thead>
              <tr>
                {resource.columns.map((column) => (
                  <Th key={column.key} style={{ width: column.width }}>
                    {column.label}
                  </Th>
                ))}
                <Th className="w-20 text-right">Edit</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={String(row.id)}>
                  {resource.columns.map((column) => (
                    <Td key={column.key}>
                      <Cell column={column} row={row} />
                    </Td>
                  ))}
                  <Td className="text-right">
                    <Link
                      href={`/admin/${resource.key}/${String(row.id)}`}
                      className="inline-grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                      aria-label={`Edit ${String(row[resource.titleField] ?? '')}`}
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {meta && meta.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            Page {meta.page} of {meta.pageCount} · {meta.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
