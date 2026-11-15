/* ── IRIS First Plan (research framework §4/§5) ─────────────────────────────
   The screen a family lands on the moment BOTH assessments are done. It is
   deliberately a PLAN, not a report card: strengths first, three priorities
   balanced across the two tracks (Family Profile + learning ladder), a week
   you can actually run, and the honest note that this is a first draft that
   changes as the child does.

   Styling lives in plan-family.css and follows the landing/child-mode
   language (cream background, rounded white cards, brand washes).
   --------------------------------------------------------------------------- */
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { IrisBuddy } from '../iris/ui/IrisBuddy';
import { buildFamilyLearningProfile } from '../../../iris/caregiver/merge.js';
import './plan-family.css';

export interface IrisFirstPlanProps {
  caregiver: { responses: Record<string, any>; scored: Record<string, any> } | null;
  onContinue: () => void;
  onOpenFamily: () => void;
}

const TRACK_AR: Record<string, string> = { functional: 'من حياتكم اليومية', learning: 'من تسلّم التعلّم' };
const TRACK_EN: Record<string, string> = { functional: 'from daily life', learning: 'from the learning ladder' };

export function IrisFirstPlan({ caregiver, onContinue, onOpenFamily }: IrisFirstPlanProps) {
  const { childProfile } = useApp();
  const iris = useIris();
  const { language } = useLanguage();
  const ar = language === 'ar';

  /* The merge is pure and deterministic; if anything inside the engines is
     missing (first-run, offline) we degrade to a single-track view instead of
     crashing — an absent track is a fact the family should see, not a bug. */
  const merged = React.useMemo(() => {
    try {
      return buildFamilyLearningProfile({
        caregiver: caregiver?.scored ?? null,
        ladderSnapshot: (iris.ladder as any) ?? null,
        child: { name: childProfile?.name ?? null, ageMonths: (childProfile?.age ?? 7) * 12 },
      });
    } catch {
      return null;
    }
  }, [caregiver, iris.ladder, childProfile?.name, childProfile?.age]);

  const name = childProfile?.name || (ar ? 'طفلك' : 'your child');

  if (!merged) {
    return (
      <div className="fp-root">
        <div className="fp-card fp-empty">
          <p>{ar ? 'مقدرناش نجهّز الخطة دلوقتي — جرّب تاني بعد لحظات.' : 'We could not build the plan just now — try again in a moment.'}</p>
          <button className="fp-cta" onClick={onOpenFamily}>{ar ? 'افتح ملف العائلة' : 'Open the Family Profile'}</button>
        </div>
      </div>
    );
  }

  const plan = merged.planSeed || {};
  const priorities: any[] = merged.priorities || [];
  const strengths: any[] = merged.functional?.strengths || merged.caregiverSummary?.strengths || [];
  const interests: string[] = ((caregiver?.scored?.interests as any[]) || (merged.functional?.interests as any[]) || []).slice(0, 6);
  const activities: any[] = plan.activities || [];
  const supports: string[] = plan.supports || [];
  const watch: string[] = plan.watch || [];

  return (
    <div className="fp-root">
      <div className="fp-wrap">
        <header className="fp-hero">
          <div className="fp-hero-text">
            <p className="fp-kicker">{ar ? 'أول خطة — النهارده' : 'First plan — starting today'}</p>
            <h1 className="fp-title" dir={ar ? 'rtl' : 'ltr'}>
              {ar ? <>خطة الأسبوع لـ <mark className="fp-mark">{name}</mark></> : <>This week’s plan for <mark className="fp-mark">{name}</mark></>}
            </h1>
            <p className="fp-sub" dir={ar ? 'rtl' : 'ltr'}>
              {ar
                ? 'اتبنيت على اللي شاركته في ملف العائلة + اللي اكتشفناه مع {name} في تسلّم التعلّم. دي مسودة أولى — هتتغيّر معاه.'
                    .replace('{name}', name)
                : `Built from what you shared in the Family Profile and what we found on the learning ladder. This is a first draft — it changes as he does.`}
            </p>
          </div>
          <div className="fp-hero-buddy" aria-hidden="true"><IrisBuddy mood="happy" /></div>
        </header>

        {merged.divergenceNote && (
          <div className="fp-note" dir={ar ? 'rtl' : 'ltr'}>
            {ar ? merged.divergenceNote.ar : merged.divergenceNote.en}
          </div>
        )}

        {/* Strengths come first — always. Families arrive expecting deficits. */}
        <section className="fp-card fp-wash-yellow">
          <h2 className="fp-h2">{ar ? 'حاجات بيعملها — من غير مساعدة' : 'Things he does — without help'}</h2>
          {strengths.length || interests.length ? (
            <ul className="fp-list">
              {strengths.slice(0, 3).map((s: any, i: number) => (
                <li key={`s${i}`} className="fp-strength">
                  <span className="fp-tick" aria-hidden="true">✓</span>
                  {ar ? (s.ar || s.labelAr || s.strengthAr || s) : (s.en || s.labelEn || s.strengthEn || s)}
                </li>
              ))}
              {interests.length > 0 && (
                <li className="fp-interests">
                  <span className="fp-interests-label">{ar ? 'وبيحب:' : 'And he likes:'}</span>
                  {interests.map((x, i) => <span key={`i${i}`} className="fp-chip">{typeof x === 'string' ? x : (ar ? x.ar : x.en)}</span>)}
                </li>
              )}
            </ul>
          ) : (
            <p className="fp-soft">{ar ? 'أول ما نكمّل ملف العائلة هتظهر النقط دي هنا.' : 'These will appear as the Family Profile fills in.'}</p>
          )}
        </section>

        <section className="fp-card">
          <h2 className="fp-h2">{ar ? 'التلات حاجات اللي هنشتغل عليها' : 'The three things we will work on'}</h2>
          {priorities.length ? priorities.map((p: any, i: number) => (
            <div key={p.id || i} className={`fp-prio fp-tone-${p.track === 'functional' ? 'blue' : 'green'}`}>
              <div className="fp-prio-head">
                <span className="fp-prio-num">{i + 1}</span>
                <span className="fp-prio-label">{ar ? (p.labelAr || p.label) : (p.labelEn || p.label)}</span>
                <span className="fp-prio-track">{ar ? (TRACK_AR[p.track] || '') : (TRACK_EN[p.track] || '')}</span>
              </div>
              {(p.whyAr || p.whyEn) && <p className="fp-prio-why" dir={ar ? 'rtl' : 'ltr'}>{ar ? p.whyAr : p.whyEn}</p>}
            </div>
          )) : <p className="fp-soft">{ar ? 'مساره الاتنين لسه بيكتمل — اولع اللعب وهيبدأ التقييم ياخد شكل.' : 'Both tracks are still filling in — play will start shaping them.'}</p>}
        </section>

        <section className="fp-card fp-wash-blue">
          <h2 className="fp-h2">{ar ? 'الشكل الأسبوعي' : 'The weekly shape'}</h2>
          <div className="fp-week">
            <div className="fp-sessions" aria-hidden="true">
              {Array.from({ length: Math.min(7, Math.max(3, Number(plan.sessionsPerWeek) || 4)) }).map((_, i) => (
                <span key={i} className="fp-session-dot">{i + 1}</span>
              ))}
            </div>
            <p className="fp-soft" dir={ar ? 'rtl' : 'ltr'}>
              {ar
                ? `كل جلسة تقريبًا ${Number(plan.sessionMinutes) || 5}–10 دقايق — أقل أحسن، وباستمرار أحسن.`
                : `About ${Number(plan.sessionMinutes) || 5}–10 minutes a session — less is better, and consistent beats long.`}
            </p>
          </div>
          {activities.length > 0 && (
            <ul className="fp-list fp-acts">
              {activities.slice(0, 6).map((a: any, i: number) => (
                <li key={a.id || i} className="fp-act">
                  <strong>{ar ? (a.labelAr || a.label) : (a.labelEn || a.label)}</strong>
                  {(a.reasonAr || a.reasonEn) && <span className="fp-act-why" dir={ar ? 'rtl' : 'ltr'}>{ar ? a.reasonAr : a.reasonEn}</span>}
                </li>
              ))}
            </ul>
          )}
          {supports.length > 0 && (
            <div className="fp-supports">
              <h3 className="fp-h3">{ar ? 'طريقة المساعدة (شغّلوها من البداية)' : 'How to help (set it up from the start)'}</h3>
              <ul className="fp-list fp-dots">{supports.map((s: any, i: number) => <li key={i}>{typeof s === 'string' ? s : (ar ? s.ar : s.en)}</li>)}</ul>
            </div>
          )}
          {watch.length > 0 && (
            <div className="fp-watch">
              <h3 className="fp-h3">{ar ? 'نراقب إيه' : 'What to keep an eye on'}</h3>
              <ul className="fp-list fp-dots">{watch.map((s: any, i: number) => <li key={i}>{typeof s === 'string' ? s : (ar ? s.ar : s.en)}</li>)}</ul>
            </div>
          )}
          {plan.recheckIn && (
            <p className="fp-recheck" dir={ar ? 'rtl' : 'ltr'}>
              {ar ? `هنعدّل الخطة: ${plan.recheckIn}` : `We will revisit the plan: ${plan.recheckIn}`}
            </p>
          )}
        </section>

        <footer className="fp-foot">
          <p className="fp-badge" dir={ar ? 'rtl' : 'ltr'}>
            {ar
              ? 'IRIS نموذج أولي مبني على أبحاث — الاتنين (الأسئلة والسيستم) لسه بيتحققوا مع مختصين. مش تشخيص ولا بديل عنهم.'
              : 'IRIS is a research-based prototype — both the questions and the system are still being validated with specialists. This is not a diagnosis and does not replace one.'}
          </p>
          <div className="fp-actions">
            <button className="fp-ghost" onClick={onOpenFamily}>{ar ? 'اعرف الصورة الكاملة' : 'See the full picture'}</button>
            <button className="fp-cta" onClick={onContinue}>{ar ? 'يلا نبدأ ✨' : "Let's go ✨"}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
