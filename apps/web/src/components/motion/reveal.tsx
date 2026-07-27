'use client';

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-triggered entrance. One component, used everywhere, so the whole site
 * shares a single motion language instead of ad-hoc animations per section.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={reduced ? undefined : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

/** Staggered children — used for card grids and lists. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? {} : { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
