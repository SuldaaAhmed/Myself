'use client';

import { Copy, Loader2, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { PageTitle } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/data';
import { Input } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast';
import { api, apiErrorMessage } from '@/lib/api/client';
import { useMedia, useUploadMedia } from '@/lib/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';

const kb = (bytes: number) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

export default function MediaPage() {
  const [folder, setFolder] = React.useState('');
  const { data, isLoading } = useMedia({ limit: 60, folder: folder || undefined });
  const upload = useUploadMedia();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const items = data?.data ?? [];

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        await upload.mutateAsync({ file, folder: folder || 'general' });
      }
      toast(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this file? Anything referencing it will lose its image.')) return;
    try {
      await api.delete(`/media/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      toast('Deleted');
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  return (
    <>
      <PageTitle
        title="Media library"
        description="Images and PDFs used across the site. Stored on Cloudinary when configured, on disk otherwise."
        action={
          <div className="flex gap-2">
            <Input
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              placeholder="Folder (optional)"
              className="max-w-40"
            />
            <Button onClick={() => inputRef.current?.click()} loading={upload.isPending}>
              <Upload className="size-4" />
              Upload
            </Button>
          </div>
        }
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => void onFiles(event.target.files)}
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-5 animate-spin text-muted" aria-label="Loading" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No files yet" description="Upload an image to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <figure key={item.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-surface-muted">
                {item.mimeType.startsWith('image/') ? (
                  <Image
                    src={item.url}
                    alt={item.alt ?? item.filename}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover"
                    unoptimized={item.url.endsWith('.svg')}
                  />
                ) : (
                  <span className="grid h-full place-items-center font-mono text-xs text-muted">
                    {item.mimeType}
                  </span>
                )}
              </div>

              <figcaption className="space-y-2 p-4">
                <p className="truncate text-sm" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[0.625rem] text-muted">
                  <Badge>{item.provider.toLowerCase()}</Badge>
                  <span>{kb(item.size)}</span>
                  {item.width ? (
                    <span>
                      {item.width}×{item.height}
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => {
                      void navigator.clipboard.writeText(item.url);
                      toast('URL copied');
                    }}
                  >
                    <Copy className="size-3.5" />
                    Copy URL
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(item.id)} aria-label="Delete">
                    <Trash2 className="size-3.5 text-red-500" />
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
