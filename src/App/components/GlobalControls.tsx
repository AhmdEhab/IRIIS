import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp, type Screen } from '../contexts/AppContext';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * The two controls pinned to the corner of every screen: mute and language.
 *
 * TWO FIXES LIVE HERE
 *
 * 1. NEITHER BUTTON HAD AN ACCESSIBLE NAME. A screen reader announced them as
 *    bare "button", so a keyboard or screen-reader user had no way to know
 *    which was mute and which was the language switch. Both now state what
 *    they do AND their current state.
 *
 * 2. DUPLICATE MUTE. Child screens render their own AudioControl (mute +
 *    repeat + music) inside the page header. This component is fixed to the
 *    same corner, so on those screens the two groups physically overlapped and
 *    presented the child with two different speaker icons meaning almost the
 *    same thing. On screens that carry their own audio controls, the mute
 *    button here is therefore hidden and only the language toggle remains —
 *    the contextual control wins, because it also offers "repeat", which is
 *    the one a child actually needs mid-question.
 */

/** Screens whose own UI already provides mute/repeat/music controls. */
const SCREENS_WITH_OWN_AUDIO_CONTROLS = new Set<Screen>([
  'child-mode',
  'stories',
]);

export function GlobalControls() {
  const { isEnabled, toggleAudio } = useAudio();
  const { language, setLanguage } = useLanguage();
  const { currentScreen } = useApp();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  const showMute = !SCREENS_WITH_OWN_AUDIO_CONTROLS.has(currentScreen);

  const btn =
    'size-11 rounded-full bg-surface border border-hairline/30 shadow-brand ' +
    'flex items-center justify-center text-ink hover:bg-surface/40 transition-all';

  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2" dir="ltr">
      {showMute && (
        <motion.button
          whileHover={reduceMotion ? undefined : { scale: 1.1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={toggleAudio}
          aria-pressed={isEnabled}
          aria-label={
            ar
              ? isEnabled
                ? 'الصوت مفتوح. اضغط للكتم.'
                : 'الصوت مكتوم. اضغط للتشغيل.'
              : isEnabled
                ? 'Sound is on. Press to mute.'
                : 'Sound is off. Press to unmute.'
          }
          title={ar ? (isEnabled ? 'كتم الصوت' : 'تشغيل الصوت') : isEnabled ? 'Mute' : 'Unmute'}
          className={btn}
        >
          {isEnabled ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
        </motion.button>
      )}

      <motion.button
        whileHover={reduceMotion ? undefined : { scale: 1.1 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        onClick={() => setLanguage(ar ? 'en' : 'ar')}
        aria-label={ar ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
        title={ar ? 'English' : 'العربية'}
        className={`${btn} font-black text-xs`}
      >
        <span aria-hidden="true">{ar ? 'EN' : 'AR'}</span>
      </motion.button>
    </div>
  );
}
