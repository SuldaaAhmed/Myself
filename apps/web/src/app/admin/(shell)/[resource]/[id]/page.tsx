'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { PageTitle } from '@/components/admin/admin-shell';
import { ResourceForm } from '@/components/admin/resource-form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/data';
import { resourceByKey } from '@/lib/admin/resources';
import { useDeleteResource, useResourceItem, useUpdateResource } from '@/lib/hooks/use-api';

/** Maps a CMS record back to its public URL, where one exists. */
const PUBLIC_PATHS: Record<string, string> = {
  projects: '/projects',
  'case-studies': '/case-studies',
  blog: '/blog',
};

export default function EditResourcePage() {
  const params = useParams<{ resource: string; id: string }>();
  const resource = resourceByKey(params.resource);
  if (!resource) notFound();

  const { data: record, isLoading, isError } = useResourceItem<Record<string, unknown>>(
    resource.key,
    params.id,
  );
  const update = useUpdateResource(resource.key);
  const remove = useDeleteResource(resource.key);

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <EmptyState
        title="Record not found"
        description="It may have been deleted by another editor."
        action={
          <Button asChild size="sm" className="mt-2">
            <Link href={`/admin/${resource.key}`}>Back to {resource.label.toLowerCase()}</Link>
          </Button>
        }
      />
    );
  }

  // Relations arrive as objects; the form submits ids.
  const initialValues: Record<string, unknown> = {
    ...record,
    ...(Array.isArray(record.technologies)
      ? {
          technologyIds: (record.technologies as { id: string }[]).map((technology) => technology.id),
        }
      : {}),
  };

  const publicPath = PUBLIC_PATHS[resource.key];
  const slug = record.slug as string | undefined;

  return (
    <>
      <PageTitle
        title={String(record[resource.titleField] ?? resource.singular)}
        description={`Editing a ${resource.singular.toLowerCase()}.`}
        action={
          publicPath && slug ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${publicPath}/${slug}`} target="_blank">
                <ExternalLink className="size-3.5" />
                View on site
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ResourceForm
        fields={resource.fields}
        initialValues={initialValues}
        submitLabel="Save changes"
        backHref={`/admin/${resource.key}`}
        onSubmit={(values) => {
          // Only send fields the form owns, so unrelated columns stay untouched.
          const payload = Object.fromEntries(
            resource.fields.map((field) => [field.name, values[field.name]]),
          );
          return update.mutateAsync({ id: params.id, payload });
        }}
        onDelete={() => remove.mutateAsync(params.id)}
      />
    </>
  );
}
