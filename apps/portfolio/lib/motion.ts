import type { Transition, Variants } from 'framer-motion';

/**
 * The app's entire motion vocabulary.
 *
 * There is exactly one animation on this site: the page-load sequence, in which
 * hero elements and the first few ledger rows fade and rise in a short stagger.
 * Everything else — hover, focus, accordion expansion — is a CSS transition.
 * Keeping the variants in one file makes that constraint visible: if a new
 * animation is not defined here, it should not exist.
 *
 * Reduced motion is handled by `MotionProvider`, which wraps the tree in
 * Framer's `MotionConfig reducedMotion="user"`. That makes Framer drop
 * transform-based properties (`y`, `scale`) while still running opacity, which
 * is precisely the required fallback — so these variants do not need to branch
 * on the user's preference themselves.
 */

/** 300–400ms, ease-out. Fast enough to feel like the page simply arrived. */
const EASE_OUT: Transition = {
  duration: 0.36,
  ease: [0.16, 1, 0.3, 1],
};

/**
 * Parent variant. Children with the `riseIn` variant inherit `hidden`/`visible`
 * automatically, so a section only has to declare the container and its rows.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06, // 60ms between siblings
      delayChildren: 0.04,
    },
  },
};

/** The single child animation: 12px rise plus fade. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: EASE_OUT },
};

/**
 * The stagger is a *page load* effect, not a scroll effect — the brief rules out
 * scroll-jacking and parallax, and animating rows as they scroll into view is
 * the same idea in a quieter costume. Sections below the fold therefore render
 * at rest.
 *
 * Only the first three ledger rows animate; beyond that a stagger stops reading
 * as one motion and starts reading as a list loading slowly.
 */
export const MAX_STAGGERED_ROWS = 3;
