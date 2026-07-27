'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { PageTitle } from '@/components/admin/admin-shell';
import { ResourceForm } from '@/components/admin/resource-form';
import { SETTINGS_FORMS } from '@/lib/admin/resources';
import { useSaveSetting, useSettings } from '@/lib/hooks/use-api';
import { cn } from '@/lib/utils';

/**
 * Site settings are JSON documents. Each tab is described by `SETTINGS_FORMS`,
 * so adding an editable section to the website means adding a definition — not
 * a new page.
 */
export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const save = useSaveSetting();

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
      </div>
    );
  }

  const documentFor = (key: string) =>
    (settings ?? []).find((setting) => setting.key === key)?.value ?? {};

  return (
    <>
      <PageTitle
        title="Site settings"
        description="Everything the website reads at render time — headlines, contact details, theme."
      />

      <Tabs.Root defaultValue={SETTINGS_FORMS[0].key}>
        <Tabs.List className="mb-6 flex flex-wrap gap-1.5 border-b border-line pb-3">
          {SETTINGS_FORMS.map((form) => (
            <Tabs.Trigger
              key={form.key}
              value={form.key}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground',
                'data-[state=active]:bg-accent-soft data-[state=active]:text-foreground',
              )}
            >
              {form.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {SETTINGS_FORMS.map((form) => (
          <Tabs.Content key={form.key} value={form.key}>
            <p className="mb-5 max-w-2xl text-sm text-muted">{form.description}</p>
            <ResourceForm
              fields={form.fields}
              initialValues={documentFor(form.key) as Record<string, unknown>}
              submitLabel={`Save ${form.label.toLowerCase()}`}
              onSubmit={(values) =>
                save.mutateAsync({
                  key: form.key,
                  group: form.group,
                  label: form.label,
                  value: Object.fromEntries(
                    form.fields.map((field) => [field.name, values[field.name] ?? null]),
                  ),
                })
              }
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </>
  );
}
