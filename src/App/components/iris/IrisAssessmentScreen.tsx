/**
 * IRIS Assessment Screen — doc 11.
 *
 * This is an educational learning screening. It produces per-sub-measure
 * performance data. It is NOT an IQ test, produces no IQ-like number, and
 * makes no diagnostic claim. The item set is IDENTICAL for every child — the
 * diagnosis does not select, weight, or reorder a single item.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { Button } from '../ui/button';
import { IrisCompanion } from './ui/IrisCompanion';
import type { CompanionMoment } from './ui/companionLines';
import { ChildProgressDots } from './ui/ChildProgressDots';
import { AudioControl } from './ui/AudioControl';
import { NarrationCaption } from './ui/NarrationCaption';
import { StarPop } from './ui/StarPop';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/** Screening items — original educational content, no proprietary test items. */
const SCREEN_ITEMS: Record<string, Array<{ step: number; q: { ar: string; en: string }; options: string[]; correct: number }>> = {
  'LANG.RECEP_VOCAB': [
    { step: 1, q: { ar: 'أين القطة؟', en: 'Where is the cat?' }, options: ['🐈', '🚗'], correct: 0 },
    { step: 1, q: { ar: 'أين الكرة؟', en: 'Where is the ball?' }, options: ['👟', '⚽'], correct: 1 },
    { step: 2, q: { ar: 'أين الموزة؟', en: 'Where is the banana?' }, options: ['🍌', '🏠', '🐦'], correct: 0 },
    { step: 2, q: { ar: 'أين الكوب؟', en: 'Where is the cup?' }, options: ['📚', '🥤', '👞'], correct: 1 },
    { step: 3, q: { ar: 'ماذا نستخدم لنشرب؟', en: 'What do we drink from?' }, options: ['🥤', '📚', '👟'], correct: 0 },
    { step: 3, q: { ar: 'أي حيوان يعيش في الماء؟', en: 'Which animal lives in water?' }, options: ['🐕', '🐟', '🐦'], correct: 1 },
  ],
  'LANG.PHON_AWARE': [
    { step: 1, q: { ar: 'أي كلمة تبدأ بنفس صوت «شمس»؟', en: 'Which starts like "sun"?' }, options: ['☀️', '🚗'], correct: 0 },
    { step: 1, q: { ar: 'أي كلمة تبدأ بنفس صوت «باب»؟', en: 'Which starts like "ball"?' }, options: ['🐦', '⚽'], correct: 1 },
    { step: 2, q: { ar: 'بأي حرف تبدأ كلمة «توت»؟', en: 'Which letter starts "toy"?' }, options: ['ت', 'م', 'ك'], correct: 0 },
    { step: 2, q: { ar: 'بأي حرف تبدأ كلمة «سمك»؟', en: 'Which letter starts "sun"?' }, options: ['ر', 'س', 'د'], correct: 1 },
    { step: 3, q: { ar: 'ادمج: بـ + يت', en: 'Blend: b + at' }, options: ['🏠', '🚗'], correct: 0 },
    { step: 3, q: { ar: 'ادمج: قـ + ط', en: 'Blend: c + at' }, options: ['🐕', '🐈'], correct: 1 },
  ],
  'MEM.VISUAL_STM': [
    { step: 1, q: { ar: 'ظهر: 🟦 🔴 — ما الأول؟', en: 'Shown: 🟦 🔴 — which was first?' }, options: ['🟦', '🔴'], correct: 0 },
    { step: 1, q: { ar: 'ظهر: ⭐ 🟩 — ما الأول؟', en: 'Shown: ⭐ 🟩 — which was first?' }, options: ['🟩', '⭐'], correct: 1 },
    { step: 2, q: { ar: 'ظهر: 🔺 🟨 🟦 — ما الأخير؟', en: 'Shown: 🔺 🟨 🟦 — which was last?' }, options: ['🟦', '🔺', '🟨'], correct: 0 },
    { step: 2, q: { ar: 'ظهر: 🔴 ⭐ 🟩 — ما الأوسط؟', en: 'Shown: 🔴 ⭐ 🟩 — which was in the middle?' }, options: ['🔴', '⭐', '🟩'], correct: 1 },
    { step: 3, q: { ar: 'ظهر: 🟦 🟨 🔴 🟩 — ما الثاني؟', en: 'Shown: 🟦 🟨 🔴 🟩 — which was second?' }, options: ['🟦', '🟨', '🔴'], correct: 1 },
    { step: 3, q: { ar: 'ظهر: ⭐ 🔺 🟩 🟦 — ما الأخير؟', en: 'Shown: ⭐ 🔺 🟩 🟦 — which was last?' }, options: ['🟦', '⭐', '🔺'], correct: 0 },
  ],
  'MEM.VERBAL_STM': [
    { step: 1, q: { ar: 'سمعت: قطة، كرة — ما الأول؟', en: 'Heard: cat, ball — which was first?' }, options: ['🐈', '⚽'], correct: 0 },
    { step: 1, q: { ar: 'سمعت: شمس، بيت — ما الأخير؟', en: 'Heard: sun, house — which was last?' }, options: ['🏠', '☀️'], correct: 0 },
    { step: 2, q: { ar: 'سمعت: قطة، كرة، موزة — ما الأوسط؟', en: 'Heard: cat, ball, banana — the middle?' }, options: ['🐈', '⚽', '🍌'], correct: 1 },
    { step: 2, q: { ar: 'سمعت: شمس، طائر، تفاحة — ما الأخير؟', en: 'Heard: sun, bird, apple — the last?' }, options: ['🍎', '☀️', '🐦'], correct: 0 },
    { step: 3, q: { ar: 'سمعت: قطة، كرة، بيت، شمس — ما الثاني؟', en: 'Heard: cat, ball, house, sun — the second?' }, options: ['🐈', '⚽', '🏠'], correct: 1 },
    { step: 3, q: { ar: 'سمعت: طائر، سيارة، تفاحة، قمر — ما الأول؟', en: 'Heard: bird, car, apple, moon — the first?' }, options: ['🌙', '🐦', '🚗'], correct: 1 },
  ],
  'VSP.MATCHING': [
    { step: 1, q: { ar: 'اختر المطابق لـ 🟦', en: 'Choose the match for 🟦' }, options: ['🟦', '🔴'], correct: 0 },
    { step: 1, q: { ar: 'اختر المطابق لـ ⭐', en: 'Choose the match for ⭐' }, options: ['🔺', '⭐'], correct: 1 },
    { step: 2, q: { ar: 'اختر المختلف في اللون', en: 'Choose the different colour' }, options: ['🟦', '🟦', '🔴'], correct: 2 },
    { step: 2, q: { ar: 'اختر المختلف في الشكل', en: 'Choose the different shape' }, options: ['⭐', '🔺', '⭐'], correct: 1 },
    { step: 3, q: { ar: 'أكمل: 🔴 🟦 🔴 ؟', en: 'Complete: 🔴 🟦 🔴 ?' }, options: ['🟦', '🟨'], correct: 0 },
    { step: 3, q: { ar: 'أكمل: ⭐ 🔺 ⭐ ؟', en: 'Complete: ⭐ 🔺 ⭐ ?' }, options: ['🟩', '🔺'], correct: 1 },
  ],
  'VSP.PATTERN': [
    { step: 1, q: { ar: 'أكمل: 🟨 🟩 🟨 ؟', en: 'Complete: 🟨 🟩 🟨 ?' }, options: ['🟩', '🔴'], correct: 0 },
    { step: 2, q: { ar: 'أكمل: 🔺 🔴 🟦 🔺 🔴 ؟', en: 'Complete: 🔺 🔴 🟦 🔺 🔴 ?' }, options: ['🟨', '🟦'], correct: 1 },
    { step: 3, q: { ar: 'أكمل: ⭐ 🟩 🟨 ⭐ 🟩 ؟', en: 'Complete: ⭐ 🟩 🟨 ⭐ 🟩 ?' }, options: ['🟨', '🔴'], correct: 0 },
  ],
  'LANG.INSTRUCTION': [
    { step: 1, q: { ar: 'المس الكوب', en: 'Touch the cup' }, options: ['🥤', '📚'], correct: 0 },
    { step: 2, q: { ar: 'المس الكتاب ثم الكرة — ما الأول؟', en: 'Touch book then ball — which first?' }, options: ['⚽', '📚'], correct: 1 },
    { step: 3, q: { ar: 'المس الشكل الأزرق الصغير', en: 'Touch the small blue shape' }, options: ['🟦', '🔴', '🟨'], correct: 0 },
  ],
  'ATT.SUSTAINED': [
    { step: 1, q: { ar: 'اضغط على ⭐ (وليس غيرها)', en: 'Tap ⭐ (not the others)' }, options: ['⭐', '🔴'], correct: 0 },
    { step: 1, q: { ar: 'اضغط على ⭐', en: 'Tap ⭐' }, options: ['🟦', '⭐'], correct: 1 },
    { step: 1, q: { ar: 'اضغط على ⭐', en: 'Tap ⭐' }, options: ['⭐', '🟨'], correct: 0 },
    { step: 1, q: { ar: 'اضغط على ⭐', en: 'Tap ⭐' }, options: ['🟩', '⭐'], correct: 1 },
  ],
  'ATT.SELECTIVE': [
    { step: 1, q: { ar: 'اضغط على ☀️ فقط', en: 'Tap only ☀️' }, options: ['☀️', '🌙', '🟨'], correct: 0 },
    { step: 1, q: { ar: 'اضغط على ☀️ فقط', en: 'Tap only ☀️' }, options: ['🌙', '☀️', '🔴'], correct: 1 },
    { step: 1, q: { ar: 'اضغط على ☀️ فقط', en: 'Tap only ☀️' }, options: ['🟨', '🌙', '☀️'], correct: 2 },
    { step: 1, q: { ar: 'اضغط على ☀️ فقط', en: 'Tap only ☀️' }, options: ['☀️', '🟨', '🌙'], correct: 0 },
  ],
};

const ORDER = [
  'LANG.RECEP_VOCAB', 'MEM.VISUAL_STM', 'ATT.SUSTAINED', 'VSP.MATCHING',
  'LANG.INSTRUCTION', 'LANG.PHON_AWARE', 'MEM.VERBAL_STM', 'ATT.SELECTIVE', 'VSP.PATTERN',
];

export function IrisAssessmentScreen({ onDone }: { onDone: () => void }) {
  const { finishAssessment, accommodations, accommodationInfo, childName } = useIris();
  const { language } = useLanguage();
  const { speak, playSound, say } = useAudio();
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [startedAt, setStartedAt] = useState(Date.now());

  const flat = useMemo(
    () => ORDER.flatMap((sm) => (SCREEN_ITEMS[sm] || []).map((it) => ({ sm, ...it }))),
    []
  );
  const current = flat[idx];

  useEffect(() => {
    if (started && current) {
      speak(language === 'ar' ? current.q.ar : current.q.en, language);
      setStartedAt(Date.now());
    }
  }, [started, idx]);

  // The companion is addressed by moment. This changes the FACE only —
  // the scored row below is untouched.
  const [moment, setMoment] = useState<CompanionMoment>('listening');
  // Small "+1 star" that pops after a correct answer (visual half of the cue).
  const [starPop, setStarPop] = useState(false);

  const answer = (choice: number) => {
    if (picked !== null || !current) return;
    setPicked(choice);
    const correct = choice === current.correct;
    // Both branches are warm. The "not this one" branch uses the same gentle
    // two-tone cue as everywhere else — never a buzzer, never a downward
    // "wrong" cadence (see AudioContext TONES and doc 30 H15 on sudden audio).
    playSound(correct ? 'success' : 'retry');
    setMoment(correct ? 'success' : 'tryAgain');
    // Spoken feedback comes from the shared phrase library so the register is
    // identical across every screen, and is mirrored to the on-screen caption.
    say(correct ? 'correct' : 'retry', language === 'ar' ? 'ar' : 'en');
    if (correct) { setStarPop(true); setTimeout(() => setStarPop(false), 900); }

    const row = {
      difficulty_step: current.step,
      is_correct: correct,
      response_time_ms: Date.now() - startedAt,
      hints_used: 0,
      timed_out: false,
      response_type: 'ITEM',
      tapped: true,
      seconds_on_task: 60,
    };

    setResults((prev) => ({ ...prev, [current.sm]: [...(prev[current.sm] || []), row] }));

    setTimeout(() => {
      setPicked(null);
      setMoment('listening');
      if (idx < flat.length - 1) setIdx(idx + 1);
      else {
        const finalResults = { ...results, [current.sm]: [...(results[current.sm] || []), row] };
        finishAssessment(finalResults);
        onDone();
      }
    }, 700);
  };

  if (!started) {
    return (
      <div className="iris-child min-h-screen flex items-center justify-center p-6 bg-ground">
        <div className="max-w-2xl text-center space-y-6">
          <IrisCompanion moment="beforeActivity" size="md" className="mx-auto" />
          <h1 className="t-title text-ink">
            {language === 'ar' ? 'هيا نلعب ونتعلّم! 🌟' : "Let's Play & Learn! 🌟"}
          </h1>
          <p className="text-lg text-ink-muted">
            {language === 'ar'
              ? `سنلعب مع ${childName || 'طفلك'} بعض الأنشطة القصيرة لنعرف من أين نبدأ. لا توجد إجابات "سيئة".`
              : `We'll play a few short activities with ${childName || 'your child'} to find a good starting point. There are no "bad" answers.`}
          </p>

          <div className="rounded-brand bg-surface border border-hairline p-5 text-start text-sm text-ink-muted space-y-2">
            <p className="font-semibold text-ink">
              {language === 'ar' ? 'ما هذا وما ليس هو' : 'What this is, and is not'}
            </p>
            <p>
              {language === 'ar'
                ? 'هذا فحص تعليمي أوّلي لاختيار مستوى التدريب المناسب. ليس اختبار ذكاء، ولا يعطي درجة معيارية، ولا يشخّص.'
                : 'This is an educational screening used to choose a practice level. It is not an intelligence test, gives no standard score, and does not diagnose.'}
            </p>
            <p className="text-ink-muted">
              {language === 'ar'
                ? `التسهيلات المفعّلة (تؤثر على الوقت والعرض فقط، لا على الدرجة): ${accommodations.join('، ') || 'لا يوجد'}`
                : `Accommodations enabled (affect timing and presentation only, never the score): ${accommodations.join(', ') || 'none'}`}
            </p>
            <p className="text-xs text-ink-muted">{accommodationInfo.source}</p>
          </div>

          <Button size="lg" className="text-xl px-10 py-7 rounded-full" onClick={() => setStarted(true)}>
            {language === 'ar' ? 'هيا نبدأ 🌟' : "Let's start 🌟"}
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const ar = language === 'ar';
  const promptText = ar ? current.q.ar : current.q.en;

  return (
    <div className="iris-child min-h-screen p-6 bg-ground">
      <div className="max-w-3xl mx-auto pt-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <ChildProgressDots total={flat.length} currentIndex={idx} language={ar ? 'ar' : 'en'} />
          {/* repeatText re-speaks the CURRENT prompt, which is the access
              control doc 05 §5 calls for (audio adjustable and repeatable). */}
          <AudioControl language={ar ? 'ar' : 'en'} repeatText={promptText} />
        </div>

        <IrisCompanion moment={moment} size="sm" showLine={false} className="mx-auto mb-2" />

        <motion.div
          key={idx}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
          className="relative bg-surface rounded-brand-lg shadow-brand p-8 space-y-8"
        >
          <StarPop visible={starPop} language={ar ? 'ar' : 'en'} />
          {/* The prompt stays on screen for the whole item. Doc 30 H12 is
              explicit that a visual reference should remain persistently
              visible rather than requiring the child to hold it in memory. */}
          <h2 className="text-3xl font-bold text-center text-ink">{promptText}</h2>

          <div
            role="group"
            aria-label={promptText}
            className={`grid gap-5 ${current.options.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            {current.options.map((opt, i) => {
              const isPicked = picked === i;
              const isRight = i === current.correct;
              return (
                <motion.button
                  key={i}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => answer(i)}
                  disabled={picked !== null}
                  style={{ minHeight: 96 }}
                  aria-label={ar ? `الاختيار ${i + 1}` : `Choice ${i + 1}`}
                  className={`relative aspect-square rounded-brand border-4 text-7xl flex items-center justify-center transition-colors
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
                    ${
                      isPicked
                        ? isRight
                          ? 'border-brand-green bg-brand-green-wash'
                          : 'border-brand-yellow bg-brand-yellow-wash'
                        : 'border-hairline bg-surface hover:border-brand-blue'
                    }`}
                >
                  {opt}
                  {/* A glyph, not just a border colour. WCAG 1.4.1: state must
                      never be conveyed by colour alone. */}
                  {isPicked && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 end-1.5 text-2xl leading-none"
                    >
                      {isRight ? '✅' : '🔁'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {picked !== null && (
            <p className="text-center text-xl font-semibold text-ink-muted" role="status">
              {picked === current.correct
                ? ar
                  ? 'أحسنت! 🌟'
                  : 'Well done! 🌟'
                : ar
                  ? 'لا بأس، نكمل مع بعض 💪'
                  : "That's ok, let's keep going 💪"}
            </p>
          )}
        </motion.div>

        {/* Visual equivalent of anything spoken (doc 30 H15). */}
        <NarrationCaption language={ar ? 'ar' : 'en'} className="mt-4" />
      </div>
    </div>
  );
}
