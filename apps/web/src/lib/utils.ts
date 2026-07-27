import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
const FULL_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatMonthYear(value?: string | Date | null): string {
  if (!value) return 'Present';
  return MONTH_YEAR.format(new Date(value));
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  return FULL_DATE.format(new Date(value));
}

export function formatRange(start: string | Date, end?: string | Date | null): string {
  return `${formatMonthYear(start)} — ${end ? formatMonthYear(end) : 'Present'}`;
}

/** "2 years 4 months", used on the experience timeline. */
export function duration(start: string | Date, end?: string | Date | null): string {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months = Math.max(
    1,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
  );
  const years = Math.floor(months / 12);
  const rest = months % 12;

  return [years ? `${years} yr${years > 1 ? 's' : ''}` : null, rest ? `${rest} mo` : null]
    .filter(Boolean)
    .join(' ');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Minimal markdown renderer for CMS bodies: headings, lists, bold, italics,
 * inline code and links. Deliberately small — the CMS stores markdown, and
 * shipping a full parser to every visitor is not worth the bytes.
 */
export function renderMarkdown(markdown: string): string {
  const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const inline = (text: string) =>
    escape(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );

  const blocks: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
      list = [];
    }
  };

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trimEnd();

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ''));
      continue;
    }
    flushList();

    if (!line.trim()) continue;

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    blocks.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  return blocks.join('');
}
