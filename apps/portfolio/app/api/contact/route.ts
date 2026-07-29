import { NextResponse } from 'next/server';
import { contactSchema, type ContactFieldErrors } from '@/lib/contact-schema';

/**
 * `POST /api/contact` — the contact form's endpoint.
 *
 * The form posts here rather than straight to the backend, and that indirection
 * buys three things:
 *
 *  1. The API's origin and any credential stay on the server. A browser
 *     posting directly to the backend would need it exposed and CORS-open.
 *  2. Validation is enforced somewhere the submitter cannot skip. Client-side
 *     checks are a courtesy to the person typing; anything can `curl` this URL.
 *  3. The backend's error shape is translated once, here, into the
 *     `{ message, fieldErrors }` contract the form understands — so swapping
 *     the mail provider or the API does not touch the component.
 *
 * The route runs on the Node runtime (Next's default for route handlers), which
 * the module-level rate-limit map below depends on.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3; // submissions per window, per IP

/**
 * In-memory, fixed-window rate limiter.
 *
 * Its limits are worth stating plainly rather than discovering later: the map
 * lives in one server process, so it resets on deploy and does not coordinate
 * across instances. It is a speed bump for the naive case — a script hammering
 * the form from one address — not a defence against a distributed one. If this
 * site ever needs the real thing, it belongs in Redis or at the edge, and this
 * function is the seam to replace.
 */
const submissions = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = submissions.get(ip);

  if (!record || now > record.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });

    // Opportunistic cleanup. Without it the map grows for the lifetime of the
    // process, one entry per address that ever submitted.
    if (submissions.size > 5_000) {
      for (const [key, value] of submissions) {
        if (now > value.resetAt) submissions.delete(key);
      }
    }

    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

/**
 * Best-effort client address.
 *
 * `x-forwarded-for` is set by the proxy in front of the app and can be spoofed
 * when there is no proxy — acceptable for a speed bump, not for anything that
 * makes a security decision.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { message: "That's a few messages in a short time. Try again in ten minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'That request was not readable.' }, { status: 400 });
  }

  // The same schema the form validates against — one definition, two checks.
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    // Flatten Zod's issue list into `{ field: message }`, which is what the
    // form's `setError` loop expects. Only the first message per field is kept:
    // showing two errors under one input is noise, and fixing the first usually
    // resolves the second.
    const fieldErrors: ContactFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !(field in fieldErrors)) {
        fieldErrors[field as keyof ContactFieldErrors] = issue.message;
      }
    }

    return NextResponse.json({ message: 'Some fields need another look.', fieldErrors }, {
      status: 400,
    });
  }

  const { website, ...message } = parsed.data;

  /*
    Honeypot tripped. Answer 200 and discard: telling a bot it was detected
    only tells whoever wrote it which field to leave alone next time. A person
    can never reach this branch — the input is off-screen, `aria-hidden` and
    outside the tab order.
  */
  if (website) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  // No backend configured — the front end is being developed or reviewed on its
  // own. Log the payload so the flow is still testable end to end, and answer
  // as though it was delivered.
  if (!API_BASE_URL) {
    console.warn('[contact] NEXT_PUBLIC_API_URL is not set; message not delivered:', {
      ...message,
      // Never log the body itself; a contact form is where people paste things
      // they would not want in a log aggregator.
      message: `${message.message.length} characters`,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
      // A contact form must never be cached or deduplicated.
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[contact] API rejected the message:', response.status);
      return NextResponse.json(
        { message: 'The message could not be filed. Try again, or email me directly.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('[contact] could not reach the API:', (error as Error).message);
    return NextResponse.json(
      { message: 'The message could not be filed. Try again, or email me directly.' },
      { status: 502 },
    );
  }
}
