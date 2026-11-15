import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { listSpecialists, isDemoDirectory, type Specialist } from '../../data/directory';
import { BrandIcon, Button, EmptyState, ErrorState, type BrandTone } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';
import { Blob, Sparkle } from '../landing/LandingDecor';
import { IrisBuddy } from './ui/IrisBuddy';
import '../landing-child.css';
import '../parent-community-landing.css';

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
 *
 * ── WHY THERE ARE NOW THREE LOAD PHASES ──────────────────────────────────
 * `listSpecialists()` used to be a `.then` with no `.catch` and no waiting
 * state, so an unreachable directory rendered as a page with no specialists
 * on it. To a parent that reads as "nobody is registered to help my child",
 * which is a claim about the world, not about the network. The three states
 * are now named: loading, ready, failed — and a failure offers a retry that
 * re-runs the same loader.
 *
 * Re-skinned in the landing / parent-home design language (lc-* classes):
 * copy, order, the disabled booking state and every honesty label are
 * unchanged — styling only.
 */
export function IrisSpecialists({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const reduceMotion = useReducedMotion();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');

  /** One `alive` flag per attempt, so a slow retry can never land on top of a
   *  fresher result, and unmounting cancels whatever is in flight. */
  const cancelRef = useRef<() => void>(() => {});

  const load = useCallback(() => {
    cancelRef.current();
    let alive = true;
    cancelRef.current = () => { alive = false; };

    setPhase('loading');
    listSpecialists()
      .then((rows) => {
        if (!alive) return;
        setSpecialists(rows);
        setPhase('ready');
      })
      .catch(() => {
        if (alive) setPhase('error');
      });
  }, []);

  useEffect(() => {
    load();
    return () => { cancelRef.current(); };
  }, [load]);

  return (
    <div className="lc-root pc-scope" dir={ar ? 'rtl' : 'ltr'}>
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
          <div className="lc-header-side">
            <ChromeActions />
            <span className="lc-name-chip">{ar ? 'التواصل مع المختصين' : 'Specialists'}</span>
          </div>
        </div>
      </header>

      <main className="lc-main">
        {/* The banner every parent must see before the first card — now the
            hero plate itself, with the exact same honesty text. */}
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
                {ar ? (
                  <>التواصل مع <span className="lc-hero-mark">المختصين</span></>
                ) : (
                  <>Connect with <span className="lc-hero-mark">Specialists</span></>
                )}
              </h1>
              {isDemoDirectory() && (
                <div className="pc-demo-note">
                  <span className="pc-demo-emoji" aria-hidden="true">⚠️</span>
                  <div>
                    <h2 className="pc-demo-title">
                      {ar ? 'الملفات دي كلها تجريبية' : 'Every profile here is a demo'}
                    </h2>
                    <p className="pc-demo-text">
                      {ar
                        ? 'مفيش مختصين حقيقيين ولا مواعيد ولا حجز في النسخة دي. الملفات اللي تحت بتوضّح شكل الخدمة لما تفتح، وكل ملف مكتوب عليه إنه تجريبي. IRIS مش أداة طبية، ومش بيقدّم تشخيص ولا نصيحة طبية ولا علاج.'
                        : 'There are no real practitioners, no appointments and no booking in this version. The profiles below show the shape of the service once it opens, and each one is labelled as a demo. IRIS is not a medical tool: it gives no diagnosis, no medical advice and no treatment.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="lc-hero-mascot">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </motion.section>

        {/* ── Still fetching ───────────────────────────────────────────────── */}
        {phase === 'loading' && (
          <div className="pc-state" role="status" aria-live="polite">
            <span className="pc-spin" aria-hidden="true" />
            <p className="pc-state-text">
              {ar ? 'بنلمّ ملفات المختصين…' : 'Gathering the specialist profiles…'}
            </p>
          </div>
        )}

        {/* ── The fetch failed ─────────────────────────────────────────────── */}
        {phase === 'error' && (
          <ErrorState
            title={ar ? 'مفيش اتصال بالدليل' : 'The directory could not be reached'}
            body={
              ar
                ? 'الخدمة أو الشبكة رفضوا دلوقتي. مفيش حاجة اتغيّرت من ناحيتك — جرّبي تاني.'
                : 'The service or the network said no just now. Nothing of yours changed — try again.'
            }
            action={
              <Button variant="secondary" size="sm" onClick={load}>
                {ar ? 'حاولي تاني' : 'Try again'}
              </Button>
            }
          />
        )}

        {phase === 'ready' && (
          <section className="lc-section">
            <div className="lc-section-head">
              <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
                <BrandIcon name="specialist" className="w-7 h-7" tone="transparent" />
              </span>
              <div>
                <span className="pc-eyebrow pc-eyebrow--blue">{ar ? 'الدليل' : 'Directory'}</span>
                <h2 className="lc-section-title">{ar ? 'أنواع الدعم' : 'Kinds of support'}</h2>
              </div>
            </div>

            {specialists.length === 0 ? (
              /* An empty directory is said out loud rather than drawn as a
                 blank field. */
              <EmptyState
                className="pc-empty"
                illustration={<IrisBuddy mood="listening" />}
                title={ar ? 'الدليل فاضي دلوقتي' : 'The directory is empty right now'}
                body={
                  ar
                    ? 'مفيش ملفات مختصين معروضة دلوقتي. المساحة لسه بتتبني، وكل ملف حقيقي هيوصل هنا مراجعة مهنية أولاً.'
                    : 'No specialist profiles are listed right now. This space is still being built, and every real profile will arrive through a professional review first.'
                }
              />
            ) : (
              <div className="pc-stack" role="list" aria-label={ar ? 'قائمة المختصين' : 'Specialist list'}>
                {specialists.map((s, i) => {
                  const tone = s.tone as BrandTone;
                  return (
                    <motion.article
                      key={s.id}
                      role="listitem"
                      className="pc-plate pc-spec"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { delay: i * 0.045 }}
                    >
                      <span className={`lc-bubble pc-spec-avatar lc-bubble--${tone}`} aria-hidden="true">
                        {s.avatar_placeholder}
                      </span>

                      <div className="pc-spec-main">
                        <div className="pc-row-head">
                          <div>
                            <h3 className="pc-title">{ar ? s.name_ar : s.name_en}</h3>
                            <p className="pc-specialty">{ar ? s.specialty_ar : s.specialty_en}</p>
                          </div>
                          {/* Status is a chip, not fine print — the same yellow
                              "demo" language as every closed feature. */}
                          <span className="lc-card-chip lc-card-chip--soon">
                            {ar ? 'ملف تجريبي — غير موثّق' : 'Demo profile — not verified'}
                          </span>
                        </div>

                        <p className="pc-text">{ar ? s.bio_ar : s.bio_en}</p>

                        <div>
                          <h4 className="pc-sub-label">{ar ? 'بيساعد في' : 'Areas of support'}</h4>
                          <div className="pc-chips" role="list" aria-label={ar ? 'مجالات الدعم' : 'Areas of support'}>
                            {(ar ? s.areas_ar : s.areas_en).map((area) => (
                              <span key={area} role="listitem" className="lc-card-chip pc-area">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>

                        <dl className="pc-dl">
                          <div>
                            <dt className="pc-sub-label">{ar ? 'الخبرة' : 'Experience'}</dt>
                            <dd>{ar ? s.experience_ar : s.experience_en}</dd>
                          </div>
                          <div>
                            <dt className="pc-sub-label">{ar ? 'المواعيد' : 'Availability'}</dt>
                            <dd>{ar ? s.availability_ar : s.availability_en}</dd>
                          </div>
                        </dl>

                        {/* Disabled at the data layer (accepts_bookings === false),
                            not just visually — so no future refactor can
                            accidentally enable a booking against a profile that is
                            not a person. Styled as a closed "soon" chip. */}
                        <div className="pc-book">
                          <button
                            type="button"
                            disabled={!s.accepts_bookings}
                            aria-disabled={!s.accepts_bookings}
                            className="lc-card-chip lc-card-chip--soon pc-book-chip"
                          >
                            {ar ? 'الحجز مش متاح في النسخة التجريبية' : 'Booking not available in the demo'}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <p className="lc-disclaimer">
          {ar
            ? 'الهدف على المدى الطويل: الأهل → مختص → مراجعة مهنية لمحتوى IRIS → تحقق مستقبلي. المحتوى الحالي مبني على إطار أدلة بحثي ولم تتم مراجعته من مختص بعد.'
            : 'Long-term intent: parent → specialist → professional review of IRIS content → future validation. Current content is research-informed and not yet specialist-reviewed.'}
        </p>
      </main>
    </div>
  );
}
