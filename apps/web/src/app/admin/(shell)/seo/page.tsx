'use client';

import { Loader2, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState, Table, Td, Th, Tr } from '@/components/ui/data';
import { Field, Input, Switch, TagInput, Textarea } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/lib/api/client';
import { useSaveSeo, useSeoRecords } from '@/lib/hooks/use-api';
import type { SeoRecord } from '@/lib/api/types';

const ROUTES = [
  '/',
  '/about',
  '/services',
  '/skills',
  '/technologies',
  '/experience',
  '/education',
  '/projects',
  '/case-studies',
  '/certificates',
  '/testimonials',
  '/blog',
  '/gallery',
  '/resume',
  '/faq',
  '/contact',
];

function SeoDialog({ record, path }: { record?: SeoRecord; path?: string }) {
  const [open, setOpen] = React.useState(false);
  const save = useSaveSeo();
  const { toast } = useToast();

  const [form, setForm] = React.useState({
    path: record?.path ?? path ?? '',
    title: record?.title ?? '',
    description: record?.description ?? '',
    keywords: record?.keywords ?? [],
    ogImage: record?.ogImage ?? '',
    canonical: record?.canonical ?? '',
    noIndex: record?.noIndex ?? false,
  });

  const submit = async () => {
    try {
      await save.mutateAsync({
        ...form,
        ogImage: form.ogImage || undefined,
        canonical: form.canonical || undefined,
      });
      toast('SEO record saved');
      setOpen(false);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={record ? 'ghost' : 'outline'}>
          {record ? 'Edit' : <Plus className="size-3.5" />}
          {record ? null : 'Add'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={record ? `SEO for ${record.path}` : 'New SEO record'}
        description="Titles under 60 characters and descriptions under 160 render best in search results."
      >
        <div className="space-y-4">
          <Field label="Path" required help="The route this metadata belongs to, e.g. /projects">
            <Input
              value={form.path}
              onChange={(event) => setForm({ ...form, path: event.target.value })}
              disabled={Boolean(record)}
              list="seo-routes"
            />
            <datalist id="seo-routes">
              {ROUTES.map((route) => (
                <option key={route} value={route} />
              ))}
            </datalist>
          </Field>

          <Field label="Title" required help={`${form.title.length}/60 characters`}>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>

          <Field label="Description" required help={`${form.description.length}/160 characters`}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <Field label="Keywords">
            <TagInput value={form.keywords} onChange={(keywords) => setForm({ ...form, keywords })} />
          </Field>

          <Field label="Social image URL">
            <Input
              value={form.ogImage ?? ''}
              onChange={(event) => setForm({ ...form, ogImage: event.target.value })}
            />
          </Field>

          <Field label="Canonical URL" help="Leave empty to use the page's own URL.">
            <Input
              value={form.canonical ?? ''}
              onChange={(event) => setForm({ ...form, canonical: event.target.value })}
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-3.5">
            <div>
              <p className="text-sm">Hide from search engines</p>
              <p className="text-xs text-muted">Adds noindex, nofollow to this page.</p>
            </div>
            <Switch
              checked={form.noIndex}
              onCheckedChange={(checked) => setForm({ ...form, noIndex: checked })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={submit} loading={save.isPending}>
              Save record
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SeoPage() {
  const { data: records, isLoading } = useSeoRecords();
  const configured = new Set((records ?? []).map((record) => record.path));
  const missing = ROUTES.filter((route) => !configured.has(route));

  return (
    <>
      <PageTitle
        title="SEO"
        description="Per-route titles, descriptions and social images. Pages fall back to their own defaults."
        action={<SeoDialog />}
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            {(records ?? []).length === 0 ? (
              <EmptyState
                title="No SEO records yet"
                description="Add one per route you care about."
                icon={<Search className="size-6" />}
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Path</Th>
                    <Th>Title</Th>
                    <Th className="w-24">Indexed</Th>
                    <Th className="w-20 text-right">Edit</Th>
                  </tr>
                </thead>
                <tbody>
                  {(records ?? []).map((record) => (
                    <Tr key={record.id}>
                      <Td className="font-mono text-xs">{record.path}</Td>
                      <Td>
                        <p className="line-clamp-1">{record.title}</p>
                        <p className="line-clamp-1 text-xs text-muted">{record.description}</p>
                      </Td>
                      <Td>
                        {record.noIndex ? <Badge tone="warn">noindex</Badge> : <Badge tone="mint">yes</Badge>}
                      </Td>
                      <Td className="text-right">
                        <SeoDialog record={record} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {missing.length > 0 ? (
            <section className="card p-6">
              <h2 className="font-display text-xl">Routes without a record</h2>
              <p className="mt-1.5 text-sm text-muted">
                These pages fall back to the defaults written in code. Add a record to control them here.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {missing.map((route) => (
                  <li key={route} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1">
                    <span className="font-mono text-xs text-muted">{route}</span>
                    <SeoDialog path={route} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
