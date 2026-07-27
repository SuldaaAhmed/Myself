'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { MediaPicker } from '@/components/admin/media-picker';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Switch, TagInput, Textarea } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/lib/api/client';
import type { FieldDef } from '@/lib/admin/resources';
import { useResourceList } from '@/lib/hooks/use-api';

type Values = Record<string, unknown>;

const dateValue = (value: unknown): string => {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

/** Renders one field from its definition. */
function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const id = `field-${field.name}`;

  const control = (() => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            rows={4}
            value={(value as string) ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'markdown':
        return (
          <Textarea
            id={id}
            rows={16}
            value={(value as string) ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={'## Heading\n\nMarkdown is supported: **bold**, *italics*, `code`, - lists, [links](https://example.com).'}
            className="font-mono text-[0.8125rem]"
          />
        );

      case 'number':
        return (
          <Input
            id={id}
            type="number"
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(event) =>
              onChange(event.target.value === '' ? undefined : Number(event.target.value))
            }
          />
        );

      case 'boolean':
        return (
          <div className="flex h-11 items-center">
            <Switch
              id={id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
          </div>
        );

      case 'date':
        return (
          <Input
            id={id}
            type="date"
            value={dateValue(value)}
            onChange={(event) => onChange(event.target.value || undefined)}
          />
        );

      case 'select':
        return (
          <Select
            id={id}
            value={(value as string) ?? ''}
            onChange={(event) => onChange(event.target.value || undefined)}
          >
            <option value="">—</option>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'tags':
        return (
          <TagInput
            id={id}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => onChange(next)}
            placeholder={field.placeholder}
          />
        );

      case 'image':
        return (
          <MediaPicker value={(value as string) ?? ''} onChange={(url) => onChange(url || undefined)} />
        );

      case 'relation':
        return <RelationField field={field} value={value} onChange={onChange} id={id} />;

      case 'metrics':
        return <MetricsField value={value} onChange={onChange} />;

      default:
        return (
          <Input
            id={id}
            value={(value as string) ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  })();

  return (
    <Field
      label={field.label}
      htmlFor={id}
      help={field.help}
      error={error}
      required={field.required}
      className={field.span === 2 ? 'sm:col-span-2' : undefined}
    >
      {control}
    </Field>
  );
}

function RelationField({
  field,
  value,
  onChange,
  id,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  id: string;
}) {
  const relation = field.relation!;
  const { data, isLoading } = useResourceList<Record<string, unknown>>(relation.resource, { limit: 100 });
  const options = data?.data ?? [];

  if (relation.multiple) {
    const selected = Array.isArray(value) ? (value as string[]) : [];

    return (
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-3">
        {isLoading ? <span className="text-xs text-muted">Loading…</span> : null}
        {options.map((option) => {
          const optionId = String(option.id);
          const active = selected.includes(optionId);

          return (
            <button
              key={optionId}
              type="button"
              onClick={() =>
                onChange(active ? selected.filter((item) => item !== optionId) : [...selected, optionId])
              }
              className={
                active
                  ? 'rounded-lg border border-accent bg-accent-soft px-2.5 py-1 text-xs'
                  : 'rounded-lg border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground'
              }
            >
              {String(option[relation.labelKey] ?? optionId)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Select id={id} value={(value as string) ?? ''} onChange={(event) => onChange(event.target.value || null)}>
      <option value="">—</option>
      {options.map((option) => (
        <option key={String(option.id)} value={String(option.id)}>
          {String(option[relation.labelKey] ?? option.id)}
        </option>
      ))}
    </Select>
  );
}

function MetricsField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const rows = Array.isArray(value) ? (value as { label: string; value: string }[]) : [];

  const update = (index: number, patch: Partial<{ label: string; value: string }>) =>
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={row.label ?? ''}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder="Label, e.g. p95 latency"
          />
          <Input
            value={row.value ?? ''}
            onChange={(event) => update(index, { value: event.target.value })}
            placeholder="Value, e.g. -64%"
            className="max-w-40"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
            aria-label="Remove metric"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { label: '', value: '' }])}
      >
        <Plus className="size-3.5" />
        Add metric
      </Button>
    </div>
  );
}

/**
 * Generic create/edit form. It knows nothing about any specific resource — the
 * field definitions decide what is rendered and what gets submitted.
 */
export function ResourceForm({
  fields,
  initialValues = {},
  submitLabel = 'Save',
  onSubmit,
  onDelete,
  backHref,
}: {
  fields: FieldDef[];
  initialValues?: Values;
  submitLabel?: string;
  onSubmit: (values: Values) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  backHref?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<Values>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const set = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      if (!field.required) continue;
      const value = values[field.name];
      const empty =
        value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) next[field.name] = `${field.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast('Some fields still need attention', 'error');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(values);
      toast('Saved');
      if (backHref) router.push(backHref);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card grid gap-5 p-6 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => set(field.name, value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        {backHref ? (
          <Button type="button" variant="ghost" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
        ) : null}

        {onDelete ? (
          <Button
            type="button"
            variant="danger"
            className="ml-auto"
            loading={deleting}
            onClick={async () => {
              if (!window.confirm('Delete this record? This cannot be undone.')) return;
              setDeleting(true);
              try {
                await onDelete();
                toast('Deleted');
                if (backHref) router.push(backHref);
              } catch (error) {
                toast(apiErrorMessage(error), 'error');
              } finally {
                setDeleting(false);
              }
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
