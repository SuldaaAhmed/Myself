'use client';

import { notFound, useParams } from 'next/navigation';
import { PageTitle } from '@/components/admin/admin-shell';
import { ResourceForm } from '@/components/admin/resource-form';
import { resourceByKey } from '@/lib/admin/resources';
import { useCreateResource } from '@/lib/hooks/use-api';

export default function NewResourcePage() {
  const params = useParams<{ resource: string }>();
  const resource = resourceByKey(params.resource);
  if (!resource) notFound();

  const create = useCreateResource(resource.key);

  const defaults: Record<string, unknown> = {
    ...(resource.hasStatus ? { status: 'DRAFT' } : {}),
    ...(resource.orderable ? { order: 0 } : {}),
  };

  return (
    <>
      <PageTitle
        title={`New ${resource.singular.toLowerCase()}`}
        description="Saved as a draft unless you set the status to published."
      />
      <ResourceForm
        fields={resource.fields}
        initialValues={defaults}
        submitLabel={`Create ${resource.singular.toLowerCase()}`}
        backHref={`/admin/${resource.key}`}
        onSubmit={(values) => create.mutateAsync(values)}
      />
    </>
  );
}
