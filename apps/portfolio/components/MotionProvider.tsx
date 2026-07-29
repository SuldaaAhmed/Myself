'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Wraps the app in Framer Motion's configuration.
 *
 * `reducedMotion="user"` is the entire reduced-motion implementation for
 * JavaScript-driven animation: when the operating system reports
 * `prefers-reduced-motion: reduce`, Framer stops animating transform and layout
 * properties (`y`, `x`, `scale`) and animates only opacity. The variants in
 * `lib/motion.ts` therefore never branch on the preference themselves — the
 * decision lives in one place and cannot be forgotten by a new component.
 *
 * This is a client component because `MotionConfig` uses context. It is the
 * only thing that has to be, which keeps the rest of the layout on the server.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
