/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  DISABLED — THIS SCREEN COMPUTED A FABRICATED IQ SCORE                 ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS SCREEN USED TO DO, AND WHY IT IS DISABLED
 * ---------------------------------------------------
 * 1. It selected which questions the child was asked BY DIAGNOSIS. A child
 *    coded `down-syndrome` received 1 auditory item in 10; a child coded
 *    `williams` received 7. The instrument therefore could not discover a
 *    profile that contradicted the diagnosis — it measured the assumption.
 *
 * 2. It computed an IQ-shaped score AND ADDED POINTS FOR THE DIAGNOSIS:
 *
 *        let baseLevel = 45;
 *        if (condition === 'down-syndrome') baseLevel = 48;  // "visual learner bonus"
 *        if (condition === 'williams')      baseLevel = 46;
 *        ...
 *        iqScore = baseLevel + accuracy * 55
 *
 *    Two children answering identically received different scores because of
 *    their diagnosis. This violates the project's first non-negotiable rule
 *    (no fake IQ tests), doc 10 §6 (IRIS produces no IQ-like construct), and
 *    doc 11 §8.4 ("No condition-based score adjustment, ever").
 *
 * REPLACED BY
 * -----------
 *   src/App/components/iris/IrisAssessmentScreen.tsx  — the same nine tasks
 *   for every child, scored by src/iris/engines/assessment.js (doc 11), which
 *   has no `condition` parameter and produces a DPS, never an IQ.
 *
 * The file is kept as a stub so existing imports in App.tsx still resolve.
 */
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';

export function AIAssessmentScreen() {
  const { language } = useLanguage();
  const { navigateTo } = useApp();
  const ar = language === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-sunk">
      <div className="max-w-xl bg-surface rounded-brand-lg border border-brand-yellow p-8 space-y-4 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold text-ink">
 {ar ? 'هذه الشاشة معطّلة' : 'This screen is disabled'}
 </h1>
        <p className="text-ink">
          {ar
            ? 'كانت هذه الشاشة تحسب درجة تشبه اختبار الذكاء، وتضيف نقاطًا بناءً على تشخيص الطفل، وتختار الأسئلة حسب التشخيص. تم تعطيلها لأنها تخالف القاعدة الأساسية للمشروع.'
            : 'This screen computed an IQ-like score, added points based on the child\'s diagnosis, and selected questions by diagnosis. It has been disabled because it violates the project\'s core rule.'}
        </p>
        <p className="text-sm text-ink-muted">
          {ar
            ? 'البديل: «أنشطة التعرّف» في تدفّق IRIS الجديد — نفس الأنشطة لكل طفل، وبدون أي درجة ذكاء.'
            : 'Replacement: the getting-to-know activities in the new IRIS flow — the same activities for every child, with no intelligence score.'}
        </p>
        <Button onClick={() => navigateTo('mode-selection')}>
          {ar ? 'رجوع' : 'Back'}
        </Button>
      </div>
    </div>
  );
}
