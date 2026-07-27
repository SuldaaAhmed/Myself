import slugifyLib from 'slugify';

export function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/**
 * Returns a slug that is unique for the given model, appending -2, -3, … when
 * needed. `exists` is injected so this stays trivially testable.
 */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(input) || 'item';
  let candidate = base;
  let suffix = 1;

  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

/** Rough reading time in minutes, used for blog posts. */
export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
