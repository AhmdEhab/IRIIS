import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

/**
 * Between-stage feedback — a short structured note from the parent.
 *
 * WHAT IT IS FOR
 * Pilot signal. A parent watching the session sees things the engine cannot:
 * whether the child enjoyed it, needed help, or drifted off. Capturing that in
 * a fixed set of options makes it reviewable later.
 *
 * WHAT IT IS EXPLICITLY NOT
 * It is NOT a checkpoint test, NOT a score, and it does NOT feed the adaptive
 * engine. Nothing selected here changes a level, goal, pathway, difficulty, or
 * the next activity — the engine continues to decide from the child's own
 * measured performance alone. This boundary is deliberate on two grounds:
 *   - the product's core rule is that adaptation follows performance;
 *   - the project's evidence review records no validated method for turning a
 *     caregiver impression into an instructional decision, and inventing a
 *     threshold ("2 x 'too hard' → drop a level") would be exactly the kind of
 *     unsupported rule 29_RESEARCH_GAPS_REGISTER.md §G warns against.
 *
 * Responses are held in component state and handed to `onSubmit`. The caller
 * decides where they go; today that is a local log for the pilot, not the
 * engine.
 */

export interface StageFeedbackValue {
  difficulty?: 'too_easy' | 'just_right' | 'too_hard';
  observations: string[];
  at: string;
}

export function StageFeedback({
  onSubmit,
  onSkip,
}: {
  onSubmit: (value: StageFeedbackValue) => void;
  onSkip: () => void;
}) {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [difficulty, setDifficulty] = useState<StageFeedbackValue['difficulty']>();
  const [observations, setObservations] = useState<string[]>([]);

  const DIFFICULTY = [
    { id: 'too_easy' as const, icon: '🙂', ar: 'كان سهل عليه', en: 'Too easy' },
    { id: 'just_right' as const, icon: '👌', ar: 'مناسب', en: 'Just right' },
    { id: 'too_hard' as const, icon: '😕', ar: 'كان صعب عليه', en: 'Too difficult' },
  ];

  const OBSERVATIONS = [
    { id: 'enjoyed', icon: '😄', ar: 'استمتع بالنشاط', en: 'Child enjoyed it' },
    { id: 'needed_help', icon: '🤝', ar: 'احتاج مساعدة', en: 'Child needed help' },
    { id: 'lost_attention', icon: '🌫️', ar: 'سرح أو فقد التركيز', en: 'Child lost attention' },
  ];

  const toggleObservation = (id: string) =>
    setObservations((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));

  const chip = (selected: boolean) =>
    `flex items-center gap-2 rounded-brand border-2 px-4 py-3 font-bold transition-colors
     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue ${
       selected
         ? 'border-brand-purple bg-brand-purple-wash text-brand-purple-ink'
         : 'border-hairline bg-surface text-ink-muted hover:border-hairline'
     }`;

  return (
    <div className="rounded-brand-lg bg-surface border border-hairline p-6 space-y-5">
      <div>
        <h3 className="text-lg font-black text-ink">
          {ar ? 'قبل ما نكمّل — النشاط كان عامل إزاي؟' : 'Before moving on — how did that feel?'}
        </h3>
        <p className="text-sm text-ink-muted mt-1">
          {ar ? 'اختياري، وبيساعدنا نفهم تجربتكم.' : 'Optional, and it helps us understand your experience.'}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-ink-muted mb-2">
          {ar ? 'مستوى الصعوبة' : 'Difficulty'}
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={difficulty === d.id}
              onClick={() => setDifficulty(difficulty === d.id ? undefined : d.id)}
              className={chip(difficulty === d.id)}
            >
              <span aria-hidden="true">{d.icon}</span>
              {ar ? d.ar : d.en}
              {difficulty === d.id && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-ink-muted mb-2">
          {ar ? 'أي حاجة لاحظتيها؟' : 'Anything you noticed?'}
        </legend>
        <div className="flex flex-wrap gap-2">
          {OBSERVATIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={observations.includes(o.id)}
              onClick={() => toggleObservation(o.id)}
              className={chip(observations.includes(o.id))}
            >
              <span aria-hidden="true">{o.icon}</span>
              {ar ? o.ar : o.en}
              {observations.includes(o.id) && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSubmit({ difficulty, observations, at: new Date().toISOString() })}
          disabled={!difficulty && observations.length === 0}
          className="rounded-brand bg-brand-blue-ink text-white px-6 py-3 font-black disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
        >
          {ar ? 'إرسال' : 'Send'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-brand bg-surface border-2 border-hairline px-6 py-3 font-bold text-ink-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
        >
          {ar ? 'تخطّي' : 'Skip'}
        </button>
      </div>

      <p className="text-xs text-ink-muted border-t border-hairline pt-3">
        {ar
          ? 'ملاحظاتك بتتسجّل كملاحظات للأهل — مش بتغيّر مستوى الطفل ولا مساره. مسار التعلّم بيتحدد من أداء الطفل نفسه.'
          : "Your notes are recorded as parent feedback — they do not change your child's level or pathway. The learning path is decided by your child's own performance."}
      </p>
    </div>
  );
}
