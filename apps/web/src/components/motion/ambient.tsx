'use client';

import * as React from 'react';

/**
 * A soft accent glow that follows the pointer. Pure CSS custom properties, one
 * rAF-throttled listener, and it disables itself for touch devices and for
 * anyone who asked for reduced motion.
 */
export function CursorSpotlight({ enabled = true }: { enabled?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const node = ref.current;
        if (!node) return;
        node.style.setProperty('--x', `${event.clientX}px`);
        node.style.setProperty('--y', `${event.clientY}px`);
        node.style.opacity = '1';
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(420px circle at var(--x, 50%) var(--y, 20%), color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)',
      }}
    />
  );
}

/** Horizontal, infinitely looping strip of labels (the technology marquee). */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div
      className={className}
      style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
    >
      <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-10 hover:[animation-play-state:paused]">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center gap-10 font-display text-2xl text-muted sm:text-3xl"
          >
            {item}
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
