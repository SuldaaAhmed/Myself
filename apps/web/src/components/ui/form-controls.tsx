'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-60';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, 'h-11', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, 'resize-y', className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, 'h-11 appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
});

export function Label({
  className,
  required,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }) {
  return (
    <LabelPrimitive.Root
      className={cn('text-[0.8125rem] font-medium text-foreground', className)}
      {...props}
    >
      {props.children}
      {required ? <span className="ml-0.5 text-accent">*</span> : null}
    </LabelPrimitive.Root>
  );
}

export function Switch({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-muted',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4.5 translate-x-1 rounded-full bg-foreground shadow transition-transform data-[state=checked]:translate-x-5.5 data-[state=checked]:bg-accent-foreground" />
    </SwitchPrimitive.Root>
  );
}

export function Field({
  label,
  htmlFor,
  help,
  error,
  required,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : help ? (
        <p className="text-xs text-muted">{help}</p>
      ) : null}
    </div>
  );
}

/** Enter-to-add chip input used for tags, highlights and bullet lists. */
export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  id,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  id?: string;
}) {
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    const entry = draft.trim();
    if (!entry) return;
    onChange([...value, entry]);
    setDraft('');
  };

  return (
    <div className={cn(fieldBase, 'flex flex-wrap items-center gap-2 py-2')}>
      {value.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-muted px-2 py-1 text-xs"
        >
          <span className="truncate">{item}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="text-muted transition-colors hover:text-red-500"
            aria-label={`Remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
      />
    </div>
  );
}
