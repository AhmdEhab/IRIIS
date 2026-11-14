/* ── IRIS Family Profile view (research framework §5 "the full picture") ────
   Parents open this from the hub to see the TWO TRACKS side by side:
   what daily life shows (their own answers) and what the learning ladder
   showed — with the honest rule visible: disagreement between tracks is
   information, not contradiction, and neither average nor verdict is taken.
   --------------------------------------------------------------------------- */
import React from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCaregiverBlocks } from '../../../iris/caregiver/bank.js';
import './plan-family.css';

export interface IrisFamilyProfileProps {
  caregiver: { responses: Record<string, any>; scored: Record<string, any> } | null;
  onBack: () => void;
  onEditCaregiver: () => void;
  onOpenSnapshot: () => void;
  onRetakeLadder: () => void;
}

/* State → plain, non-judgmental wording (framework §3 vocabulary). */
const STATE_LABELS: Record<string, { ar: string; en: string; tone: string }> = {
  does_independently: { ar: 'بيعمله لوحده', en: 'does it on his own', tone: 'green' },
  does_with_support: { ar: 'بيعمله بمساعدة', en: 'does it with support', tone: 'blue' },
  emerging: { ar: 'لسه بيشوف طريقه', en: 'finding his way in it', tone: 'yellow' },
  unmet_need: { ar: 'محتاج دعم — والدعم ده لسه مش موجود', en: 'needs support — and it is not there yet', tone: 'coral' },
  not_yet_opportunity: { ar: 'ماخدش فرصة يعملها لحد دلوقتي', en: 'has not had the chance to try it', tone: 'purple' },
  needs_more_information: { ar: 'لسه بنجمع معلومات كفاية', en: 'still gathering enough to say', tone: 'grey' },
};

const CONF_LABELS: Record<string, { ar: string; en: string }> = {
  HIGH: { ar: 'صورة كفاية', en: 'enough picture' },
  MEDIUM: { ar: 'صورة معقولة', en: 'a fair picture' },
  LOW: { ar: 'صورة مبدئية', en: 'an early picture' },
  NEEDS_MORE_INFO: { ar: 'محتاجين أسئلة أقل', en: 'needs fewer unanswered' },
};

export function IrisFamilyProfile({
  caregiver, onBack, onEditCaregiver, onOpenSnapshot, onRetakeLadder,
}: IrisFamilyProfileProps) {
  const iris = useIris();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const scored = caregiver?.scored;
  const ladder = (iris as any).ladder as any;

  const blockMeta = React.useMemo(() => {
    const map: Record<string, { icon: string; titleAr: string; titleEn: string }> = {};
    try {
      for (const b of getCaregiverBlocks()) map[b.id] = { icon: b.icon, titleAr: b.titleAr, titleEn: b.titleEn };
    } catch { /* bank not loaded yet — the strip below renders plain names */ }
    return map;
  }, []);

  const unmet: any[] = scored?.unmetNeeds || [];
  const guidance: string[] = scored?.guidanceNotes || [];

  const exportJson = () => {
    try {
      const payload = JSON.stringify(
        { exportedAt: new Date().toISOString(), familyProfile: { responses: caregiver?.responses ?? null, scored: scored ?? null }, learningLadder: ladder ?? null },
        null, 2,
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'iris-family-profile.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch { /* download blocked — the data stays on screen */ }
  };

  return (
    <div className="fp-root">
      <div className="fp-wrap">
        <div className="fp-topbar">
          <button className="fp-back" onClick={onBack} aria-label={ar ? 'رجوع' : 'Back'}>
            <span aria-hidden="true">{ar ? '‹' : '›'}</span> {ar ? 'رجوع' : 'Back'}
          </button>
          <button className="fp-back fp-export" onClick={exportJson}>{ar ? 'نسخة للمختص ⬇' : 'Export for a professional ⬇'}</button>
        </div>

        <header className="fp-hero fp-hero-tight">
          <div>
            <p className="fp-kicker">{ar ? 'الصورة الكاملة' : 'The full picture'}</p>
            <h1 className="fp-title">{ar ? 'ملف العائلة' : 'Family Profile'}</h1>
            <p className="fp-sub" dir={ar ? 'rtl' : 'ltr'}>
              {ar
                ? 'مسارين بعض — اللي بتقولهم الحياة في البيت، واللي بيورّيهم تسلّم التعلّم. الاتنين بيتسمعوش، ومفيش رقم واحد يلمّهم.'
                : 'Two tracks — what daily life shows, and what the learning ladder showed. Both get heard; no single number merges them.'}
            </p>
          </div>
        </header>

        {/* ── Track 1: daily life (the parent's own answers) ── */}
        <section className="fp-card">
          <h2 className="fp-h2">{ar ? '١ · الحياة اليومية — إنت اللي قلتها' : '1 · Daily life — from you'}</h2>
          {scored?.domainStates ? (
            <ul className="fp-domains">
              {Object.entries(scored.domainStates as Record<string, any>).map(([id, d]: [string, any]) => {
                const meta = blockMeta[id] || { icon: '⭐', titleAr: id, titleEn: id };
                const st = STATE_LABELS[d.state] || STATE_LABELS.needs_more_information;
                const conf = CONF_LABELS[d.confidence];
                return (
                  <li key={id} className={`fp-domain fp-tone-${st.tone}`}>
                    <span className="fp-domain-icon" aria-hidden="true">{meta.icon}</span>
                    <div className="fp-domain-body">
                      <strong>{ar ? meta.titleAr : meta.titleEn}</strong>
                      <span className="fp-domain-state">{ar ? st.ar : st.en}</span>
                      {conf && <span className="fp-domain-conf">{ar ? `(${conf.ar})` : `(${conf.en})`}</span>}
                      {(d.watchAr || d.watchEn) && (
                        <p className="fp-domain-watch" dir={ar ? 'rtl' : 'ltr'}>{ar ? d.watchAr : d.watchEn}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="fp-empty-block">
              <p dir={ar ? 'rtl' : 'ltr'}>{ar ? 'لسه مفيش ملف عائلة مكتمل.' : 'No completed Family Profile yet.'}</p>
              <button className="fp-cta fp-small" onClick={onEditCaregiver}>{ar ? 'يلا نعمله' : 'Set it up'}</button>
            </div>
          )}
        </section>

        {/* ── Track 2: the learning ladder ── */}
        <section className="fp-card fp-wash-blue">
          <h2 className="fp-h2">{ar ? '٢ · تسلّم التعلّم — اللي اكتشفناه معاه' : '2 · The learning ladder — what we found with him'}</h2>
          {ladder ? (
            <>
              <p className="fp-ladder-line" dir={ar ? 'rtl' : 'ltr'}>
                {ladder.headlineAr || ladder.headline || (ar ? 'فيه مسارات بتتبني — تفاصيلها في اللمحة الكاملة.' : 'Several strands are building — details in the full snapshot.')}
              </p>
              <button className="fp-ghost fp-small" onClick={onOpenSnapshot}>{ar ? 'افتح اللمحة الكاملة' : 'Open the full snapshot'}</button>
            </>
          ) : (
            <div className="fp-empty-block">
              <p dir={ar ? 'rtl' : 'ltr'}>{ar ? 'التقييم الصغير (التسلّم) لسه ما اتعملش.' : 'The learning ladder has not run yet.'}</p>
              <button className="fp-cta fp-small" onClick={onRetakeLadder}>{ar ? 'نعمله دلوقتي' : 'Run it now'}</button>
            </div>
          )}
        </section>

        {unmet.length > 0 && (
          <section className="fp-card fp-wash-coral">
            <h2 className="fp-h2">{ar ? 'حاجات محتاجة دعم — ولسه مش موجود' : 'Needs that require support — and it is not there yet'}</h2>
            <ul className="fp-list fp-dots">
              {unmet.map((u: any, i: number) => (
                <li key={i} dir={ar ? 'rtl' : 'ltr'}>{ar ? (u.ar || u.label || u) : (u.en || u.label || u)}</li>
              ))}
            </ul>
            <p className="fp-soft" dir={ar ? 'rtl' : 'ltr'}>
              {ar
                ? 'مش دي مشاوير IRIS لوحدها — دي حاجات بنقولك بصراحة إن محتاج فيها حد يساعد: مختص، أو مدرسة، أو خدمة في منطقتك.'
                : 'IRIS does not carry these alone — we are telling you plainly that each of these deserves a professional, a school, or a local service.'}
            </p>
          </section>
        )}

        {guidance.length > 0 && (
          <section className="fp-card fp-wash-yellow">
            <h2 className="fp-h2">{ar ? 'ملاحظات من إجاباتك' : 'Notes from your answers'}</h2>
            <ul className="fp-list fp-dots">{guidance.map((g, i) => <li key={i} dir={ar ? 'rtl' : 'ltr'}>{g}</li>)}</ul>
          </section>
        )}

        <footer className="fp-foot">
          <p className="fp-badge" dir={ar ? 'rtl' : 'ltr'}>
            {ar
              ? 'الإجابات بتتجمع عشان تفهم طفل وتخطط — مش عشان تصنفه. مفيش درجة ولا حكم في أي مكان من IRIS.'
              : 'Answers here exist to understand and plan for your child — not to classify them. There is no score and no verdict anywhere in IRIS.'}
          </p>
          <div className="fp-actions">
            <button className="fp-ghost" onClick={onEditCaregiver}>{ar ? 'عدّل إجاباتك' : 'Edit your answers'}</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
