'use client';

import { notFound, useParams } from 'next/navigation';
import { PageTitle } from '@/components/admin/admin-shell';
import { ResourceTable } from '@/components/admin/resource-table';
import { resourceByKey } from '@/lib/admin/resources';

/** One page serves every CMS collection, driven by the resource registry. */
export default function ResourceListPage() {
  const params = useParams<{ resource: string }>();
  const resource = resourceByKey(params.resource);
  if (!resource) notFound();

  return (
    <>
      <PageTitle
        title={resource.label}
        description={`Create, edit and publish ${resource.label.toLowerCase()}.`}
      />
      <ResourceTable resource={resource} />
    </>
  );
}
