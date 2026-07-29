import { z } from 'zod';

/**
 * The contact form's validation rules, shared by the browser and the server.
 *
 * The form validates with this schema through `zodResolver`, and
 * `app/api/contact/route.ts` re-validates the parsed body with the same object
 * before forwarding it. Client-side validation is a courtesy to the person
 * typing; it is not a control, because anything can POST to the endpoint.
 * One schema means the two checks cannot disagree.
 *
 * Messages are written in the site's voice — plain and specific about what to
 * fix. No error string here should read like an HTTP status.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please tell me your name.')
    .max(80, "That's longer than any name I can store."),

  email: z.email('That email address does not look right.').max(160),

  // Optional, and empty strings are normalised away so the API receives
  // `undefined` rather than `""` — an empty subject is an absent subject.
  subject: z
    .string()
    .trim()
    .max(120, 'Try to keep the subject under 120 characters.')
    .optional()
    .transform((value) => (value ? value : undefined)),

  message: z
    .string()
    .trim()
    .min(20, 'A couple of sentences, please — 20 characters at minimum.')
    .max(4000, 'That is past 4000 characters. Send a link instead?'),

  /**
   * Honeypot. Hidden from people via `aria-hidden` and off-screen positioning,
   * left irresistible to the crawlers that fill in every input they find.
   *
   * Note what this field does *not* do: it has no `.max(0)`, so a filled-in
   * honeypot is valid input. That is deliberate. Rejecting it here would return
   * a 400 with a field error naming `website`, which tells whoever wrote the bot
   * exactly which input to leave alone next time. Instead the value passes
   * validation and `app/api/contact/route.ts` quietly discards the submission
   * with a success response.
   */
  website: z.string().optional(),
});

/**
 * The schema's *input* type — what the form holds while it is being typed into.
 * `subject` is a `string` here because an untouched text input is `''`.
 */
export type ContactFormInput = z.input<typeof contactSchema>;

/**
 * The schema's *output* type — what a successful parse produces, after the
 * `subject` transform has turned an empty string into `undefined`. This is what
 * the submit handler and the API receive.
 *
 * The two differ, which is why `ContactForm` passes both to `useForm`: React
 * Hook Form tracks the input shape while typing and hands the output shape to
 * `handleSubmit`. Collapsing them into one `z.infer` is the usual source of the
 * "Resolver is not assignable" error when a schema contains a transform.
 */
export type ContactFormValues = z.output<typeof contactSchema>;

/** Field-level errors keyed by field name, as returned by the route handler. */
export type ContactFieldErrors = Partial<Record<keyof ContactFormInput, string>>;
