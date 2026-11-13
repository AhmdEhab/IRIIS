/**
 * IRIS Parent Mode — Progress Dashboard (doc 16 §Parent Mode, doc 12 §6)
 *
 * SHOWS: current goal, current level, recent performance, progress across
 *        sessions, mastered skills, skills needing practice, and a plain-
 *        language explanation of WHY the last pathway decision happened.
 *
 * NEVER SHOWS: percentiles, age equivalents, IQ-like numbers, DPS values,
 *        comparisons to other children or to a "typical 7-year-old",
 *        clinical interpretation, predictions, or deficit language.
 *
 * Every interpretation is based on OBSERVED PERFORMANCE, never on diagnosis.
 */
import React from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { RewardBadge } from './ui/RewardBadge';
import { ScreenFrame, TopBar, BarAction, DisplayTitle, StarCount, EmptyState, Button as BrandButton } from './ui/brand';
import { IrisBuddy } from './ui/IrisBuddy';
import { ChromeActions } from './ui/ChromeActions';
import { AdaptationTrail } from './ui/AdaptationTrail';

export function IrisParentDashboard({
  onOpenChat, onBack, onEnterChildMode,
}: { onOpenChat: () => void; onBack: () => void; onEnterChildMode?: () => void }) {
  const {
    profile, assignments, sessions, lastDecision, snapshots, childName, stars,
    GOAL_BY_ID, explainProfile, explainGoalStatus, explainDecision,
    lastAdaptation, adaptationHistory, historyError, refreshAdaptationHistory, childDbId, ladder,
  } = useIris();
  const { language } = useLanguage();
  const { logoutUser, childProfile } = useApp();
  const ar = language === 'ar';

  const handleLogout = async () => { await logoutUser(); onBack(); };

  /**
   * Pull the recorded adaptation trail whenever this screen opens.
   *
   * The in-memory `lastAdaptation` only covers the current tab. A parent who
   * comes back tomorrow, or opens Parent Mode on a different device, has to
   * see the same record an auditor would — so the screen reads the server
   * rather than trusting whatever state happens to be in the page.
   */
  React.useEffect(() => { void refreshAdaptationHistory(); }, [childDbId, refreshAdaptationHistory]);

  /**
   * ── WHY THIS GUARD CHANGED ────────────────────────────────────────────────
   * It used to be `if (!profile)`. `profile` is produced only by the older
   * sub-measure assessment, and a child on the current ladder pathway never
   * has one — so this screen, whose entire job is "what is being practised and
   * why did anything change", showed "hasn't started yet" to parents whose
   * child had completed an assessment and several rounds of practice. The
   * empty state now means what it says: nothing observed, from any pathway.
   */
  const hasAnything = !!profile || !!ladder || adaptationHistory.length > 0 || !!lastAdaptation;

  if (!hasAnything) {
    return (
      <ScreenFrame
        accent="blue"
        width="md"
        topBar={
          <TopBar
            ar={ar}
            onBack={onBack}
            backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
            title={ar ? 'المتابعة والتقدّم' : 'Progress & Insights'}
            actions={
              <>
                <ChromeActions />
                {childProfile && <BarAction onClick={handleLogout}>{ar ? 'خروج' : 'Log out'}</BarAction>}
              </>
            }
          />
        }
      >
        <EmptyState
          illustration={<IrisBuddy mood="idle" className="w-28 h-28" />}
          body={
            ar
              ? `لم يبدأ ${childName || 'طفلك'} أنشطة التعرّف بعد.`
              : `${childName || 'Your child'} hasn't started the getting-to-know activities yet.`
          }
          action={
            onEnterChildMode ? (
              <BrandButton variant="play" size="lg" icon="child" onClick={onEnterChildMode}>
                {ar ? 'الدخول إلى وضع الطفل' : 'Enter Child Mode'}
              </BrandButton>
            ) : undefined
          }
        />
      </ScreenFrame>
    );
  }

  const summary = profile ? explainProfile(profile, language) : [];
  const mastered = sessions.filter((s: any) => s.decision?.reason_code === 'ADVANCE_MASTERY');

  return (
    <ScreenFrame
      accent="blue"
      width="lg"
      topBar={
        <TopBar
          ar={ar}
          onBack={onBack}
          backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
          title={ar ? 'المتابعة والتقدّم' : 'Progress & Insights'}
          actions={
            <>
              <StarCount count={stars} />
              <ChromeActions />
              {childProfile && <BarAction onClick={handleLogout}>{ar ? 'خروج' : 'Log out'}</BarAction>}
            </>
          }
        />
      }
    >
      <div className="space-y-6">

        <div className="flex flex-wrap items-end justify-between gap-3">
          <DisplayTitle size="title" arc>
            {ar ? `متابعة ${childName || 'طفلك'}` : `${childName || 'Your child'}'s progress`}
          </DisplayTitle>
          <div className="flex gap-2 flex-wrap justify-end">
            {onEnterChildMode && (
              <BrandButton variant="secondary" icon="child" onClick={onEnterChildMode}>
                {ar ? 'وضع الطفل' : 'Child Mode'}
              </BrandButton>
            )}
            <BrandButton variant="primary" icon="chat" onClick={onOpenChat}>
              {ar ? 'اسألي IRIS' : 'Ask IRIS'}
            </BrandButton>
          </div>
        </div>

        {/**
          * What changed and why — the first thing on the screen, because it is
          * the question a parent actually opens this page with, and the claim
          * IRIS has to be able to prove. Read from the recorded trail rather
          * than recomputed here, so the screen and the audit agree.
          */}
        <section className="bg-surface rounded-brand border border-hairline p-6 space-y-4">
          <h2 className="text-xl font-semibold text-ink">
            {ar ? 'ما الذي تغيّر ولماذا' : 'What changed, and why'}
          </h2>
          <AdaptationTrail
            history={adaptationHistory}
            latest={lastAdaptation}
            ar={ar}
            error={historyError}
          />
        </section>

        {/* Current goals — the older goal/level pathway, when one is in use. */}
        {assignments.length > 0 && (
        <section className="bg-surface rounded-brand border border-hairline p-6 space-y-4">
          <h2 className="text-xl font-semibold text-ink">
            {ar ? 'على ماذا يتدرّب الآن' : 'What they are practising now'}
          </h2>
          {assignments.map((a: any, i: number) => {
            const goal = GOAL_BY_ID[a.goal_id];
            return (
              <div key={a.goal_id} className="rounded-brand-sm bg-ground-tint p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{ar ? goal?.nameAr : goal?.nameEn}</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-brand-blue-wash text-brand-blue-ink">
                    {ar ? 'المستوى' : 'Level'} {a.level} / 4
                  </span>
                </div>
                <p className="text-ink-muted text-sm">{explainGoalStatus({ assignment: a, snapshot: snapshots[i] }, language)}</p>
                <p className="text-xs text-ink-muted">
                  {ar ? 'قوة الدليل خلف هذا الهدف: ' : 'Evidence strength behind this goal: '}
                  <span className="font-mono">{goal?.evidence_tier}</span>
                </p>
              </div>
            );
          })}
        </section>
        )}

        {/* Why the last decision happened — older pathway engine. */}
        {lastDecision && (
          <section className="bg-surface rounded-brand border border-hairline p-6 space-y-2">
            <h2 className="text-xl font-semibold text-ink">
              {ar ? 'لماذا تغيّر شيء؟' : 'Why did something change?'}
            </h2>
            <p className="text-ink-muted">{explainDecision(lastDecision, language)}</p>
            <p className="text-xs text-ink-muted font-mono">
              {lastDecision.rule_id} · {lastDecision.reason_code} · {lastDecision.rule_pack_version}
            </p>
            <p className="text-xs text-ink-muted">
              {ar
                ? 'كل قرار في IRIS يُسجَّل مع سببه ومع الأرقام التي أدّت إليه. لا يوجد أي قرار مبني على تشخيص طفلك.'
                : 'Every IRIS decision is logged with its reason and the numbers behind it. No decision is based on your child\'s diagnosis.'}
            </p>
          </section>
        )}

        {/* Recent sessions — older pathway engine only. */}
        {sessions.length > 0 && (
        <section className="bg-surface rounded-brand border border-hairline p-6">
          <h2 className="text-xl font-semibold text-ink mb-3">
            {ar ? 'الجلسات الأخيرة' : 'Recent sessions'}
          </h2>
          {sessions.length === 0 ? (
            <p className="text-ink-muted">{ar ? 'لا توجد جلسات بعد.' : 'No sessions yet.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-ink-muted border-b">
                    <th className="text-start py-2">#</th>
                    <th className="text-start py-2">{ar ? 'الهدف' : 'Goal'}</th>
                    <th className="text-start py-2">{ar ? 'المستوى' : 'Level'}</th>
                    <th className="text-start py-2">{ar ? 'صحيح' : 'Correct'}</th>
                    <th className="text-start py-2">{ar ? 'بدون مساعدة' : 'Unaided'}</th>
                    <th className="text-start py-2">{ar ? 'ما حدث بعدها' : 'What happened next'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(-8).map((s: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{sessions.length - Math.min(8, sessions.length) + i + 1}</td>
                      <td className="py-2">{ar ? GOAL_BY_ID[s.goal_id]?.nameAr : GOAL_BY_ID[s.goal_id]?.nameEn}</td>
                      <td className="py-2">{s.level}</td>
                      <td className="py-2">{Math.round((s.accuracy ?? 0) * 100)}%</td>
                      <td className="py-2">{Math.round((s.independence ?? 0) * 100)}%</td>
                      <td className="py-2 text-ink-muted">{s.decision?.explanation_parent?.[language] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {/* Mastered — older pathway engine only. */}
        {sessions.length > 0 && (
        <section className="bg-surface rounded-brand border border-hairline p-6">
          <h2 className="text-xl font-semibold text-ink mb-2">
            {ar ? 'مستويات أتمّها' : 'Levels completed'}
          </h2>
          {mastered.length === 0 ? (
            <p className="text-ink-muted text-sm">
              {ar ? 'لم يكتمل أي مستوى بعد. يحتاج المستوى جلستين متتاليتين بأداء مرتفع.' : 'No level completed yet. A level needs two consecutive strong sessions.'}
            </p>
          ) : (
            <ul className="space-y-1 text-ink-muted">
              {mastered.map((s: any, i: number) => (
                <li key={i}>
                  ✅ {ar ? GOAL_BY_ID[s.goal_id]?.nameAr : GOAL_BY_ID[s.goal_id]?.nameEn} — {ar ? 'المستوى' : 'Level'} {s.decision.from_level}
                </li>
              ))}
            </ul>
          )}
        </section>
        )}

        {/* Profile summary + mandated disclaimer — sub-measure assessment only. */}
        {summary.length > 0 && (
        <section className="bg-surface rounded-brand border border-hairline p-6 space-y-2">
          <h2 className="text-xl font-semibold text-ink">
            {ar ? 'ملخّص أنشطة التعرّف' : 'Screening summary'}
          </h2>
          {summary.map((line: string, i: number) => (
            <p key={i} className={i === summary.length - 1 ? 'text-xs text-ink-muted pt-2 border-t mt-3' : 'text-ink-muted'}>
              {line}
            </p>
          ))}
        </section>
        )}

        <p className="text-center text-xs text-ink-muted pb-6">
          {ar
            ? 'المحتوى والإرشادات هنا محتوى أوّلي مبني على إطار الأدلة الحالي. لم تتم مراجعته أو اعتماده من مختص. مراجعة المختصين هي المرحلة التالية.'
            : 'Content and guidance here are research-informed prototype material based on the current evidence framework. Not specialist-reviewed or approved. Specialist validation is the next phase.'}
        </p>
      </div>
    </ScreenFrame>
  );
}
