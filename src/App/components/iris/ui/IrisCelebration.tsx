/**
 * IrisCelebration — brief, gentle reward moment on a level-up.
 *
 * Shown when the pathway engine's decision is a level-up (ADVANCE_MASTERY).
 * Purely presentational: it renders a name/language pair handed to it as plain
 * props and NEVER prints an internal rule_id or reason_code on screen — the
 * child only ever sees "Level up!", never "ADVANCE_MASTERY". It does not call
 * or block any engine code.
 *
 * MOTION BUDGET
 * The previous version rained twelve pieces of confetti across the full
 * viewport, each spinning up to 720°, for 2.5s. That is the "overwhelming
 * confetti / excessive motion" case this product is explicitly meant to avoid,
 * and it is a vestibular-safety problem for some children. It is now:
 *   - eight pieces, gentle drift, at most a quarter turn
 *   - fully suppressed under prefers-reduced-motion, which degrades to a
 *     simple fade — the reward still happens, it just stops moving
 *   - announced to assistive tech, so the reward is not visual-only
 *
 * No claim is made that this celebration improves learning or motivation; the
 * project's evidence review has no reward-design or reinforcement-schedule
 * evidence for this population (docs 29 §H, 05 §9). It is a warmth choice.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface IrisCelebrationProps {
  visible: boolean;
  nameAr?: string;
  nameEn?: string;
  language?: 'ar' | 'en';
  onDone?: () => void;
}

const CONFETTI = ['⭐', '🌟', '✨', '🎈', '💫', '⭐', '🌟', '✨'];

function ConfettiPiece({ char, delay, left }: { char: string; delay: number; left: number }) {
  return (
    <motion.div
      className="absolute text-3xl pointer-events-none select-none"
      style={{ left: `${left}%`, top: -50 }}
      initial={{ y: -50, opacity: 0.9, rotate: 0 }}
      animate={{ y: '105vh', opacity: [0.9, 0.9, 0], rotate: 90 }}
      transition={{ duration: 3.2, delay, ease: 'linear' }}
      aria-hidden="true"
    >
      {char}
    </motion.div>
  );
}

export function IrisCelebration({
  visible,
  nameAr,
  nameEn,
  language = 'ar',
  onDone,
}: IrisCelebrationProps) {
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';
  const name = ar ? nameAr : nameEn;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  return createPortal((
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden lc-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
        >
          {!reduceMotion &&
            CONFETTI.map((c, i) => (
              // Evenly spaced rather than random, so pieces never clump into a
              // dense flicker in one part of the screen.
              <ConfettiPiece key={i} char={c} delay={i * 0.16} left={6 + i * 11.5} />
            ))}

          <motion.div
            role="status"
            aria-live="polite"
            className="relative bg-surface rounded-brand-xl border-8 border-brand-yellow shadow-brand-lg px-10 py-8 text-center max-w-sm mx-4"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', damping: 16, stiffness: 180, delay: 0.08 }
            }
          >
            <div className="text-7xl mb-3" aria-hidden="true">🏆</div>
            <p className="text-3xl font-black text-brand-yellow-ink mb-1">
              {ar ? 'أحسنت!' : 'Level Up!'}
            </p>
            {name && (
              <p className="text-xl font-bold text-ink-muted">
                {ar
                  ? `${name}، وصلت للمستوى اللي بعده! 🌟`
                  : `${name}, you reached the next level! 🌟`}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), document.body);
}
