import { renderMarkdown } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Renders CMS markdown. The content comes from the authenticated dashboard, and
 * `renderMarkdown` escapes every raw HTML character before formatting, so the
 * only tags in the output are the ones it generates itself.
 */
export function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn('prose-editorial', className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
