/**
 * IRIS Activity Screen — plays one generated ActivityInstance (doc 15).
 *
 * The activity is produced by the content engine from a constraint set handed
 * down by the pathway engine. This screen renders it and reports raw item
 * results back. It makes no pedagogical decision of its own.
 */
import React, { useEffect, useState } from 'react';
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

export function IrisActivityScreen({ onSessionDone }: { onSessionDone: (r: any) => void }) {
  const { currentActivity, loadNextActivity, submitSession, activeAssignment, GOAL_BY_ID } = useIris();
  const { language } = useLanguage();
  const { speak, playSound, say } = useAudio();
  const reduceMotion = useReducedMotion();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [sessionStart] = useState(Date.now());
  // The companion is addressed by moment; the face and words come from
  // companionLines, so its personality stays identical across screens.
  const [moment, setMoment] = useState<CompanionMoment>('beforeActivity');
  // Small "+1 star" that pops after a correct answer (visual half of the cue).
  const [starPop, setStarPop] = useState(false);

  useEffect(() => { if (!currentActivity) loadNextActivity(); }, [currentActivity]);

  const item = currentActivity?.items?.[idx];

  useEffect(() => {
    if (item) {
      speak(language === 'ar' ? item.prompt?.ar : item.prompt?.en, language);
      setStartedAt(Date.now());
      setHintShown(false);
    }
  }, [idx, currentActivity]);

  if (!currentActivity) {
    return <div className="min-h-screen flex items-center justify-center text-4xl">⏳</div>;
  }

  if (!currentActivity.validator_passed) {
    // Doc 31 I14: a failure state describes the SESSION, never the child. The
    // child sees a warm, blameless message; the raw validator output is real
    // and still available, but collapsed and labelled for a parent/developer
    // rather than dumped on a child's screen as it previously was.
    return (
      <div className="iris-child min-h-screen flex items-center justify-center p-8">
        <div className="max-w-lg text-center space-y-4">
          <div className="text-6xl" aria-hidden="true">🧩</div>
          <p className="text-xl font-semibold text-ink">
            {language === 'ar'
              ? 'مش قادرين نجهّز اللعبة دي دلوقتي — يلا نجرب واحدة تانية!'
              : "We couldn't set this one up just now — let's try a different activity!"}
          </p>
          <details className="text-start bg-ground-tint border border-hairline rounded-brand-sm p-3">
            <summary className="cursor-pointer text-sm font-medium text-ink-muted">
              {language === 'ar' ? 'تفاصيل تقنية (للوالدين)' : 'Technical details (for parents)'}
            </summary>
            <pre className="mt-2 text-xs bg-surface p-3 rounded overflow-auto">
              {JSON.stringify(currentActivity.validator_failures, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  const goal = GOAL_BY_ID[currentActivity.goal_id];
  const total = currentActivity.items.length;

  const finishSession = (allRows: any[]) => {
    const r = submitSession(allRows, 'COMPLETE');
    onSessionDone(r);
  };

  const answer = (choice: number) => {
    if (picked !== null || !item) return;
    setPicked(choice);
    const correct = choice === item.correct_index;
    // Gentle two-tone cue on a miss — never a buzzer (see AudioContext TONES).
    playSound(correct ? 'success' : 'retry');
    // A wrong answer gets 'tryAgain' — warm, and offers another route in.
    // There is deliberately no state that looks disappointed in the child.
    setMoment(correct ? 'success' : 'tryAgain');
    // Shared phrase library keeps the spoken register identical everywhere and
    // mirrors the line to the on-screen caption.
    say(correct ? 'correct' : 'retry', language === 'ar' ? 'ar' : 'en');
    if (correct) { setStarPop(true); setTimeout(() => setStarPop(false), 900); }

    const row = {
      item_id: item.item_id,
      is_correct: correct,
      hints_used: hintShown ? 1 : 0,
      response_time_ms: Date.now() - startedAt,
      timed_out: false,
      tapped: true,
    };
    const next = [...rows, row];
    setRows(next);

    setTimeout(() => {
      setPicked(null);
      setMoment('beforeActivity');
      if (idx < total - 1) setIdx(idx + 1);
      else finishSession(next);
    }, 800);
  };

  // Sequence-type items are demonstrated as an ordered recall of the first element.
  const options: any[] = item?.options ?? [];
  const correctIndex = item?.correct_index ?? (item?.correct_sequence ? item.correct_sequence[0] : 0);

  const label = (o: any) => (typeof o === 'string' ? o : (language === 'ar' ? o.ar : o.en));

  const ar = language === 'ar';
  const promptText = (ar ? item?.prompt?.ar : item?.prompt?.en) || '';

  return (
    <div className="iris-child min-h-screen p-6 bg-ground">
      <div className="max-w-3xl mx-auto pt-4">
        {/* Friendly context strip — plain-language goal name only, no engine terms. */}
        <div className="rounded-brand bg-surface/80 border border-hairline p-3 mb-4 text-sm flex items-center justify-between gap-2">
          <span className="font-semibold text-ink">
            {ar ? goal?.nameAr : goal?.nameEn} — {ar ? 'المستوى' : 'Level'} {currentActivity.level}
          </span>
          <AudioControl language={ar ? 'ar' : 'en'} repeatText={promptText} />
        </div>

        <div className="mb-3"><ChildProgressDots total={total} currentIndex={idx} language={ar ? 'ar' : 'en'} /></div>
        <IrisCompanion moment={moment} size="sm" className="mx-auto mb-2" />

        <motion.div
          key={idx}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
          className="relative bg-surface rounded-brand-lg shadow-brand p-8 space-y-8"
        >
          <StarPop visible={starPop} language={ar ? 'ar' : 'en'} />
          {/* Prompt stays visible for the whole item — doc 30 H12 (keep the
              visual reference on screen instead of requiring recall). */}
          <h2 className="text-3xl font-bold text-center text-ink">{promptText}</h2>

          {item?.sequence && (
            <div className="text-center text-5xl tracking-widest">{item.sequence.join(' ')}</div>
          )}
          {item?.pattern && (
            <div className="text-center text-4xl tracking-widest">{item.pattern.join(' ')} ❓</div>
          )}

          <div
            role="group"
            aria-label={promptText}
            className={`grid gap-5 ${options.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            {options.map((opt, i) => {
              const isPicked = picked === i;
              const isRight = i === correctIndex;
              return (
                <motion.button
                  key={i}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => answer(i)}
                  disabled={picked !== null}
                  style={{ minHeight: 96 }}
                  aria-label={typeof opt === 'string' ? label(opt) : (ar ? `الاختيار ${i + 1}` : `Choice ${i + 1}`)}
                  className={`relative aspect-square rounded-brand border-4 flex items-center justify-center transition-colors
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green
                    ${typeof opt === 'string' && opt.length <= 2 ? 'text-7xl' : 'text-3xl font-bold'}
                    ${
                      isPicked
                        ? isRight
                          ? 'border-brand-green bg-brand-green-wash'
                          : 'border-brand-yellow bg-brand-yellow-wash'
                        : 'border-hairline bg-surface hover:border-brand-green'
                    }`}
                >
                  {label(opt)}
                  {/* Glyph as well as colour — WCAG 1.4.1. */}
                  {isPicked && (
                    <span aria-hidden="true" className="absolute top-1.5 end-1.5 text-2xl leading-none">
                      {isRight ? '✅' : '🔁'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setHintShown(true); speak(language === 'ar' ? item?.hint?.ar : item?.hint?.en, language); }} disabled={hintShown || picked !== null}>
              {language === 'ar' ? '💡 تلميح' : '💡 Hint'}
            </Button>
            {hintShown && (
              <p className="text-sm text-ink-muted">
                {language === 'ar' ? item?.hint?.ar : item?.hint?.en}
              </p>
            )}
          </div>

          {picked !== null && (
            <p className="text-center text-xl font-semibold text-ink-muted" role="status">
              {picked === correctIndex
                ? ar
                  ? 'ممتاز! 🌟'
                  : 'Excellent! 🌟'
                : ar
                  ? 'لا بأس، نجرّب اللي بعده 💪'
                  : "That's ok, let's try the next one 💪"}
            </p>
          )}
        </motion.div>

        {/* Visual equivalent of anything spoken (doc 30 H15). */}
        <NarrationCaption language={ar ? 'ar' : 'en'} className="mt-4" />

        <p className="text-center text-xs text-ink-muted mt-4">
          {ar
            ? 'محتوى أوّلي مبني على إطار الأدلة — لم تتم مراجعته من مختص بعد.'
            : 'Research-informed prototype content — not yet specialist-reviewed.'}
        </p>
      </div>
    </div>
  );
}
