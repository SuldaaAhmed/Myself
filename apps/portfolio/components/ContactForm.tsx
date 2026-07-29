'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import {
  contactSchema,
  type ContactFieldErrors,
  type ContactFormInput,
  type ContactFormValues,
} from '@/lib/contact-schema';
import { cn } from '@/lib/utils';

/**
 * The contact form, styled as a submission ticket rather than a marketing CTA.
 *
 * Behaviour worth knowing about:
 *
 *  - Validation runs against `contactSchema`, the same object the route handler
 *    uses. There is no second copy of the rules to keep in sync.
 *  - The submit button disables while a request is in flight, so an impatient
 *    double-click cannot send two messages.
 *  - Errors are rendered inline, beside the field that caused them, and wired
 *    to the input with `aria-describedby` + `aria-invalid`. No alert popups: an
 *    alert forces a dismissal and then leaves the person to work out which
 *    field it was about.
 *  - The API's own field errors are mapped back onto the form with `setError`,
 *    so a rejection from the server lands in the same place as a local one.
 *  - Anything that is not a field error becomes one plain sentence at the top
 *    of the form. "Error 400" is not a sentence.
 */

/** Shape returned by `app/api/contact/route.ts` when it rejects a submission. */
interface ContactErrorResponse {
  message?: string;
  fieldErrors?: ContactFieldErrors;
}

/** Shared input styling — one definition for the three text inputs and the textarea. */
const FIELD_CLASS =
  'focus-ring w-full rounded-sm border bg-surface px-3 py-2.5 font-body text-sm text-text-primary ' +
  'placeholder:text-text-muted transition-colors duration-hover';

export function ContactForm({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorId = useId();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
    // Three generics, not one: the values React Hook Form tracks while typing
    // (`ContactFormInput`), the resolver context, and the values `handleSubmit`
    // receives after the schema's transform has run (`ContactFormValues`).
  } = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(contactSchema),
    // Validate on blur rather than on every keystroke: telling someone their
    // email is invalid while they are still on the third character of it is
    // technically correct and practically hostile.
    mode: 'onBlur',
    defaultValues: { name: '', email: '', subject: '', message: '', website: '' },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setFormError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSent(true);
        reset();
        return;
      }

      // The body may be empty or HTML if something upstream failed badly, so
      // parsing it is allowed to fail without taking the handler with it.
      const payload: ContactErrorResponse = await response.json().catch(() => ({}));

      if (payload.fieldErrors) {
        for (const [field, message] of Object.entries(payload.fieldErrors)) {
          setError(field as keyof ContactFormInput, { type: 'server', message });
        }
        return;
      }

      setFormError(
        payload.message ??
          'That did not go through. Try again in a moment, or email me directly.',
      );
    } catch {
      // Thrown only when the request never reached the server: offline, DNS,
      // a cancelled connection. Worth distinguishing, because "try again" is
      // useless advice if the problem is that the person has no network.
      setFormError('No connection. Check your network and send it again.');
    }
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="border-b border-border">
      <div className="mx-auto max-w-content px-6 py-12 md:py-24 lg:px-8">
        <SectionHeader
          index="005"
          title="Contact"
          description="Work, a question, or a bug in something I built — all land in the same inbox."
          id="contact-heading"
        />

        {sent ? (
          /*
            The success state replaces the form rather than sitting above it.
            Leaving a filled-in form on screen after a successful send invites a
            second submission of the same message.
          */
          <div className="mt-10 flex flex-col items-start gap-4 border border-status-live/40 bg-status-live/5 px-6 py-10">
            <p className="flex items-center gap-2 font-display text-lg text-status-live">
              <CheckCircle2 size={18} aria-hidden />
              Message sent
            </p>
            <p className="max-w-md font-body text-sm leading-relaxed text-text-muted">
              I read everything myself and reply within a few days. If it is urgent,{' '}
              <a
                href={`mailto:${email}`}
                className="focus-ring rounded-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
              >
                {email}
              </a>{' '}
              reaches me faster.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
              Send another
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-describedby={formError ? formErrorId : undefined}
            className="mt-10 max-w-2xl"
          >
            {/*
              `role="alert"` so the message is announced the moment it appears —
              a submission that silently failed is the worst outcome for anyone
              not watching the top of the form.
            */}
            {formError ? (
              <p
                id={formErrorId}
                role="alert"
                className="mb-6 border border-accent-amber/50 bg-accent-amber/10 px-4 py-3 font-body text-sm text-accent-amber"
              >
                {formError}
              </p>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Name" error={errors.name?.message} htmlFor="contact-name">
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  className={cn(FIELD_CLASS, errors.name ? 'border-accent-amber' : 'border-border')}
                  {...register('name')}
                />
              </Field>

              <Field label="Email" error={errors.email?.message} htmlFor="contact-email">
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  className={cn(FIELD_CLASS, errors.email ? 'border-accent-amber' : 'border-border')}
                  {...register('email')}
                />
              </Field>
            </div>

            <div className="mt-6">
              <Field
                label="Subject"
                optional
                error={errors.subject?.message}
                htmlFor="contact-subject"
              >
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="What this is about"
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  className={cn(
                    FIELD_CLASS,
                    errors.subject ? 'border-accent-amber' : 'border-border',
                  )}
                  {...register('subject')}
                />
              </Field>
            </div>

            <div className="mt-6">
              <Field label="Message" error={errors.message?.message} htmlFor="contact-message">
                <textarea
                  id="contact-message"
                  rows={6}
                  placeholder="What are you building, and where do I fit?"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className={cn(
                    FIELD_CLASS,
                    'resize-y',
                    errors.message ? 'border-accent-amber' : 'border-border',
                  )}
                  {...register('message')}
                />
              </Field>
            </div>

            {/*
              Honeypot. Positioned off-screen instead of `display: none`, because
              the simpler bots skip hidden inputs but happily fill an input they
              can see in the DOM. `tabIndex={-1}` and `aria-hidden` keep it away
              from keyboard and screen-reader users entirely.
            */}
            <div aria-hidden className="pointer-events-none absolute left-[-9999px] opacity-0">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register('website')}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} aria-hidden className="animate-spin" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send size={16} aria-hidden />
                    Submit entry
                  </>
                )}
              </Button>

              <p className="font-mono text-label uppercase text-text-muted">
                Or email{' '}
                <a
                  href={`mailto:${email}`}
                  className="focus-ring rounded-sm text-accent-blue transition-colors duration-hover hover:text-accent-amber"
                >
                  {email}
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/**
 * Label, control and error message as one unit.
 *
 * Local to this file on purpose: it exists to stop the four fields above from
 * repeating the same label markup and the same error paragraph, not to become a
 * general-purpose form primitive for an app that has exactly one form.
 */
function Field({
  label,
  htmlFor,
  error,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-baseline gap-2 font-mono text-label uppercase text-text-muted"
      >
        {label}
        {optional ? <span className="text-text-muted">optional</span> : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="mt-2 font-body text-xs text-accent-amber">
          {error}
        </p>
      ) : null}
    </div>
  );
}
