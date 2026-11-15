/**
 * IRIS motion system — one shared scale for the whole product.
 *
 * Rules (from the UX overhaul spec):
 *  • Durations only ever FAST / MED / SLOW. Nothing longer navigates.
 *  • Animate transform + opacity ONLY. Never width/height/top/left/boxShadow.
 *  • Motion never blocks the interaction: everything is interruptible and
 *    route changes land within one frame of intent (≤ 320 ms).
 *  • `prefers-reduced-motion` AND the in-app calm mode kill decoration but
 *    never hide information: opacity crossfades are the accessible floor.
 */
import type { Transition, Variants } from 'motion/react';

/* ── Scale ─────────────────────────────────────────────────────────────── */
export const D = { FAST: 0.12, MED: 0.2, SLOW: 0.32 } as const;

/** The house easing — identical to --motion-ease in styles/iris.css so CSS
    and JS finally speak one timing language. */
export const EASE_STANDARD: [number, number, number, number] = [0.2, 0.8, 0.2, 1];
/** Decelerate for arrivals (cards, dialogs, reveals). */
export const EASE_DECEL: [number, number, number, number] = [0.05, 0.7, 0.1, 1];

/** The one and only spring — reserved for joyful moments (stars, pops,
    completions). Navigation never springs. */
export const SPRING_POP: Transition = { type: 'spring', stiffness: 300, damping: 30 };

export const T_FAST: Transition = { duration: D.FAST, ease: EASE_STANDARD };
export const T_MED: Transition = { duration: D.MED, ease: EASE_STANDARD };
export const T_SLOW: Transition = { duration: D.SLOW, ease: EASE_STANDARD };
export const T_ARRIVE: Transition = { duration: D.SLOW, ease: EASE_DECEL };

/* ── Page transitions ──────────────────────────────────────────────────────
   Subtle fade + a slight INLINE-axis slide, mirrored automatically for RTL
   by using logical CSS vars set per direction (see iris.css --iris-dir-x). */
/* Nav deliberately uses a SHORT spring, not a tween: motion accelerates
   plain tweens onto the Web Animations API, whose forwards-fill leaves an
   identity transform on the wrapper FOREVER — and any transform, even
   matrix(1,0,0,1,0,0), turns the page wrapper into the containing block of
   every position:fixed descendant, pushing the grown-up gate and break
   overlays off-screen (measured at 2245px tall instead of the viewport).
   Springs run on the JS pipeline, where our MotionConfig transformTemplate
   governs the resting style: at rest the string is pure identity → template
   returns '' → transform: none → overlays are viewport-fixed again. */
const T_NAV: Transition = { type: 'spring', stiffness: 460, damping: 42 };
const T_NAV_OUT: Transition = { type: 'spring', stiffness: 560, damping: 46 };
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 'calc(var(--iris-dir-x, 1) * 14px)', scale: 0.995 },
  animate: { opacity: 1, x: 0, scale: 1, transition: T_NAV },
  exit: { opacity: 0, x: 'calc(var(--iris-dir-x, 1) * -14px)', scale: 0.995, transition: T_NAV_OUT },
};

/* Reduced-motion / calm floor: OPACITY ONLY. When framer skips transform
   animations under prefers-reduced-motion, an initial x/scale would never be
   animated away — the leftover identity-ish transform makes the page wrapper
   the containing block for position:fixed dialogs (grown-up gate, break
   overlays) and they land off-screen. No transform keys = transform: none =
   overlays behave. Information was never carried by the slide. */
export const pageVariantsCalm: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: T_FAST },
  exit: { opacity: 0, transition: T_FAST },
};
/* Fallback for consumers without a direction context (symmetric slide). */
export const pageVariantsNeutral: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: T_SLOW },
  exit: { opacity: 0, y: -6, transition: T_FAST },
};

/* ── Reusable component variants ──────────────────────────────────────── */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: T_MED },
  exit: { opacity: 0, transition: T_FAST },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: SPRING_POP },
  exit: { opacity: 0, scale: 0.95, transition: T_FAST },
};

/** Dialogs/cards: gentle scale + fade both ways (spec §3). */
export const dialogVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: T_ARRIVE },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: T_FAST },
};

export const staggerParent: Transition = { ...T_MED };
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
export const staggerChild: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: T_ARRIVE },
};

/* ── Press/hover micro-feedback (transform only) ──────────────────────── */
export const tapProps = { whileTap: { scale: 0.97 }, transition: T_FAST } as const;
export const hoverLift = { whileHover: { y: -2, scale: 1.01 }, transition: T_MED } as const;
