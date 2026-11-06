/**
 * WorkNear — shared Framer Motion variants
 * Import from here everywhere instead of redefining variants per-file,
 * so every page/component animates with the same easing & timing language.
 */

export const EASE = [0.2, 0.8, 0.2, 1];
export const EASE_SNAP = [0.34, 1.56, 0.64, 1];

/** Simple fade + rise. Use `custom={i}` on the element to stagger by index. */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.06, ease: EASE },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.06, ease: EASE_SNAP },
  }),
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
  }),
};

export const slideInRight = {
  hidden: { opacity: 0, x: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
  }),
};

/** Parent wrapper — put on a motion.div, children with any variant above will cascade. */
export const staggerContainer = (stagger = 0.09, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Whole-page transition — used by App.jsx's PageTransition wrapper. */
export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: EASE } },
};

/** Standard hover/tap lift for buttons & interactive chips. */
export const liftHover = {
  whileHover: { y: -3, transition: { duration: 0.2, ease: EASE } },
  whileTap: { scale: 0.97 },
};

export const springLogo = {
  whileHover: { scale: 1.12, rotate: -4 },
  transition: { type: 'spring', stiffness: 380, damping: 12 },
};

/** Looping breathe animation for logo marks / icons on auth pages. */
export const breathe = {
  animate: { scale: [1, 1.06, 1] },
  transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
};
