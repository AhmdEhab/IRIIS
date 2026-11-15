/* ── IRIS — the "getting to know you" result ────────────────────────────────
   Shown the moment the intro work is done. It is deliberately NOT a report
   card: what each skill looks like right now, in plain words, where that
   reading came from (the screen, and separately the family's own words),
   what we already like, and what we will work on next. No number, no
   verdict, no clinical vocabulary anywhere in the chrome.

   Data comes from ONE place — `buildGettingToKnowResult` in
   src/iris/journey/results.js — which is pure and deterministic. This screen
   renders whatever it returns and degrades to a caregiver-only note when the
   child session was not completed. Styling lives in plan-family.css under the
   `IrisResultsScreen` block and follows the same landing/child-mode
   language as the First Plan (cream ground, white rounded cards, brand washes).
   --------------------------------------------------------------------------- */
import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../contexts/AppContext';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { IrisBuddy } from './ui/IrisBuddy';
/* §contract: the result builder (sibling agent owns this module). */
import { buildGettingToKnowResult } from '../../../iris/journey/results.js';
import './plan-family.css';

export interface IrisResultsScreenProps {
  /** Absent → the screen navigates to `ladder-plan` through AppContext itself. */
  onContinue?: () => void;
}

/* One chip colour per state. The brand ramp is WARM, so the neutral state
   reads as warm sand rather than the cool slate the brief named — same
   meaning, brand-correct. */
const STATE_CLASS: Record<string, string> = {
  solo: 'irs-chip--solo',
  help: 'irs-chip--help',
  emerging: 'irs-chip--emerging',
  more_info: 'irs-chip--more_info',
};

/* The builder ships plain strings for the active language, but a {ar,en}
   pair is tolerated here so a small change in results.js cannot blank the
   screen. Presentation default, never invented content. */
const loc = (v: any, ar: boolean): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return String((ar ? v.ar ?? v.en : v.en ?? v.ar) ?? '');
  return '';
};

export function IrisResultsScreen({ onContinue }: IrisResultsScreenProps) {
  const { childProfile, caregiver, navigateTo } = useApp();
  const iris = useIris();
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  const name = childProfile?.name || (ar ? 'طفلك' : 'your child');

  /* Mirrors the First Plan convention (IrisFirstPlan.tsx): the scored half of
     the Family Profile is what the engines read. */
  const result = React.useMemo(() => {
    try {
      if (typeof buildGettingToKnowResult !== 'function') return null;
      return buildGettingToKnowResult({
        ladderResult: (iris.ladder as any) ?? null,
        caregiverProfile: caregiver?.scored ?? null,
        childName: childProfile?.name ?? null,
        lang: language,
      });
    } catch {
      /* An absent or failing builder is a fact to show, not a crash: the
         family still gets the reassurance note and the way forward. */
      return null;
    }
  }, [iris.ladder, caregiver?.scored, childProfile?.name, language]);

  const goPlan = () => {
    if (onContinue) onContinue();
    else navigateTo('ladder-plan');
  };

  /* A missing result is the degenerate case: honest card, one way out. */
  if (!result) {
    return (
      <div className="fp-root" dir={ar ? 'rtl' : 'ltr'}>
        <div className="fp-wrap">
          <div className="fp-card fp-empty irs-empty">
            <p className="fp-sub">
              {ar
                ? 'مقدرناش نجهّز الصورة دي دلوقتي — جرّب تاني بعد لحظات، أو ابدأ من الخطة على طول.'
                : 'We could not put this picture together just now — try again in a moment, or go straight to the plan.'}
            </p>
            <button type="button" className="fp-cta irs-cta" onClick={goPlan}>
              {ar ? 'يلا نشوف الخطة' : 'See the first plan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const skills: any[] = Array.isArray(result.skills) ? result.skills : [];
  const strengths: any[] = Array.isArray(result.strengths) ? result.strengths : [];
  const nextSteps: string[] = Array.isArray(result.nextSteps) ? result.nextSteps : [];
  /* Caregiver strengths are {ar,en} rows; the builder's are strings. One
     renderer for both. */
  const caregiverStrengths: any[] = (caregiver?.scored?.strengths as any[]) || [];
  const headline = loc(result.headline, ar);
  const honestLine = loc(result.honestLine, ar);

  return (
    <div className="fp-root" dir={ar ? 'rtl' : 'ltr'}>
      <div className="fp-wrap">
        {/* ── Header plate: the headline plus the calm reassurance note ── */}
        <motion.header
          className="irs-plate"
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="irs-plate-text">
            <p className="fp-kicker">{ar ? `أول صورة لـ ${name}` : `First picture of ${name}`}</p>
            <h1 className="irs-headline" dir={ar ? 'rtl' : 'ltr'}>{headline}</h1>
            {honestLine && (
              <p className="irs-honest" dir={ar ? 'rtl' : 'ltr'}>
                <span className="irs-honest-mark" aria-hidden="true">◈</span>
                {honestLine}
              </p>
            )}
          </div>
          <div className="fp-hero-buddy" aria-hidden="true"><IrisBuddy mood="happy" /></div>
        </motion.header>

        {result.hasChildEvidence === false ? (
          /* ── Caregiver-only variant: the session did not finish. Say so
             plainly, show the family's own words, invent nothing. ── */
          <motion.section
            className="fp-card fp-wash-blue irs-note-card"
            dir={ar ? 'rtl' : 'ltr'}
            aria-labelledby="irs-note-title"
            initial={reduceMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="fp-h2" id="irs-note-title">
              {ar ? 'قعدنا نلعب شوية وماكملناش الجلسة — دي خلاصة كلامك إنت' : 'We played for a little while and did not finish the session — this is what you told us'}
            </h2>
            {strengths.length > 0 && (
              <>
                <h3 className="fp-h3">{ar ? 'نقاط قوة شفناها' : 'Strengths we saw'}</h3>
                <ul className="irs-strengths">
                  {strengths.map((s, i) => (
                    <li key={`rs${i}`} className="irs-strength">
                      <span className="fp-tick" aria-hidden="true">✓</span>{loc(s, ar)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!strengths.length && caregiverStrengths.length > 0 && (
              <>
                <h3 className="fp-h3">{ar ? 'نقاط قوة شفناها' : 'Strengths we saw'}</h3>
                <ul className="irs-strengths">
                  {caregiverStrengths.slice(0, 8).map((s: any, i: number) => (
                    <li key={`cs${i}`} className="irs-strength">
                      <span className="fp-tick" aria-hidden="true">✓</span>{loc(s, ar)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {nextSteps.length > 0 && (
              <ol className="irs-steps">
                {nextSteps.map((s, i) => (
                  <li key={`rn${i}`} className="irs-step">
                    <span className="irs-step-num" aria-hidden="true">{i + 1}</span>
                    <span dir={ar ? 'rtl' : 'ltr'}>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </motion.section>
        ) : (
          <>
            {/* ── Skills: one calm card each, arriving in a gentle stagger ── */}
            <section className="irs-skills" aria-labelledby="irs-skills-title" dir={ar ? 'rtl' : 'ltr'}>
              <h2 className="fp-h2" id="irs-skills-title">{ar ? 'اللي شفناه لحد دلوقتي' : 'What we have seen so far'}</h2>
              {/* An empty list is a fact the family should see, not a blank gap. */}
              {skills.length === 0 && (
                <p className="fp-soft" dir={ar ? 'rtl' : 'ltr'}>
                  {ar
                    ? 'لسه مفيش حاجة مسجّلة هنا — أول ما نكمّل اللعب هتظهر المهارات واحدة واحدة.'
                    : 'Nothing recorded here yet — as soon as we keep playing, skills will appear one by one.'}
                </p>
              )}
              {skills.map((s: any, i: number) => {
                const skillName = loc(ar ? (s?.nameAr || s?.nameEn) : (s?.nameEn || s?.nameAr), ar);
                const chip = loc(ar ? s?.stateAr : s?.stateEn, ar);
                const ev = loc(ar ? s?.evidenceLineAr : s?.evidenceLineEn, ar);
                const fromParent = loc(ar ? s?.fromParentLineAr : s?.fromParentLineEn, ar);
                return (
                  <motion.article
                    key={s?.key || `skill${i}`}
                    className="fp-card irs-skill"
                    aria-labelledby={`irs-skill-${s?.key || i}`}
                    initial={reduceMotion ? false : { y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.35, delay: Math.min(i * 0.06, 0.6) }}
                  >
                    <div className="irs-skill-head">
                      <h3 className="irs-skill-name" id={`irs-skill-${s?.key || i}`}>{skillName}</h3>
                      {chip && (
                        <span
                          className={`irs-chip ${STATE_CLASS[s?.state] || 'irs-chip--more_info'}`}
                          role="img"
                          aria-label={ar ? `${skillName}: ${chip}` : `${skillName}: ${chip}`}
                        >
                          {chip}
                        </span>
                      )}
                    </div>
                    {ev && <p className="irs-evidence" dir={ar ? 'rtl' : 'ltr'}>{ev}</p>}
                    {fromParent && (
                      <p className="irs-from-parent" dir={ar ? 'rtl' : 'ltr'}>
                        <span className="irs-from-parent-label">
                          {ar ? 'من كلامك في البيت' : 'From what you told us at home'}
                        </span>
                        {fromParent}
                      </p>
                    )}
                  </motion.article>
                );
              })}
            </section>

            {/* ── Strengths first, always: chips with a tick, not a score ── */}
            {(strengths.length > 0 || caregiverStrengths.length > 0) && (
              <motion.section
                className="fp-card fp-wash-yellow"
                dir={ar ? 'rtl' : 'ltr'}
                aria-labelledby="irs-str-title"
                initial={reduceMotion ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.35, delay: 0.1 }}
              >
                <h2 className="fp-h2" id="irs-str-title">{ar ? 'نقاط قوة شفناها' : 'Strengths we saw'}</h2>
                <ul className="irs-strengths">
                  {(strengths.length ? strengths : caregiverStrengths.slice(0, 8))
                    .map((s: any, i: number) => (
                      <li key={`s${i}`} className="irs-strength">
                        <span className="fp-tick" aria-hidden="true">✓</span>{loc(s, ar)}
                      </li>
                    ))}
                </ul>
              </motion.section>
            )}

            {/* ── What we work on next: a gentle numbered list ── */}
            {nextSteps.length > 0 && (
              <motion.section
                className="fp-card fp-wash-blue"
                dir={ar ? 'rtl' : 'ltr'}
                aria-labelledby="irs-next-title"
                initial={reduceMotion ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.35, delay: 0.15 }}
              >
                <h2 className="fp-h2" id="irs-next-title">{ar ? 'اللي هنشتغل عليه' : 'What we will work on'}</h2>
                <ol className="irs-steps">
                  {nextSteps.map((s, i) => (
                    <li key={`n${i}`} className="irs-step">
                      <span className="irs-step-num" aria-hidden="true">{i + 1}</span>
                      <span dir={ar ? 'rtl' : 'ltr'}>{loc(s, ar)}</span>
                    </li>
                  ))}
                </ol>
              </motion.section>
            )}
          </>
        )}

        {/* ── Footer: the honest prototype note, then the way forward ── */}
        <footer className="fp-foot">
          <p className="fp-badge" dir={ar ? 'rtl' : 'ltr'}>
            {ar
              ? 'IRIS نموذج أولي مبني على أبحاث — الصورة دي أولية وبتتغيّر كل ما بنعرف أكتر. المختص اللي معاكم هو اللي بيفسّر ويقرّر.'
              : 'IRIS is a research-based prototype — this is an early picture that changes as we learn more. Your specialist is the one who interprets and decides.'}
          </p>
          <div className="irs-actions">
            {caregiver?.responses && Object.keys(caregiver.responses).length > 0 && (
              <button
                type="button"
                className="irs-edit"
                onClick={() => navigateTo('caregiver-profile')}
              >
                {ar ? 'تعديل إجاباتك' : 'Edit your answers'}
              </button>
            )}
            <button type="button" className="fp-cta irs-cta" onClick={goPlan}>
              {ar ? 'يلا نشوف الخطة' : 'See the first plan'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default IrisResultsScreen;
