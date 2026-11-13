/**
 * IRIS Landing — the first screen anyone sees.
 *
 * ── WHAT PHASE 10 CHANGED AND WHY ─────────────────────────────────────────
 * D4 — the screen showed the logo and then RETYPED "IRIS" beneath it in a
 *      plain bold sans. The logo already contains the wordmark, so the effect
 *      was two competing wordmarks in two different voices. The retyped
 *      heading is gone; the logo is the wordmark.
 * D5 — the tagline read "Learn. Adapt. Grow.", which is not an IRIS line. The
 *      identity pack's own lines are "Understanding, not standardizing.",
 *      "Explore. Grow. Play." and "Hope. Courage. Wisdom." The first is the
 *      signature phrase, so it leads, with the brochure's own emphasis: one
 *      word carries the meaning and takes the marker swipe.
 * D6 — two language controls were on screen at once: these pills AND the
 *      floating glass "AR" button. GlobalControls is retired; the pills are
 *      the single control, and they now live in the TopBar.
 * D10— the two mode cards used 🧒 and 👪, which render as different artwork on
 *      every operating system. They use the drawn brand marks now.
 *
 * Colour: the corner blobs went from 7% to ~16% opacity. At 7% on a cream
 * ground the brand colours desaturate into grey and the screen read as beige,
 * not as IRIS.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  ScreenFrame,
  TopBar,
  Logo,
  DisplayTitle,
  Mark,
  BrandIcon,
} from './ui/brand';

export function IrisLanding({
  onParentMode,
  onChildMode,
}: {
  onParentMode: () => void;
  onChildMode: () => void;
}) {
  const { language, setLanguage } = useLanguage() as any;
  const ar = language === 'ar';
  const reduceMotion = useReducedMotion();

  return (
    <ScreenFrame
      accent="blue"
      width="lg"
      topBar={
        <TopBar
          ar={ar}
          actions={
            <div className="flex items-center gap-1.5" role="group" aria-label={ar ? 'اللغة' : 'Language'}>
              <LangPill active={ar} onClick={() => setLanguage('ar')}>عربي</LangPill>
              <LangPill active={!ar} onClick={() => setLanguage('en')}>English</LangPill>
            </div>
          }
        />
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.45 }}
          className="mb-8"
        >
          {/* The logo IS the wordmark. Nothing is retyped beneath it. */}
          <Logo size="lg" />
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.1 }}
          className="max-w-2xl mb-10"
        >
          {/* The brochure's own construction: a statement where ONE phrase
              carries the meaning and takes the marker swipe. */}
          <DisplayTitle>
            {ar ? (
              <>
                نفهم الطفل، <Mark>مش نقيسه بمسطرة واحدة</Mark>
              </>
            ) : (
              <>
                Understanding, <Mark>not standardizing</Mark>
              </>
            )}
          </DisplayTitle>
          <p className="t-body-lg text-ink-muted mt-4">
            {ar ? 'نستكشف. ننمو. نلعب.' : 'Explore. Grow. Play.'}
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.18 }}
          className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          <ModeCard
            icon="child"
            tone="yellow"
            title={ar ? 'وضع الطفل' : 'Child Mode'}
            body={ar ? 'نلعب ونتعلّم مع إيريس' : 'Play and learn with IRIS'}
            onClick={onChildMode}
          />
          <ModeCard
            icon="family"
            tone="blue"
            title={ar ? 'وضع الوالدين' : 'Parent Mode'}
            body={ar ? 'التسجيل، المتابعة، والدعم' : 'Register, track progress, and get guidance'}
            onClick={onParentMode}
          />
        </motion.div>

        <p className="mt-10 t-small text-ink-muted max-w-md font-medium">
          {ar
            ? 'محتوى مبني على إطار أدلة بحثي — نموذج أولي للتقييم، وليس معتمدًا إكلينيكيًا بعد.'
            : 'Research-informed content — a prototype for evaluation, not yet clinically validated.'}
        </p>
      </div>
    </ScreenFrame>
  );
}

function LangPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'h-11 px-4 rounded-brand-pill border-2 t-small transition-colors ' +
        (active
          ? 'bg-brand-blue-ink border-brand-blue-ink text-white'
          : 'bg-surface border-hairline text-ink hover:bg-ground-tint')
      }
    >
      {children}
    </button>
  );
}

/**
 * The two paths into the product. Big, calm, one drawn mark each.
 * `tone` is per card rather than from the screen accent: these two cards ARE
 * the "one dominant colour" exception — the whole point of the screen is that
 * there are exactly two doors, and colour is what tells them apart.
 */
function ModeCard({
  icon,
  tone,
  title,
  body,
  onClick,
}: {
  icon: 'child' | 'family';
  tone: 'yellow' | 'blue';
  title: string;
  body: string;
  onClick: () => void;
}) {
  const wash = tone === 'yellow' ? 'bg-brand-yellow-wash' : 'bg-brand-blue-wash';
  const ink = tone === 'yellow' ? 'text-brand-yellow-ink' : 'text-brand-blue-ink';
  const hover = tone === 'yellow' ? 'hover:border-brand-yellow' : 'hover:border-brand-blue';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group bg-surface rounded-brand-xl border-2 border-hairline shadow-brand p-7
        flex flex-col items-center gap-4 transition-[transform,border-color] duration-200
        hover:-translate-y-1 ${hover}`}
    >
      <span
        className={`w-24 h-24 rounded-brand-lg flex items-center justify-center ${wash} ${ink}
          transition-transform duration-200 group-hover:scale-105`}
        aria-hidden="true"
      >
        <BrandIcon name={icon} className="w-14 h-14" tone="transparent" />
      </span>
      <span className="t-heading text-ink">{title}</span>
      <span className="t-small text-ink-muted font-medium">{body}</span>
    </button>
  );
}
