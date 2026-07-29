import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional class names with conflict resolution.
 *
 * `clsx` flattens the conditionals; `twMerge` makes the *last* Tailwind class
 * win when two classes target the same property. Without it, a component that
 * accepts a `className` prop cannot be overridden by its caller — `px-4` and
 * `px-8` would both land in the DOM and the winner would depend on stylesheet
 * order rather than on intent.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date as the ledger entry ID: `2024.03`.
 *
 * This is the identifier printed at the left of every ledger row. It is derived
 * from `project.startedAt` rather than being a sequence number, so entries stay
 * stable when the list is filtered or reordered — row three is always the same
 * project, whichever position it happens to occupy.
 *
 * Returns `----.--` for an unparseable date so a bad record degrades into an
 * obviously-empty slot instead of `NaN.NaN`.
 */
export function formatEntryId(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '----.--';

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
}

/**
 * Long-form date for project detail pages: `March 2024`.
 *
 * Pinned to `en-GB` and UTC. Left to the runtime default, this would render
 * differently on the server than in the browser and React would report a
 * hydration mismatch.
 */
export function formatMonthYear(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/**
 * Compact relative time for the status bar: `4m ago`, `2h ago`, `3d ago`.
 *
 * Deliberately *not* rendered on the server. "2h ago" is only true at the
 * moment it is computed; baking it into static HTML means a cached page claims
 * an update happened two hours ago for as long as the cache lives. `StatusBar`
 * calls this from a `useEffect` after mount, which is also why the function
 * takes `now` as a parameter — it makes the output testable without mocking the
 * clock.
 */
export function formatRelativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const then = new Date(isoTimestamp);
  if (Number.isNaN(then.getTime())) return 'unknown';

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // A clock skew between server and browser can put the timestamp slightly in
  // the future. "just now" is a better answer than "-1m ago".
  if (seconds < MINUTE) return 'just now';
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  if (seconds < DAY * 30) return `${Math.floor(seconds / DAY)}d ago`;

  return formatMonthYear(isoTimestamp).toLowerCase();
}

/**
 * Trims prose to a whole word near `maxLength` and appends an ellipsis.
 *
 * Used for the hero pitch, which reads the full `profile.bio` and shows only
 * its opening. Cutting at a word boundary avoids "a remittance platfo…".
 */
export function excerpt(text: string, maxLength = 180): string {
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;

  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '')}…`;
}

/**
 * The first sentence of a body of text, for the one-line hero pitch.
 *
 * Falls back to a word-boundary excerpt when the text has no sentence break,
 * so a bio written as a single long clause still produces something readable.
 */
export function firstSentence(text: string, maxLength = 180): string {
  const match = text.trim().match(/^.*?[.!?](?=\s|$)/);
  const candidate = match?.[0] ?? text;
  return excerpt(candidate, maxLength);
}

/**
 * Sorts projects newest-first by `startedAt`.
 *
 * Returns a new array — the input may be a cached fetch result shared between
 * requests, and sorting it in place would mutate state other callers depend on.
 */
export function sortByStartedAtDesc<T extends { startedAt: string }>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

/**
 * Every distinct tech-stack entry across a set of projects, alphabetised.
 * Feeds the tag filter on `/projects` so the filter list is always exactly the
 * set of tags that can actually match something.
 */
export function collectTechStack(projects: readonly { techStack: string[] }[]): string[] {
  const tags = new Set<string>();
  for (const project of projects) {
    for (const tag of project.techStack) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
