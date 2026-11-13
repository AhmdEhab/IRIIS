import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { listSpecialists, isDemoDirectory, type Specialist } from '../../data/directory';
import { Surface, SectionHeader, Pill, AvatarRing, type BrandTone } from './ui/brand';
import { Blob, DashedArc } from './ui/brand/Decor';
import { ScreenFrame, TopBar, DisplayTitle } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';

/**
 * Connect with Specialists — DEMO DIRECTORY.
 *
 * The long-term intent is: parent → specialist → professional review → future
 * validation of IRIS's own content. This screen now shows that pathway with
 * placeholder profiles so the shape is demonstrable.
 *
 * HARD HONESTY BOUNDARY — unchanged from the placeholder version
 * There are no real practitioners here. Every profile is a labelled demo, no
 * profile carries a credential, a rating, a review count or a years figure,
 * and nothing can be booked — `accepts_bookings` is false at the data layer,
 * not merely hidden in the markup. Inventing any of those would be fabricating
 * a medical credential, the single most harmful thing this product could do.
 *
 * The demo banner is not decoration. A directory of placeholder profiles that
 * does not say so is indistinguishable from a real one.
 */
export function IrisSpecialists({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  useEffect(() => {
    let alive = true;
    listSpecialists().then((rows) => { if (alive) setSpecialists(rows); });
    return () => { alive = false; };
  }, []);

  return (
    <ScreenFrame accent="blue" width="lg" tone="ground" topBar={
      <TopBar ar={ar} onBack={onBack} backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
        title={ar ? 'التواصل مع المختصين' : 'Specialists'} actions={<ChromeActions />} />
    }>
      <div className="space-y-6">
        {/* back moved into TopBar #0 */}

        <DisplayTitle size="title" arc>
          {ar ? 'التواصل مع المختصين' : 'Connect with Specialists'}
        </DisplayTitle>

        {/* The banner every parent must see before the first card. */}
        {isDemoDirectory() && (
          <Surface elevation="raised" className="p-5 border-brand-yellow">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">⚠️</span>
              <div>
                <h2 className="font-black text-ink mb-1">
                  {ar ? 'الملفات دي كلها تجريبية' : 'Every profile here is a demo'}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {ar
                    ? 'مفيش مختصين حقيقيين ولا مواعيد ولا حجز في النسخة دي. الملفات اللي تحت بتوضّح شكل الخدمة لما تفتح، وكل ملف مكتوب عليه إنه تجريبي. IRIS مش أداة طبية، ومش بيقدّم تشخيص ولا نصيحة طبية ولا علاج.'
                    : 'There are no real practitioners, no appointments and no booking in this version. The profiles below show the shape of the service once it opens, and each one is labelled as a demo. IRIS is not a medical tool: it gives no diagnosis, no medical advice and no treatment.'}
                </p>
              </div>
            </div>
          </Surface>
        )}

        <SectionHeader
          tone="green"
          eyebrow={ar ? 'الدليل' : 'Directory'}
          title={ar ? 'أنواع الدعم' : 'Kinds of support'}
        />

        <div className="grid gap-4">
          {specialists.map((s) => (
            <Surface key={s.id} elevation="raised" className="p-5">
              <div className="flex items-start gap-4">
                <AvatarRing tone={s.tone as BrandTone} size="md">
                  <span className="text-2xl" aria-hidden="true">{s.avatar_placeholder}</span>
                </AvatarRing>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-black text-ink">{ar ? s.name_ar : s.name_en}</h3>
                      <p className="text-sm text-ink-muted">{ar ? s.specialty_ar : s.specialty_en}</p>
                    </div>
                    {/* Status is a pill, not fine print. */}
                    <Pill tone="yellow">
                      {ar ? 'ملف تجريبي — غير موثّق' : 'Demo profile — not verified'}
                    </Pill>
                  </div>

                  <p className="text-sm text-ink-muted leading-relaxed">{ar ? s.bio_ar : s.bio_en}</p>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide text-ink-muted mb-1.5">
                      {ar ? 'بيساعد في' : 'Areas of support'}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(ar ? s.areas_ar : s.areas_en).map((area) => (
                        <span
                          key={area}
                          className="rounded-full bg-surface-sunk border border-hairline px-2.5 py-1 text-xs text-ink-muted"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <dl className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="font-black uppercase tracking-wide text-ink-muted">
                        {ar ? 'الخبرة' : 'Experience'}
                      </dt>
                      <dd className="text-ink-muted">{ar ? s.experience_ar : s.experience_en}</dd>
                    </div>
                    <div>
                      <dt className="font-black uppercase tracking-wide text-ink-muted">
                        {ar ? 'المواعيد' : 'Availability'}
                      </dt>
                      <dd className="text-ink-muted">{ar ? s.availability_ar : s.availability_en}</dd>
                    </div>
                  </dl>

                  {/* Disabled at the data layer (accepts_bookings === false), not
                      just visually — so no future refactor can accidentally
                      enable a booking against a profile that is not a person. */}
                  <button
                    type="button"
                    disabled={!s.accepts_bookings}
                    aria-disabled={!s.accepts_bookings}
                    className="rounded-full bg-surface-sunk border border-hairline px-4 py-2 text-sm font-bold text-ink-muted cursor-not-allowed"
                  >
                    {ar ? 'الحجز مش متاح في النسخة التجريبية' : 'Booking not available in the demo'}
                  </button>
                </div>
              </div>
            </Surface>
          ))}
        </div>

        <p className="t-small text-ink-muted leading-relaxed font-medium">
          {ar
            ? 'الهدف على المدى الطويل: الأهل → مختص → مراجعة مهنية لمحتوى IRIS → تحقق مستقبلي. المحتوى الحالي مبني على إطار أدلة بحثي ولم تتم مراجعته من مختص بعد.'
            : 'Long-term intent: parent → specialist → professional review of IRIS content → future validation. Current content is research-informed and not yet specialist-reviewed.'}
        </p>
      </div>
    </ScreenFrame>
  );
}
