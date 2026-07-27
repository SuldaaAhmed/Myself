'use client';

import { Loader2, Mail } from 'lucide-react';
import * as React from 'react';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/data';
import { Select, Textarea } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/lib/api/client';
import { useMessages, useUpdateMessage } from '@/lib/hooks/use-api';
import type { Message, MessageStatus } from '@/lib/api/types';
import { cn, formatDate } from '@/lib/utils';

const STATUS_TONES: Record<MessageStatus, 'accent' | 'neutral' | 'mint' | 'warn' | 'danger'> = {
  NEW: 'accent',
  READ: 'neutral',
  REPLIED: 'mint',
  ARCHIVED: 'neutral',
  SPAM: 'danger',
};

export default function MessagesPage() {
  const [status, setStatus] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data, isLoading } = useMessages({ status: status || undefined, limit: 50 });
  const update = useUpdateMessage();
  const { toast } = useToast();

  const messages = data?.data ?? [];
  const selected: Message | undefined =
    messages.find((message) => message.id === selectedId) ?? messages[0];

  // Opening a new message marks it read.
  React.useEffect(() => {
    if (selected && selected.status === 'NEW') {
      update.mutate({ id: selected.id, payload: { status: 'READ' } });
    }
    // Intentionally keyed on the id alone: re-running on every mutation of
    // `selected` would loop against its own update.
  }, [selected?.id]);

  const setMessageStatus = async (id: string, next: MessageStatus) => {
    try {
      await update.mutateAsync({ id, payload: { status: next } });
      toast(`Marked as ${next.toLowerCase()}`);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  return (
    <>
      <PageTitle
        title="Messages"
        description={data ? `${data.unread} unread of ${data.meta.total}` : 'Contact form submissions.'}
        action={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="max-w-44">
            <option value="">All statuses</option>
            {(['NEW', 'READ', 'REPLIED', 'ARCHIVED', 'SPAM'] as MessageStatus[]).map((value) => (
              <option key={value} value={value}>
                {value[0] + value.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        }
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="Inbox empty"
          description="Messages from the contact form land here."
          icon={<Mail className="size-6" />}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <ul className="card max-h-[70vh] divide-y divide-line overflow-y-auto">
            {messages.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  className={cn(
                    'w-full px-4 py-3.5 text-left transition-colors hover:bg-surface-muted',
                    selected?.id === message.id && 'bg-surface-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{message.name}</span>
                    <Badge tone={STATUS_TONES[message.status]}>{message.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{message.subject ?? message.email}</p>
                  <p className="mt-1 font-mono text-[0.625rem] text-muted">
                    {formatDate(message.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="card flex flex-col p-6">
              <header className="border-b border-line pb-5">
                <h2 className="font-display text-2xl">{selected.subject ?? 'No subject'}</h2>
                <p className="mt-2 text-sm">
                  {selected.name} ·{' '}
                  <a href={`mailto:${selected.email}`} className="link-underline">
                    {selected.email}
                  </a>
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
                  {selected.company ? <div>{selected.company}</div> : null}
                  {selected.budget ? <div>Budget: {selected.budget}</div> : null}
                  <div>{formatDate(selected.createdAt)}</div>
                </dl>
              </header>

              <p className="flex-1 whitespace-pre-wrap py-6 text-[0.9375rem] leading-relaxed">
                {selected.body}
              </p>

              <NotesEditor message={selected} />

              <footer className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button asChild size="sm">
                  <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject ?? 'your message'}`)}`}>
                    <Mail className="size-3.5" />
                    Reply by email
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMessageStatus(selected.id, 'REPLIED')}>
                  Mark replied
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMessageStatus(selected.id, 'ARCHIVED')}>
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-red-500"
                  onClick={() => setMessageStatus(selected.id, 'SPAM')}
                >
                  Mark spam
                </Button>
              </footer>
            </article>
          ) : null}
        </div>
      )}
    </>
  );
}

function NotesEditor({ message }: { message: Message }) {
  const [notes, setNotes] = React.useState(message.notes ?? '');
  const update = useUpdateMessage();
  const { toast } = useToast();

  React.useEffect(() => setNotes(message.notes ?? ''), [message.id, message.notes]);

  return (
    <div className="border-t border-line pt-5">
      <p className="eyebrow mb-2.5">Internal notes</p>
      <Textarea
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Never shown publicly."
      />
      <Button
        size="sm"
        variant="subtle"
        className="mt-2.5"
        loading={update.isPending}
        onClick={async () => {
          try {
            await update.mutateAsync({ id: message.id, payload: { notes } });
            toast('Notes saved');
          } catch (error) {
            toast(apiErrorMessage(error), 'error');
          }
        }}
      >
        Save notes
      </Button>
    </div>
  );
}
