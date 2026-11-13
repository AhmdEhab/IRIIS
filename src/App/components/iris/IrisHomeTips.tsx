import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HOME_TIP_CATEGORIES, type Tip, type TipCategory } from '../../content/homeTips';
import { ScreenFrame, TopBar, DisplayTitle } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';

/**
 * Home Tips — practical things a parent can do between sessions.
 *
 * Layout follows the original IRIS product: a category grid of vibrant tiles,
 * then an article-style card whose body is a numbered step list.
 *
 * CLAIMS DISCIPLINE
 * Every screen here states plainly that these are practical ideas, not therapy
 * and not a treatment plan, and that time suggestions are suggestions. See the
 * header of content/homeTips.ts for the specific research-document citations
 * behind that wording — in short, the corpus contains no learning-outcome data
 * for parent-coaching prompts and no dosage numbers of any kind, so neither is
 * claimed here.
 */
export function IrisHomeTips({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [category, setCategory] = useState<TipCategory | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const disclaimer = ar
    ? 'دي أفكار عملية للبيت — مش علاج ولا خطة علاجية، والأوقات المذكورة مجرد اقتراح.'
    : 'These are practical ideas for home — not therapy or a treatment plan, and any timings are only suggestions.';

  // ── one tip, opened ──────────────────────────────────────────────────────
  if (tip) {
    return (
      <ScreenFrame accent="yellow" width="md" tone="tint" topBar={
        <TopBar ar={ar} onBack={() => setTip(null)} backLabel={ar ? 'رجوع' : 'Back'}
          title={ar ? 'أفكار للبيت' : 'Home Tips'} actions={<ChromeActions />} />
      }>
        <div className="space-y-5">

          <div className="rounded-brand-lg bg-surface border border-hairline shadow-brand-sm overflow-hidden">
            <div className="bg-brand-blue-ink text-white p-6">
              <div className="text-4xl mb-2" aria-hidden="true">{tip.icon}</div>
              <h1 className="text-2xl font-black">{ar ? tip.titleAr : tip.titleEn}</h1>
              <p className="text-brand-purple-ink mt-1">{ar ? tip.summaryAr : tip.summaryEn}</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-ink-muted">
                ⏱️ {ar ? tip.minutesAr : tip.minutesEn}
              </p>

              <ol className="space-y-3">
                {tip.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-brand bg-ground-tint p-4">
                    <span
                      className="shrink-0 w-8 h-8 rounded-full bg-brand-blue-ink text-white font-black flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="text-ink leading-relaxed pt-1">{ar ? s.ar : s.en}</span>
                  </li>
                ))}
              </ol>

              <p className="text-xs text-ink-muted border-t border-hairline pt-4">{disclaimer}</p>
            </div>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  // ── one category ─────────────────────────────────────────────────────────
  if (category) {
    return (
      <ScreenFrame accent="yellow" width="md" tone="tint" topBar={
        <TopBar ar={ar} onBack={() => setCategory(null)} backLabel={ar ? 'كل الأقسام' : 'All categories'}
          title={ar ? 'أفكار للبيت' : 'Home Tips'} actions={<ChromeActions />} />
      }>
        <div className="space-y-5">

          <h1 className="text-3xl font-black text-ink">
            <span aria-hidden="true">{category.icon}</span>{' '}
            {ar ? category.nameAr : category.nameEn}
          </h1>

          <div className="space-y-4">
            {category.tips.map((t) => (
              <button
                key={t.id}
                onClick={() => setTip(t)}
                className="w-full text-start rounded-brand bg-surface border border-hairline shadow-brand-sm p-5 hover:border-hairline transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden="true">{t.icon}</span>
                  <span className="flex-1">
                    <span className="block text-lg font-black text-ink">
                      {ar ? t.titleAr : t.titleEn}
                    </span>
                    <span className="block text-ink-muted text-sm mt-1">
                      {ar ? t.summaryAr : t.summaryEn}
                    </span>
                    <span className="block text-xs text-ink-muted mt-2">
                      {t.steps.length} {ar ? 'خطوات' : 'steps'}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-muted">{disclaimer}</p>
        </div>
      </ScreenFrame>
    );
  }

  // ── category grid ────────────────────────────────────────────────────────
  return (
    <ScreenFrame accent="yellow" width="lg" tone="tint" topBar={
        <TopBar ar={ar} onBack={onBack} backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
          title={ar ? 'أفكار للبيت' : 'Home Tips'} actions={<ChromeActions />} />
      }>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-black text-ink">
            🏡 {ar ? 'أفكار للبيت' : 'Home Tips'}
          </h1>
          <p className="text-ink-muted mt-2">
            {ar
              ? 'حاجات بسيطة تقدري تعمليها في يومكم العادي.'
              : 'Simple things you can do in your ordinary day together.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOME_TIP_CATEGORIES.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setCategory(c)}
              className="rounded-brand-lg bg-surface border border-hairline shadow-brand-sm p-5 text-start hover:border-hairline transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
            >
              <div
                className={`w-14 h-14 rounded-brand bg-surface-sunk ${c.color}
                  flex items-center justify-center text-3xl mb-3`}
                aria-hidden="true"
              >
                {c.icon}
              </div>
              <div className="font-black text-ink">{ar ? c.nameAr : c.nameEn}</div>
              <div className="text-sm text-ink-muted mt-1">
                {c.tips.length} {ar ? 'أفكار' : 'ideas'}
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-ink-muted border-t border-hairline pt-4">{disclaimer}</p>
      </div>
    </ScreenFrame>
  );
}
