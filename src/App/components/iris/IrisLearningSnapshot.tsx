import React from 'react';
import { motion } from 'motion/react';
import { Home, Play } from 'lucide-react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  Pill,
  StepDisc,
  BrandIcon,
  ErrorState,
  type BrandTone,
} from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';
import { IrisBuddy } from './ui/IrisBuddy';
import { Blob, Sparkle } from '../landing/LandingDecor';
import '../landing-child.css';
import '../parent-snapshot-landing.css';

/**
 * Parent Mode — the learning snapshot from the ladder assessment.
 *
 * Dressed in the landing / Parent-hub language (`.lc-*` classes): cream
 * ground, glass header with a back pill, a white hero plate carrying the
 * headline and the buddy, then one pastel section per block of the report.
 * Structure and classes only — every value, label, caveat and handler
 * below is the same data the brochure view always showed.
 *
 * ── WHAT THIS SCREEN WILL NOT DO ──────────────────────────────────────────
 *  - It never renders a missing value as zero. `null` means "not measured
 *    yet", and a zero bar would tell a parent their child failed something
 *    that was never tried.
 *  - It never shows an overall score. There isn't one, and inventing a single
 *    number would undo the whole point of measuring strands separately.
 *  - It shows a dialect caveat NEXT TO the number it qualifies, never as a
 *    footnote — a phonological score that understates a child for a linguistic
 *    reason is exactly the number a parent would otherwise act on wrongly.
 *  - No internal vocabulary. No rungs, no strands, no indicators, no
 *    confidence thresholds. Those words are for the engine, not for a parent.
 */

const NOT_MEASURED = '—';

function ValueChip({ value, notMeasured }: { value: number | null; notMeasured: boolean }) {
  if (notMeasured || value == null) {
    return (
      <span
        className="rounded-full bg-surface-sunk border border-hairline px-3 py-1 text-sm font-bold text-ink-muted tabular-nums"
        dir="ltr"
      >
        {NOT_MEASURED}
      </span>
    );
  }
  const tone: BrandTone = value >= 70 ? 'green' : value >= 45 ? 'yellow' : 'coral';
  return <Pill tone={tone}>{<span dir="ltr" className="tabular-nums">{value}</span>}</Pill>;
}

function SkillRow({ item, ar }: { item: any; ar: boolean }) {
  return (
    <li className="ps-skill-row">
      <span className="ps-skill-name">{ar ? item.nameAr : item.nameEn}</span>
      <ValueChip value={item.value} notMeasured={item.not_measured} />
      {/* Beside the number, never in a footnote. */}
      {item.caveat && (
        <p className="ps-skill-note ps-skill-note--caveat">
          ⓘ {ar ? item.caveat.ar : item.caveat.en}
        </p>
      )}
      {item.floor && (
        <p className="ps-skill-note ps-skill-note--floor">
          {ar
            ? 'مجرّبناها النهارده وكانت صعبة عليه — دي نقطة بداية كويسة للتدريب.'
            : 'We tried this today and it was hard — a good place to start practising.'}
        </p>
      )}
    </li>
  );
}

export function IrisLearningSnapshot({ onBack, onStart, onPractise }: { onBack: () => void; onStart?: () => void; onPractise?: () => void }) {
  const { learningSnapshot, ladderPlan, ladderSaveError } = useIris();
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  if (!learningSnapshot) {
    return (
      <div className="lc-root ps-scope" dir={ar ? 'rtl' : 'ltr'}>
        <div className="lc-decor" aria-hidden="true">
          <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
          <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
          <Sparkle className="lc-spark lc-spark--1" />
          <Sparkle className="lc-spark lc-spark--2" />
          <Sparkle className="lc-spark lc-spark--3" />
        </div>

        <SnapshotBar ar={ar} onBack={onBack} />

        <main className="lc-main">
          <motion.section
            className="lc-hero"
            initial={reduceMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <div className="lc-hero-dots" aria-hidden="true" />
            <div className="lc-hero-grid">
              <div className="lc-hero-copy">
                <span className="lc-parent-eyebrow">{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
                <h1 className="lc-hero-title">
                  <span className="lc-hero-mark">{ar ? 'لمحة عن التعلّم' : 'Learning Snapshot'}</span>
                </h1>
                <p className="lc-hero-sub">
                  {ar
                    ? 'لسه مفيش تقييم. لما الطفل يخلّص أنشطة التعرّف، هتلاقي هنا لمحة عن اللي بيعرفه دلوقتي.'
                    : 'No assessment yet. Once your child finishes the getting-to-know activities, a snapshot of what they can do now will appear here.'}
                </p>
                {onStart && (
                  <div className="lc-hero-actions">
                    <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onStart}>
                      <Play aria-hidden="true" />
                      <span>{ar ? 'ابدأ أنشطة التعرّف' : 'Start the getting-to-know activities'}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="lc-hero-mascot">
                <IrisBuddy mood="idle" />
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    );
  }

  const s = learningSnapshot;

  return (
    <div className="lc-root ps-scope" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      <SnapshotBar ar={ar} onBack={onBack} />

      <main className="lc-main">
        {/* Hero — the headline plate, the buddy, the name marked */}
        <motion.section
          className="lc-hero"
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="lc-hero-dots" aria-hidden="true" />
          <div className="lc-hero-grid">
            <div className="lc-hero-copy">
              <span className="lc-parent-eyebrow">{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
              <h1 className="lc-hero-title">
                <span className="lc-hero-mark">{ar ? s.headline.ar : s.headline.en}</span>
              </h1>
            </div>
            <div className="lc-hero-mascot">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </motion.section>

        {/* A failed save is surfaced, not swallowed — a parent acting on a
            snapshot that was never stored is worse than a visible warning. */}
        {ladderSaveError && (
          <ErrorState
            title={ar ? 'محصلش حفظ' : 'Not saved'}
            body={
              ar
                ? 'اللمحة دي اتعرضت بس محصلش حفظ على السيرفر. جرّبي تاني لما النت يرجع.'
                : 'This snapshot is shown but was not saved to the server. Try again when you are back online.'
            }
          />
        )}

        {/* Confidence first, so nothing below is read as more certain than it is. */}
        <div className={`ps-confidence${s.confidence.level === 'HIGH' ? ' ps-confidence--high' : ''}`}>
          <span
            className={`lc-bubble lc-bubble--${s.confidence.level === 'HIGH' ? 'green' : 'blue'}`}
            aria-hidden="true"
          >
            <BrandIcon name={s.confidence.level === 'HIGH' ? 'check' : 'info'} className="w-6 h-6" tone="transparent" />
          </span>
          <p>{ar ? s.confidence.ar : s.confidence.en}</p>
        </div>

        {/* Strengths — green */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--green lc-bubble--head" aria-hidden="true">
              <BrandIcon name="star" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? s.strengths.labelAr : s.strengths.labelEn}</h2>
            <span className="lc-card-chip ps-eyebrow">{ar ? 'النهارده' : 'Today'}</span>
          </div>
          <div className="ps-block">
            <p className="ps-intro">{ar ? s.strengths.introAr : s.strengths.introEn}</p>
            <ul className="ps-skill-list">{s.strengths.items.map((i: any) => <SkillRow key={i.strand} item={i} ar={ar} />)}</ul>
          </div>
        </section>

        {/* Developing — yellow */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--yellow lc-bubble--head" aria-hidden="true">
              <BrandIcon name="sprout" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? s.developing.labelAr : s.developing.labelEn}</h2>
            <span className="lc-card-chip ps-eyebrow">{ar ? 'بيتبني' : 'Building'}</span>
          </div>
          <div className="ps-block">
            <p className="ps-intro">{ar ? s.developing.introAr : s.developing.introEn}</p>
            <ul className="ps-skill-list">{s.developing.items.map((i: any) => <SkillRow key={i.strand} item={i} ar={ar} />)}</ul>
          </div>
        </section>

        {/* Next steps — blue, ordered with the brochure discs */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
              <BrandIcon name="map" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? s.next_focus.labelAr : s.next_focus.labelEn}</h2>
            <span className="lc-card-chip ps-eyebrow">{ar ? 'الأولويات' : 'Priorities'}</span>
          </div>
          <div className="ps-block">
            {/* The brochure numbers an ordered list with coloured discs, not
                with "1." in the running text. Same information, and the order
                survives being skim-read. */}
            <ol className="ps-steps">
              {s.next_focus.items.map((n: any) => (
                <li key={n.strand}>
                  <StepDisc n={n.order} />
                  <span>{ar ? n.nameAr : n.nameEn}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The practice reminder — yellow note */}
        <div className="ps-block ps-note--yellow">
          <h3 className="ps-note-head">{ar ? s.practice.labelAr : s.practice.labelEn}</h3>
          <p className="ps-note-body">{ar ? s.practice.ar : s.practice.en}</p>
        </div>

        {/* What to look for at home — purple */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--purple lc-bubble--head" aria-hidden="true">
              <BrandIcon name="house" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? s.what_to_observe.labelAr : s.what_to_observe.labelEn}</h2>
            <span className="lc-card-chip ps-eyebrow">{ar ? 'في البيت' : 'At home'}</span>
          </div>
          <div className="ps-block">
            <ul className="ps-observe-list">
              {s.what_to_observe.items.map((w: any) => (
                <li key={w.strand} className="ps-observe-item">
                  <span className="ps-observe-dot" aria-hidden="true" />
                  {/* Arabic letter examples appear inside English sentences here.
                      Without bidi isolation the browser reorders the glyphs and
                      "ب ت ث" renders backwards to an Arabic reader. */}
                  <span dir="auto" style={{ unicodeBidi: 'isolate' }}>{ar ? w.ar : w.en}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {s.not_measured.strands.length > 0 && (
          <div className="ps-block">
            <h3 className="ps-note-head ps-head-muted">
              {ar ? s.not_measured.labelAr : s.not_measured.labelEn}
            </h3>
            <p className="ps-intro ps-intro--tight">
              {ar ? s.not_measured.noteAr : s.not_measured.noteEn}
            </p>
            <div className="ps-ghost-chips">
              {s.not_measured.strands.map((n: any) => (
                <span key={n.strand} className="ps-ghost-chip">
                  {ar ? n.nameAr : n.nameEn}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* The plan is shown so the assessment visibly leads somewhere — an
            assessment that ends at a results page is the thing §19 rules out. */}
        {ladderPlan?.blueprint?.activities?.length > 0 && (
          <section className="lc-section">
            <div className="lc-section-head">
              <span className="lc-bubble lc-bubble--green lc-bubble--head" aria-hidden="true">
                <BrandIcon name="rocket" className="w-7 h-7" tone="transparent" />
              </span>
              <h2 className="lc-section-title">{ar ? 'الأنشطة اللي هيشتغل عليها' : 'What he will work on'}</h2>
              <span className="lc-card-chip ps-eyebrow">{ar ? 'الجاي' : 'Coming up'}</span>
            </div>
            <div className="ps-block">
              <ul className="ps-plan-list">
                {ladderPlan.blueprint.activities.map((a: any) => (
                  <li key={a.strand} className="ps-plan-item">
                    {ar ? a.strand_name_ar : a.strand_name_en}
                  </li>
                ))}
              </ul>
              {/* The plan has to be playable, or the assessment ends at a
                  results page and no practice ever reaches the skill estimate. */}
              {onPractise && (
                <div className="lc-hero-actions">
                  <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onPractise}>
                    <Play aria-hidden="true" />
                    <span>{ar ? 'ابدأ التدريب' : 'Start practice'}</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <p className="lc-disclaimer">
          {ar ? s.disclaimer.ar : s.disclaimer.en}
        </p>
      </main>
    </div>
  );
}

/** One bar for both the empty and the populated state, so they cannot drift. */
function SnapshotBar({ ar, onBack }: { ar: boolean; onBack: () => void }) {
  return (
    <header className="lc-header">
      <div className="lc-header-inner">
        <button type="button" className="lc-pill lc-pill--blue" onClick={onBack}>
          <Home aria-hidden="true" />
          <span>{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
        </button>
        <div className="lc-header-side lc-header-side--parent">
          <ChromeActions />
          <span className="lc-name-chip">{ar ? 'لمحة عن التعلّم' : 'Learning Snapshot'}</span>
        </div>
      </div>
    </header>
  );
}
