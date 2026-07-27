'use client';

import { ImagePlus, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/overlays';
import { useToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/lib/api/client';
import { useMedia, useUploadMedia } from '@/lib/hooks/use-api';
import { cn } from '@/lib/utils';

/**
 * Image field with three ways in: upload a new file, pick from the library, or
 * paste a URL. Used for every image in the CMS.
 */
export function MediaPicker({
  value,
  onChange,
  folder = 'general',
}: {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const upload = useUploadMedia();
  const { data: media, isLoading } = useMedia({ limit: 40 });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const uploaded = await upload.mutateAsync({ file, folder });
      onChange(uploaded.url);
      setOpen(false);
      toast('Uploaded');
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="relative size-20 overflow-hidden rounded-xl border border-line bg-surface-muted">
            <Image
              src={value}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={value.endsWith('.svg')}
            />
          </div>
        ) : (
          <div className="grid size-20 place-items-center rounded-xl border border-dashed border-line text-muted">
            <ImagePlus className="size-5" aria-hidden />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={upload.isPending}
          >
            <Upload className="size-3.5" />
            Upload
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="subtle" size="sm">
                Media library
              </Button>
            </DialogTrigger>
            <DialogContent title="Media library" description="Pick an existing file." className="w-[min(94vw,52rem)]">
              {isLoading ? (
                <div className="grid h-40 place-items-center">
                  <Loader2 className="size-4 animate-spin text-muted" />
                </div>
              ) : (
                <div className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                  {(media?.data ?? []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setOpen(false);
                      }}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-xl border transition-colors',
                        value === item.url ? 'border-accent' : 'border-line hover:border-line-strong',
                      )}
                      title={item.filename}
                    >
                      {item.mimeType.startsWith('image/') ? (
                        <Image
                          src={item.url}
                          alt={item.alt ?? item.filename}
                          fill
                          sizes="160px"
                          className="object-cover"
                          unoptimized={item.url.endsWith('.svg')}
                        />
                      ) : (
                        <span className="grid h-full place-items-center px-2 text-center font-mono text-[0.625rem] text-muted">
                          {item.filename}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <Input
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="…or paste a URL"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
    </div>
  );
}
