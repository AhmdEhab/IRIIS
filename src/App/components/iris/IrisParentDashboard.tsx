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
 *
 * Re-skinned in the landing / parent-home language (cream ground, glass
 * header pills, white hero plate, pastel bubbles and cards) — the same
 * vocabulary IrisParentHome uses. Data paths, guards and copy are untouched.
 */
import React from 'react';
import { Award, Home, LogOut } from 'lucide-react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { BrandIcon } from './ui/brand';
import { IrisBuddy } from './ui/IrisBuddy';
import { ChromeActions } from './ui/ChromeActions';
import { AdaptationTrail } from './ui/AdaptationTrail';
import { Blob, Sparkle } from '../landing/LandingDecor';
import '../landing-child.css';
import '../parent-dashboard-landing.css';

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
      <div className="lc-root pd-scope" dir={ar ? 'rtl' : 'ltr'}>
        <div className="lc-decor" aria-hidden="true">
          <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
          <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
          <Sparkle className="lc-spark lc-spark--1" />
          <Sparkle className="lc-spark lc-spark--2" />
          <Sparkle className="lc-spark lc-spark--3" />
        </div>

        <header className="lc-header">
          <div className="lc-header-inner">
            <button type="button" className="lc-pill lc-pill--blue" onClick={onBack}>
              <Home aria-hidden="true" />
              <span>{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
            </button>
            <div className="lc-header-side lc-header-side--parent">
              <ChromeActions />
              {childProfile && (
                <button type="button" className="lc-pill lc-pill--ghost" onClick={handleLogout}>
                  <LogOut aria-hidden="true" />
                  <span>{ar ? 'خروج' : 'Log out'}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="lc-main">
          <section className="lc-hero">
            <div className="lc-hero-dots" aria-hidden="true" />
            <div className="pd-empty">
              <div className="pd-buddy">
                <IrisBuddy mood="idle" className="w-28 h-28" />
              </div>
              <div>
                <span className="lc-parent-eyebrow">{ar ? 'المتابعة والتقدّم' : 'Progress & Insights'}</span>
                <h1 className="lc-hero-title">
                  {ar
                    ? `لم يبدأ ${childName || 'طفلك'} أنشطة التعرّف بعد.`
                    : `${childName || 'Your child'} hasn't started the getting-to-know activities yet.`}
                </h1>
              </div>
              {onEnterChildMode && (
                <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onEnterChildMode}>
                  <BrandIcon name="child" className="w-7 h-7" tone="transparent" />
                  <span>{ar ? 'الدخول إلى وضع الطفل' : 'Enter Child Mode'}</span>
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const summary = profile ? explainProfile(profile, language) : [];
  const mastered = sessions.filter((s: any) => s.decision?.reason_code === 'ADVANCE_MASTERY');

  return (
    <div className="lc-root pd-scope" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      <header className="lc-header">
        <div className="lc-header-inner">
          <button type="button" className="lc-pill lc-pill--blue" onClick={onBack}>
            <Home aria-hidden="true" />
            <span>{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
          </button>
          <div className="lc-header-side lc-header-side--parent">
            <ChromeActions />
            <span className="lc-pill lc-pill--yellow" role="status">
              <Award aria-hidden="true" />
              <span dir="ltr">{stars}</span>
            </span>
            {childProfile && (
              <button type="button" className="lc-pill lc-pill--ghost" onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                <span>{ar ? 'خروج' : 'Log out'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="lc-main">
        {/* Hero — the key numbers, on the same white plate the parent hub uses */}
        <section className="lc-hero">
          <div className="lc-hero-dots" aria-hidden="true" />
          <div className="lc-hero-grid">
            <div className="lc-hero-copy">
              <span className="lc-parent-eyebrow">{ar ? 'المتابعة والتقدّم' : 'Progress & Insights'}</span>
              <h1 className="lc-hero-title">
                {ar ? (
                  <>متابعة <span className="lc-hero-mark">{childName || 'طفلك'}</span></>
                ) : (
                  <><span className="lc-hero-mark">{childName || 'Your child'}</span>'s progress</>
                )}
              </h1>
              <div className="pd-stats">
                <div className="pd-stat pd-stat--yellow">
                  <span className="pd-stat-value" dir="ltr">{stars}</span>
                  <span className="pd-stat-label">{ar ? 'نجوم' : 'Stars'}</span>
                </div>
                <div className="pd-stat pd-stat--blue">
                  <span className="pd-stat-value" dir="ltr">{sessions.length}</span>
                  <span className="pd-stat-label">{ar ? 'جلسات' : 'Sessions'}</span>
                </div>
                <div className="pd-stat pd-stat--green">
                  <span className="pd-stat-value" dir="ltr">{mastered.length}</span>
                  <span className="pd-stat-label">{ar ? 'مستويات أتمّها' : 'Levels completed'}</span>
                </div>
                <div className="pd-stat pd-stat--purple">
                  <span className="pd-stat-value" dir="ltr">{assignments.length}</span>
                  <span className="pd-stat-label">{ar ? 'أهداف' : 'Goals'}</span>
                </div>
              </div>
              <div className="lc-hero-actions">
                {onEnterChildMode && (
                  <button type="button" className="lc-pill lc-pill--ghost" onClick={onEnterChildMode}>
                    <BrandIcon name="child" className="w-7 h-7" tone="transparent" />
                    <span>{ar ? 'وضع الطفل' : 'Child Mode'}</span>
                  </button>
                )}
                <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onOpenChat}>
                  <BrandIcon name="chat" className="w-7 h-7" tone="transparent" />
                  <span>{ar ? 'اسألي IRIS' : 'Ask IRIS'}</span>
                </button>
              </div>
            </div>
            <div className="lc-hero-mascot">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </section>

        {/**
          * What changed and why — the first thing on the screen, because it is
          * the question a parent actually opens this page with, and the claim
          * IRIS has to be able to prove. Read from the recorded trail rather
          * than recomputed here, so the screen and the audit agree.
          */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
              <BrandIcon name="chart" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'ما الذي تغيّر ولماذا' : 'What changed, and why'}</h2>
          </div>
          <div className="pd-plate">
            <AdaptationTrail
              history={adaptationHistory}
              latest={lastAdaptation}
              ar={ar}
              error={historyError}
            />
          </div>
        </section>

        {/* Current goals — the older goal/level pathway, when one is in use. */}
        {assignments.length > 0 && (
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--yellow lc-bubble--head" aria-hidden="true">
              <BrandIcon name="pencil" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'على ماذا يتدرّب الآن' : 'What they are practising now'}</h2>
          </div>
          <div className="pd-grid-cards">
            {assignments.map((a: any, i: number) => {
              const goal = GOAL_BY_ID[a.goal_id];
              return (
                <div key={a.goal_id}>
                  <div className="lc-card pd-card-static">
                    <span className="lc-bubble lc-bubble--yellow lc-card-bubble" aria-hidden="true">
                      <BrandIcon name="map" className="w-7 h-7" tone="transparent" />
                    </span>
                    <span className="lc-card-name">{ar ? goal?.nameAr : goal?.nameEn}</span>
                    <span className="lc-card-chip">{ar ? 'المستوى' : 'Level'} {a.level} / 4</span>
                    <span className="lc-card-desc">{explainGoalStatus({ assignment: a, snapshot: snapshots[i] }, language)}</span>
                    <span className="pd-note">
                      {ar ? 'قوة الدليل خلف هذا الهدف: ' : 'Evidence strength behind this goal: '}
                      <span className="pd-mono">{goal?.evidence_tier}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Why the last decision happened — older pathway engine. */}
        {lastDecision && (
          <section className="lc-section">
            <div className="lc-section-head">
              <span className="lc-bubble lc-bubble--purple lc-bubble--head" aria-hidden="true">
                <BrandIcon name="info" className="w-7 h-7" tone="transparent" />
              </span>
              <h2 className="lc-section-title">{ar ? 'لماذا تغيّر شيء؟' : 'Why did something change?'}</h2>
            </div>
            <div className="pd-plate pd-plate--tight">
              <p className="pd-muted">{explainDecision(lastDecision, language)}</p>
              <p className="pd-mono">{lastDecision.rule_id} · {lastDecision.reason_code} · {lastDecision.rule_pack_version}</p>
              <p className="pd-fineprint">
                {ar
                  ? 'كل قرار في IRIS يُسجَّل مع سببه ومع الأرقام التي أدّت إليه. لا يوجد أي قرار مبني على تشخيص طفلك.'
                  : 'Every IRIS decision is logged with its reason and the numbers behind it. No decision is based on your child\'s diagnosis.'}
              </p>
            </div>
          </section>
        )}

        {/* Recent sessions — older pathway engine only. */}
        {sessions.length > 0 && (
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
              <BrandIcon name="repeat" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'الجلسات الأخيرة' : 'Recent sessions'}</h2>
          </div>
          <div className="pd-plate">
            {sessions.length === 0 ? (
              <p className="pd-muted">{ar ? 'لا توجد جلسات بعد.' : 'No sessions yet.'}</p>
            ) : (
              <div className="pd-table-wrap">
                <table className="pd-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{ar ? 'الهدف' : 'Goal'}</th>
                      <th>{ar ? 'المستوى' : 'Level'}</th>
                      <th>{ar ? 'صحيح' : 'Correct'}</th>
                      <th>{ar ? 'بدون مساعدة' : 'Unaided'}</th>
                      <th>{ar ? 'ما حدث بعدها' : 'What happened next'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(-8).map((s: any, i: number) => (
                      <tr key={i}>
                        <td><span className="pd-num">{sessions.length - Math.min(8, sessions.length) + i + 1}</span></td>
                        <td className="pd-td-goal">{ar ? GOAL_BY_ID[s.goal_id]?.nameAr : GOAL_BY_ID[s.goal_id]?.nameEn}</td>
                        <td>{s.level}</td>
                        <td>
                          <span className="pd-pct">{Math.round((s.accuracy ?? 0) * 100)}%</span>
                          <div className="pd-bar" aria-hidden="true">
                            <div className="pd-bar-fill" style={{ width: `${Math.round((s.accuracy ?? 0) * 100)}%` }} />
                          </div>
                        </td>
                        <td>
                          <span className="pd-pct">{Math.round((s.independence ?? 0) * 100)}%</span>
                          <div className="pd-bar" aria-hidden="true">
                            <div className="pd-bar-fill pd-bar-fill--green" style={{ width: `${Math.round((s.independence ?? 0) * 100)}%` }} />
                          </div>
                        </td>
                        <td className="pd-td-next">{s.decision?.explanation_parent?.[language] ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Mastered — older pathway engine only. */}
        {sessions.length > 0 && (
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--green lc-bubble--head" aria-hidden="true">
              <BrandIcon name="check" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'مستويات أتمّها' : 'Levels completed'}</h2>
          </div>
          <div className="pd-plate pd-plate--tight">
            {mastered.length === 0 ? (
              <p className="pd-muted">
                {ar ? 'لم يكتمل أي مستوى بعد. يحتاج المستوى جلستين متتاليتين بأداء مرتفع.' : 'No level completed yet. A level needs two consecutive strong sessions.'}
              </p>
            ) : (
              <ul className="pd-rows">
                {mastered.map((s: any, i: number) => (
                  <li key={i} className="pd-row-soft">
                    ✅ {ar ? GOAL_BY_ID[s.goal_id]?.nameAr : GOAL_BY_ID[s.goal_id]?.nameEn} — {ar ? 'المستوى' : 'Level'} {s.decision.from_level}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        )}

        {/* Profile summary + mandated disclaimer — sub-measure assessment only. */}
        {summary.length > 0 && (
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--yellow lc-bubble--head" aria-hidden="true">
              <BrandIcon name="book" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'ملخّص أنشطة التعرّف' : 'Screening summary'}</h2>
          </div>
          <div className="pd-plate pd-plate--tight">
            {summary.map((line: string, i: number) => (
              <p key={i} className={i === summary.length - 1 ? 'pd-fineprint' : 'pd-muted'}>
                {line}
              </p>
            ))}
          </div>
        </section>
        )}

        <p className="lc-disclaimer pd-disclaimer">
          {ar
            ? 'المحتوى والإرشادات هنا محتوى أوّلي مبني على إطار الأدلة الحالي. لم تتم مراجعته أو اعتماده من مختص. مراجعة المختصين هي المرحلة التالية.'
            : 'Content and guidance here are research-informed prototype material based on the current evidence framework. Not specialist-reviewed or approved. Specialist validation is the next phase.'}
        </p>
      </main>
    </div>
  );
}
