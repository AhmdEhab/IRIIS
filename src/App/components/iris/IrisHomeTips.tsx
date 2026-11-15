import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HOME_TIP_CATEGORIES, type Tip, type TipCategory } from '../../content/homeTips';
import { BrandIcon } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';
import { Blob, Sparkle } from '../landing/LandingDecor';
import { IrisBuddy } from './ui/IrisBuddy';
import '../landing-child.css';
import '../parent-tips-chat-landing.css';

/**
 * Home Tips — practical things a parent can do between sessions.
 *
 * Layout follows the original IRIS product: a category grid of tiles, then a
 * list of tips, then an article-style view whose body is a numbered step list.
 * Re-skinned in the landing / parent-home design language (cream polka-dot
 * ground, glass header, hero plate, pastel bubble cards). Structure, copy and
 * the state machine below are unchanged — styling only.
 *
 * CLAIMS DISCIPLINE
 * Every screen here states plainly that these are practical ideas, not therapy
 * and not a treatment plan, and that time suggestions are suggestions. See the
 * header of content/homeTips.ts for the specific research-document citations
 * behind that wording — in short, the corpus contains no learning-outcome data
 * for parent-coaching prompts and no dosage numbers of any kind, so neither is
 * claimed here.
 */

/** Pastel bubble tones cycle across the grid so a row of cards reads like the
 *  brochure's chip cluster rather than one flat colour. Presentation only. */
const TONES = ['blue', 'green', 'yellow', 'coral', 'purple'];

/** The shared landing chrome for all three views: decor, glass header with
 *  the view's own back handler and label, and the content column.
 *
 *  ── ONE BACK CONTROL, CHOSEN BY WHERE YOU ARE ───────────────────────────
 *  It used to swap a `Home` glyph for a physically left-pointing `ArrowLeft`
 *  depending on a flag, and that arrow stayed on the LEFT in Arabic, where
 *  "back" points right. The rule is now the one the brand TopBar already
 *  uses, and it is a rule a parent can learn once:
 *    · inside a view → a chevron pointing BACK, chosen from the writing
 *                      direction, labelled with what you land on;
 *    · at the top of
 *      the screen    → a `Home` pill that leaves Home Tips altogether. */
function Chrome({
  ar,
  title,
  backLabel,
  homeBack,
  onBackClick,
  children,
}: {
  ar: boolean;
  title: string;
  backLabel: string;
  /** True only at the top of the screen: this control leaves Home Tips. */
  homeBack?: boolean;
  onBackClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="lc-root tc-scope tc-tips" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      <header className="lc-header">
        <div className="lc-header-inner">
          <button type="button" className="lc-pill lc-pill--blue" onClick={onBackClick}>
            {homeBack ? (
              <Home aria-hidden="true" />
            ) : (
              /* Direction, not geometry: in Arabic "back" points right. */
              <BrandIcon name={ar ? 'forward' : 'back'} className="w-5 h-5 shrink-0" tone="transparent" />
            )}
            <span>{backLabel}</span>
          </button>
          <div className="lc-header-side lc-header-side--parent">
            <ChromeActions />
            <span className="lc-name-chip">{title}</span>
          </div>
        </div>
      </header>

      <main className="lc-main">{children}</main>
    </div>
  );
}

export function IrisHomeTips({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [category, setCategory] = useState<TipCategory | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const disclaimer = ar
    ? 'دي أفكار عملية للبيت — مش علاج ولا خطة علاجية، والأوقات المذكورة مجرد اقتراح.'
    : 'These are practical ideas for home — not therapy or a treatment plan, and any timings are only suggestions.';

  const screenTitle = ar ? 'أفكار للبيت' : 'Home Tips';

  // ── one tip, opened ──────────────────────────────────────────────────────
  if (tip) {
    return (
      <Chrome ar={ar} title={screenTitle} backLabel={ar ? 'رجوع' : 'Back'} onBackClick={() => setTip(null)}>
        {/* Hero plate — the tip stands in for the buddy as the hero figure. */}
        <section className="lc-hero">
          <div className="lc-hero-dots" aria-hidden="true" />
          <div className="lc-hero-grid">
            <div className="lc-hero-copy">
              <span className="lc-parent-eyebrow">{screenTitle}</span>
              <h1 className="lc-hero-title">
                <span className="lc-hero-mark">{ar ? tip.titleAr : tip.titleEn}</span>
              </h1>
              <p className="lc-hero-sub">{ar ? tip.summaryAr : tip.summaryEn}</p>
              <div className="lc-hero-actions">
                {/* A suggestion, never a prescription — see content/homeTips.ts. */}
                <span className="lc-card-chip tc-minutes">
                  <span aria-hidden="true">⏱️ </span>
                  {ar ? tip.minutesAr : tip.minutesEn}
                </span>
              </div>
            </div>
            <div className="lc-hero-mascot">
              <span className="tc-tip-figure" aria-hidden="true">{tip.icon}</span>
            </div>
          </div>
        </section>

        <section className="lc-section">
          <ol className="tc-steps">
            {tip.steps.map((s, i) => (
              <li key={i} className="tc-step">
                <span className="lc-card-chip tc-step-num" aria-hidden="true" dir="ltr">
                  {i + 1}
                </span>
                <span className="tc-step-text">{ar ? s.ar : s.en}</span>
              </li>
            ))}
          </ol>

          <p className="lc-disclaimer">{disclaimer}</p>
        </section>
      </Chrome>
    );
  }

  // ── one category ─────────────────────────────────────────────────────────
  if (category) {
    return (
      <Chrome
        ar={ar}
        title={screenTitle}
        backLabel={ar ? 'كل الأقسام' : 'All categories'}
        onBackClick={() => setCategory(null)}
      >
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--head lc-bubble--yellow" aria-hidden="true">
              {category.icon}
            </span>
            <h1 className="lc-section-title">{ar ? category.nameAr : category.nameEn}</h1>
          </div>

          <div className="lc-grid lc-grid--pair">
            {category.tips.map((t, i) => (
              <button key={t.id} type="button" onClick={() => setTip(t)} className="lc-card lc-card--section">
                <span className={`lc-bubble lc-bubble--${TONES[i % TONES.length]} lc-card-bubble`} aria-hidden="true">
                  {t.icon}
                </span>
                <span className="lc-card-name">{ar ? t.titleAr : t.titleEn}</span>
                <span className="lc-card-desc">{ar ? t.summaryAr : t.summaryEn}</span>
                <span className="tc-chip-row">
                  <span className="lc-card-chip">
                    <span>{t.steps.length} {ar ? 'خطوات' : 'steps'}</span>
                  </span>
                  <span className="lc-card-chip">
                    <span>{ar ? 'افتحي' : 'Open'}</span>
                    {/* The direction reading goes in, not a hard-coded right:
                        in Arabic "open" points left. */}
                    <BrandIcon name={ar ? 'back' : 'forward'} className="w-3.5 h-3.5" tone="transparent" />
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="lc-disclaimer">{disclaimer}</p>
        </section>
      </Chrome>
    );
  }

  // ── category grid ────────────────────────────────────────────────────────
  return (
    <Chrome ar={ar} title={screenTitle} backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'} homeBack onBackClick={onBack}>
      {/* Hero — the same white plate the parent home uses */}
      <section className="lc-hero">
        <div className="lc-hero-dots" aria-hidden="true" />
        <div className="lc-hero-grid">
          <div className="lc-hero-copy">
            <h1 className="lc-hero-title">
              <span aria-hidden="true">🏡 </span>
              {ar ? (
                <>أفكار <span className="lc-hero-mark">للبيت</span></>
              ) : (
                <>Home <span className="lc-hero-mark">Tips</span></>
              )}
            </h1>
            <p className="lc-hero-sub">
              {ar
                ? 'حاجات بسيطة تقدري تعمليها في يومكم العادي.'
                : 'Simple things you can do in your ordinary day together.'}
            </p>
          </div>
          <div className="lc-hero-mascot">
            <IrisBuddy mood="happy" />
          </div>
        </div>
      </section>

      <section className="lc-section">
        <div className="lc-grid lc-grid--parent">
          {HOME_TIP_CATEGORIES.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setCategory(c)}
              className="lc-card lc-card--section"
            >
              <span className={`lc-bubble lc-bubble--${TONES[i % TONES.length]} lc-card-bubble`} aria-hidden="true">
                {c.icon}
              </span>
              <span className="lc-card-name">{ar ? c.nameAr : c.nameEn}</span>
              <span className="lc-card-desc">
                {c.tips.length} {ar ? 'أفكار' : 'ideas'}
              </span>
              <span className="lc-card-chip">
                <span>{ar ? 'افتحي' : 'Open'}</span>
                <BrandIcon name={ar ? 'back' : 'forward'} className="w-3.5 h-3.5" tone="transparent" />
              </span>
            </motion.button>
          ))}
        </div>

        <p className="lc-disclaimer">{disclaimer}</p>
      </section>
    </Chrome>
  );
}
