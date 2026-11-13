import React from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Surface,
  SectionHeader,
  Pill,
  ScreenFrame,
  TopBar,
  DisplayTitle,
  Button,
  StepDisc,
  BrandIcon,
  EmptyState,
  ErrorState,
  type BrandTone,
} from './ui/brand';
import { Star } from './ui/brand/Decor';
import { ChromeActions } from './ui/ChromeActions';
import { IrisBuddy } from './ui/IrisBuddy';

/**
 * Parent Mode — the learning snapshot from the ladder assessment.
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
    <li className="py-2.5 border-b border-hairline-soft last:border-0">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-ink font-bold">{ar ? item.nameAr : item.nameEn}</span>
        <ValueChip value={item.value} notMeasured={item.not_measured} />
      </div>
      {/* Beside the number, never in a footnote. */}
      {item.caveat && (
        <p className="mt-1 t-small text-brand-yellow-ink leading-relaxed">
          ⓘ {ar ? item.caveat.ar : item.caveat.en}
        </p>
      )}
      {item.floor && (
        <p className="mt-1 t-small text-ink-muted leading-relaxed font-medium">
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
  const ar = language === 'ar';

  if (!learningSnapshot) {
    return (
      <div className="min-h-screen bg-ground p-6 pt-20 sm:pt-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <button
            onClick={onBack}
            className="rounded-brand bg-surface border-2 border-hairline px-5 py-3 font-bold text-ink-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
          >
            {ar ? '→ وضع الوالدين' : '← Parent Mode'}
          </button>
          <Surface elevation="raised" className="p-6 text-center space-y-3">
            <div className="text-5xl" aria-hidden="true">📋</div>
            <p className="text-ink-muted leading-relaxed">
              {ar
                ? 'لسه مفيش تقييم. لما الطفل يخلّص أنشطة التعرّف، هتلاقي هنا لمحة عن اللي بيعرفه دلوقتي.'
                : 'No assessment yet. Once your child finishes the getting-to-know activities, a snapshot of what they can do now will appear here.'}
            </p>
            {onStart && (
              <Button variant="play" size="lg" icon="play" onClick={onStart}>
                {ar ? 'ابدأ أنشطة التعرّف' : 'Start the getting-to-know activities'}
              </Button>
            )}
          </Surface>
        </div>
      </div>
    );
  }

  const s = learningSnapshot;

  return (
    <ScreenFrame accent="blue" width="md" topBar={<SnapshotBar ar={ar} onBack={onBack} />}>
      <div className="space-y-5">
        <DisplayTitle size="title" arc>
          {ar ? s.headline.ar : s.headline.en}
        </DisplayTitle>

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
        <Surface elevation="flat" tone={s.confidence.level === 'HIGH' ? 'green' : 'blue'} className="p-4">
          <p className="text-sm text-ink leading-relaxed">{ar ? s.confidence.ar : s.confidence.en}</p>
        </Surface>

        <Surface elevation="raised" className="p-5">
          <SectionHeader tone="green" eyebrow={ar ? 'النهارده' : 'Today'} title={ar ? s.strengths.labelAr : s.strengths.labelEn} />
          <p className="text-sm text-ink-muted leading-relaxed mb-2">{ar ? s.strengths.introAr : s.strengths.introEn}</p>
          <ul>{s.strengths.items.map((i: any) => <SkillRow key={i.strand} item={i} ar={ar} />)}</ul>
        </Surface>

        <Surface elevation="raised" className="p-5">
          <SectionHeader tone="coral" eyebrow={ar ? 'بيتبني' : 'Building'} title={ar ? s.developing.labelAr : s.developing.labelEn} />
          <p className="text-sm text-ink-muted leading-relaxed mb-2">{ar ? s.developing.introAr : s.developing.introEn}</p>
          <ul>{s.developing.items.map((i: any) => <SkillRow key={i.strand} item={i} ar={ar} />)}</ul>
        </Surface>

        <Surface elevation="raised" className="p-5">
          <SectionHeader tone="blue" eyebrow={ar ? 'الأولويات' : 'Priorities'} title={ar ? s.next_focus.labelAr : s.next_focus.labelEn} />
          {/* The brochure numbers an ordered list with coloured discs, not
              with "1." in the running text. Same information, and the order
              survives being skim-read. */}
          <ol className="space-y-2.5 mt-3">
            {s.next_focus.items.map((n: any) => (
              <li key={n.strand} className="flex items-start gap-3">
                <StepDisc n={n.order} />
                <span className="flex-1 pt-1 t-body text-ink">{ar ? n.nameAr : n.nameEn}</span>
              </li>
            ))}
          </ol>
        </Surface>

        <Surface elevation="flat" tone="yellow" className="p-4">
          <h3 className="text-xs font-black uppercase tracking-wide text-brand-yellow-ink mb-1.5">
            {ar ? s.practice.labelAr : s.practice.labelEn}
          </h3>
          <p className="text-sm text-ink">{ar ? s.practice.ar : s.practice.en}</p>
        </Surface>

        <Surface elevation="raised" className="p-5">
          <SectionHeader tone="purple" eyebrow={ar ? 'في البيت' : 'At home'} title={ar ? s.what_to_observe.labelAr : s.what_to_observe.labelEn} />
          <ul className="space-y-2 mt-2">
            {s.what_to_observe.items.map((w: any) => (
              <li key={w.strand} className="flex items-start gap-2 text-sm text-ink-muted leading-relaxed">
                <Star className="w-3.5 h-3.5 mt-1 shrink-0" />
                {/* Arabic letter examples appear inside English sentences here.
                    Without bidi isolation the browser reorders the glyphs and
                    "ب ت ث" renders backwards to an Arabic reader. */}
                <span dir="auto" style={{ unicodeBidi: 'isolate' }}>{ar ? w.ar : w.en}</span>
              </li>
            ))}
          </ul>
        </Surface>

        {s.not_measured.strands.length > 0 && (
          <Surface elevation="flat" className="p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-ink-muted mb-1.5">
              {ar ? s.not_measured.labelAr : s.not_measured.labelEn}
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed mb-2">
              {ar ? s.not_measured.noteAr : s.not_measured.noteEn}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {s.not_measured.strands.map((n: any) => (
                <span key={n.strand} className="rounded-full bg-surface-sunk border border-hairline px-2.5 py-1 text-xs text-ink-muted">
                  {ar ? n.nameAr : n.nameEn}
                </span>
              ))}
            </div>
          </Surface>
        )}

        {/* The plan is shown so the assessment visibly leads somewhere — an
            assessment that ends at a results page is the thing §19 rules out. */}
        {ladderPlan?.blueprint?.activities?.length > 0 && (
          <Surface elevation="raised" className="p-5">
            <SectionHeader tone="green" eyebrow={ar ? 'الجاي' : 'Coming up'} title={ar ? 'الأنشطة اللي هيشتغل عليها' : 'What he will work on'} />
            <ul className="space-y-1.5 mt-2">
              {ladderPlan.blueprint.activities.map((a: any) => (
                <li key={a.strand} className="text-sm text-ink-muted">
                  {ar ? a.strand_name_ar : a.strand_name_en}
                </li>
              ))}
            </ul>
            {/* The plan has to be playable, or the assessment ends at a
                results page and no practice ever reaches the skill estimate. */}
            {onPractise && (
              <Button variant="play" size="lg" full icon="play" onClick={onPractise} className="mt-4">
                {ar ? 'ابدأ التدريب' : 'Start practice'}
              </Button>
            )}
          </Surface>
        )}

        <p className="t-small text-ink-muted leading-relaxed font-medium">
          {ar ? s.disclaimer.ar : s.disclaimer.en}
        </p>
      </div>
    </ScreenFrame>
  );
}

/** One bar for both the empty and the populated state, so they cannot drift. */
function SnapshotBar({ ar, onBack }: { ar: boolean; onBack: () => void }) {
  return (
    <TopBar
      ar={ar}
      onBack={onBack}
      backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
      title={ar ? 'لمحة عن التعلّم' : 'Learning Snapshot'}
      actions={<ChromeActions />}
    />
  );
}
