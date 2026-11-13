/**
 * IrisMascot — the animated wrapper around the IRIS companion character.
 *
 * The character itself lives in IrisBuddy (an original SVG); this component
 * gives it movement, a mood glow and a speech bubble. It previously wrapped
 * the IRIS logo PNG instead, which meant the "mascot" had no face — see the
 * note at the swap site below. The logo is unchanged and still used for
 * branding elsewhere.
 * Moods: idle | listening | thinking | encourage | happy | celebrate |
 *        gentle | success | tryAgain.
 *
 * The mascot never covers the learning task — it lives beside or above the
 * prompt, and its speech bubble carries only short, warm, plain-language
 * copy (never engine terms like a rule ID or a reason code).
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { IrisBuddy } from './IrisBuddy';

export type MascotMood =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'encourage'
  | 'happy'
  | 'celebrate'
  | 'gentle'
  | 'success'
  | 'tryAgain';

interface IrisMascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  /** Short child-facing message shown in a speech bubble, per language. */
  messageAr?: string;
  messageEn?: string;
  language?: 'ar' | 'en';
  className?: string;
  /**
   * Set when the mascot sits on a saturated/dark surface (the hero card, for
   * example). The cream body already contrasts well there, so this is now a
   * light halo that lifts the character off the colour rather than the opaque
   * disc the old violet character needed to stay visible at all.
   */
  onDark?: boolean;
}

const SIZE_MAP = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };

function StarBurst() {
  const stars = ['⭐', '🌟', '✨', '💫', '⭐', '✨'];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((star, i) => {
        const angle = (i / stars.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 60;
        const y = Math.sin(rad) * 60;
        return (
          <motion.div
            key={i}
            className="absolute text-xl"
            style={{ left: '50%', top: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{ x, y, opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
          >
            {star}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Motion per state. Two rules hold across all nine:
 *  - nothing travels far (the companion sits beside a learning task, and a
 *    big movement beside a prompt is a competing demand — doc 05 §5)
 *  - only `idle`, `listening` and `thinking` loop; every reaction plays once
 *    and settles, so the screen becomes quiet again while the child works.
 */
const MOOD_ANIMATIONS: Record<MascotMood, object> = {
  idle: { y: [0, -8, 0], rotate: [0, 2, -2, 0] },
  listening: { scale: [1, 1.04, 1] },
  thinking: { y: [0, -4, 0], scale: [1, 1.03, 1], rotate: [0, -3, 0] },
  encourage: { x: [0, -5, 5, -3, 3, 0], y: [0, -5, 0], scale: [1, 1.05, 1] },
  happy: { y: [0, -16, 0, -10, 0], scale: [1, 1.15, 1, 1.08, 1], rotate: [0, 5, -5, 3, 0] },
  celebrate: { y: [0, -20, 0, -15, 0], scale: [1, 1.2, 0.95, 1.1, 1], rotate: [0, 15, -15, 10, -10, 0] },
  // A single slow nod. Deliberately the calmest reaction in the set: after a
  // wrong answer the companion should settle the moment, not perform.
  gentle: { y: [0, 4, 0], rotate: [0, -2, 0] },
  success: { y: [0, -14, 0, -8, 0], scale: [1, 1.12, 1, 1.06, 1] },
  // A small beckoning tilt — "come on, once more".
  tryAgain: { rotate: [0, -6, 6, -3, 0], y: [0, -4, 0] },
};

const MOOD_TRANSITION: Record<MascotMood, object> = {
  idle: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  listening: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  thinking: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  encourage: { duration: 0.6 },
  happy: { duration: 0.8 },
  celebrate: { duration: 1, repeat: 1 },
  gentle: { duration: 0.9, ease: 'easeInOut' },
  success: { duration: 0.8 },
  tryAgain: { duration: 0.8 },
};

/**
 * Glow colours are drawn from the brand palette rather than Tailwind's
 * defaults, so the halo around the companion belongs to the same identity as
 * its petals. Semantic, not decorative: warm for reward, calm for attention.
 */
const MOOD_GLOW: Record<MascotMood, string> = {
  idle: 'bg-[#FECA34]',
  listening: 'bg-[#1F67B1]',
  thinking: 'bg-[#8060B4]',
  encourage: 'bg-[#FECA34]',
  happy: 'bg-[#49B87A]',
  celebrate: 'bg-[#FECA34]',
  gentle: 'bg-[#8060B4]',
  success: 'bg-[#49B87A]',
  tryAgain: 'bg-[#FECA34]',
};

export function IrisMascot({
  mood = 'idle',
  size = 'md',
  messageAr,
  messageEn,
  language = 'ar',
  className = '',
  onDark = false,
}: IrisMascotProps) {
  const displayMessage = language === 'ar' ? messageAr : messageEn;
  const reduceMotion = useReducedMotion();

  /**
   * `idle` and `thinking` loop forever. Perpetual motion beside a learning task
   * is exactly the "unnecessary competing demand" the evidence base warns about
   * (doc 05 §5), and it is a vestibular problem for some children — so when the
   * OS asks for reduced motion the mascot simply holds still. It keeps its
   * mood colour and its speech bubble, so no information is lost.
   */
  const animation = reduceMotion ? undefined : MOOD_ANIMATIONS[mood];
  const transition = reduceMotion ? { duration: 0 } : MOOD_TRANSITION[mood];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {(mood === 'celebrate' || mood === 'success') && !reduceMotion && <StarBurst />}
        </AnimatePresence>
        {/* The cream body reads clearly on a saturated surface, so this is a
            gentle halo for separation rather than the opaque disc the old
            violet character needed in order to be visible at all. */}
        {onDark && <div className="absolute inset-0 -m-2 rounded-full bg-surface/15" />}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-colors duration-500 ${onDark ? 'bg-surface' : MOOD_GLOW[mood]}`} />
        <motion.div
          animate={animation}
          transition={transition}
          className={`relative z-10 ${SIZE_MAP[size]}`}
        >
          {/* The companion character. This slot used to hold the IRIS logo
              PNG — a wordmark with no face, which could not smile at a child
              or react to an answer. The logo is untouched and still used for
              branding (landing page, headers); the character belongs here,
              beside the child, where a face is the whole point.
              Decorative: any message it carries is in the bubble below, and
              the surrounding screen already names what is happening. */}
          <IrisBuddy mood={mood} className="w-full h-full p-0.5" />
        </motion.div>
      </div>
      <AnimatePresence>
        {displayMessage && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.9 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            className="relative bg-surface rounded-brand border-2 border-[#F3E3C8] shadow-brand px-4 py-2 max-w-[230px] text-center mt-1"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-transparent border-b-[#F3E3C8]" />
            <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[7px] border-transparent border-b-white" />
            <p className="text-sm font-bold text-[#2A2118]">{displayMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
