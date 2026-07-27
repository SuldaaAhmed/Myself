import type { Metadata } from 'next';
import Image from 'next/image';
import { Reveal } from '@/components/motion/reveal';
import { PageHeader, Section } from '@/components/site/section';
import { Badge, EmptyState } from '@/components/ui/data';
import { apiList } from '@/lib/api/server';
import { buildMetadata } from '@/lib/api/site';
import type { GalleryItem } from '@/lib/api/types';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata('/gallery', {
    title: 'Gallery',
    description: 'Process shots, whiteboards, talks and the occasional finished screen.',
  });
}

export default async function GalleryPage() {
  const items = await apiList<GalleryItem>('/gallery', { tags: ['gallery'] });
  const albums = [...new Set(items.map((item) => item.album).filter(Boolean))] as string[];

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="The work in progress."
        description="Whiteboards, prototypes and talks — the parts that rarely make it into a case study."
      />

      <Section>
        {items.length === 0 ? (
          <EmptyState title="No images published yet" />
        ) : (
          <>
            {albums.length > 0 ? (
              <div className="mb-10 flex flex-wrap gap-2">
                {albums.map((album) => (
                  <Badge key={album} tone="neutral" className="px-3 py-1.5 text-xs">
                    {album}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={(index % 3) * 0.05} className="mb-4 break-inside-avoid">
                  <figure className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                      {/* Unoptimised because gallery sources vary; the CMS stores dimensions. */}
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized={item.imageUrl.endsWith('.svg')}
                      />
                    </div>
                    <figcaption className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                        ) : null}
                      </div>
                      {item.album ? <Badge>{item.album}</Badge> : null}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Section>
    </>
  );
}
