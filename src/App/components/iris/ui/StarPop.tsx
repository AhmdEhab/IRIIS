import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

/**
 * StarPop — the small "+1 ⭐" that rises after a correct answer.
 *
 * This is the visual half of the correct-answer moment; the audio half is the
 * children's cheer from the supplied Sounds folder. Either alone is enough to
 * understand what happened, which is the point: with sound muted the child
 * still sees the star, and with eyes off the screen they still hear the cheer.
 *
 * Kept deliberately small. A correct answer in a practice round is an ordinary,
 * frequent event — a full-screen celebration every few seconds would stop
 * meaning anything and would fight the "nothing overwhelming" rule. The big
 * celebration is reserved for an actual level-up.
 *
 * Under prefers-reduced-motion it fades instead of travelling.
 */
export function StarPop({
  visible,
  language = 'ar',
}: {
  visible: boolean;
  language?: 'ar' | 'en';
}) {
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          // Announced as well as drawn, so it is not a purely visual reward.
          role="status"
          aria-label={ar ? 'نجمة جديدة' : 'You earned a star'}
          // dir="ltr" because "+1" is a maths expression, not prose: inside an
          // RTL page the bidi algorithm otherwise reorders it to "1+".
          dir="ltr"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-30 flex items-center gap-1.5 rounded-full bg-brand-yellow-wash border-2 border-brand-yellow px-4 py-1.5 shadow-brand"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: -28, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.7, ease: 'easeOut' }}
        >
          <span className="text-xl" aria-hidden="true">⭐</span>
          <span className="font-black text-brand-yellow-ink" aria-hidden="true">+1</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
