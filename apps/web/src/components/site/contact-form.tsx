'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast';
import { api, apiErrorMessage } from '@/lib/api/client';

const schema = z.object({
  name: z.string().min(2, 'Please tell me your name'),
  email: z.email('That email address does not look right'),
  company: z.string().optional(),
  subject: z.string().optional(),
  budget: z.string().optional(),
  body: z.string().min(20, 'A couple of sentences at least, please'),
  // Honeypot — hidden from humans, irresistible to bots.
  website: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm({ budgetOptions = [] }: { budgetOptions?: string[] }) {
  const { toast } = useToast();
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/messages', values);
      setSent(true);
      reset();
      toast('Message sent — I will be in touch shortly.');
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  if (sent) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <p className="font-display text-2xl">Thank you — that landed.</p>
        <p className="text-sm text-muted">
          I read every message myself and usually reply within two business days.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card grid gap-5 p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Company" htmlFor="company" error={errors.company?.message}>
          <Input id="company" autoComplete="organization" {...register('company')} />
        </Field>
        <Field label="Budget" htmlFor="budget" error={errors.budget?.message}>
          <Select id="budget" defaultValue="" {...register('budget')}>
            <option value="">Prefer not to say</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Subject" htmlFor="subject" error={errors.subject?.message}>
        <Input id="subject" placeholder="What is this about?" {...register('subject')} />
      </Field>

      <Field
        label="About the work"
        htmlFor="body"
        required
        error={errors.body?.message}
        help="The problem, the timeline, and anything already tried."
      >
        <Textarea id="body" rows={6} {...register('body')} />
      </Field>

      {/* Honeypot field: visually hidden, never focusable by keyboard. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={isSubmitting} size="lg">
          Send message
          <Send className="size-4" />
        </Button>
        <p className="text-xs text-muted">No newsletter, no CRM — the message reaches only me.</p>
      </div>
    </form>
  );
}
