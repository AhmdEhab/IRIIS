import React from 'react';
import { motion } from 'motion/react';
import { Home, Award, ChevronRight, Settings, LogOut, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { BrandIcon, type IconName, type BrandTone } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';
import { Blob, Sparkle } from '../landing/LandingDecor';
import { IrisBuddy } from './ui/IrisBuddy';
import '../landing-child.css';

/**
 * Parent Mode hub — the six sections a parent can reach.
 *
 * Re-skinned in the landing-page / child-mode design language: the same
 * cream polka-dot ground, floating blobs, glass header pills, a white
 * hero plate with the buddy, and pastel bubble cards. Copy, order and the
 * honest "Soon" badges are unchanged from the brochure — styling only.
 */
export function IrisParentHome({
  onProgress,
  onTips,
  onChat,
  onCommunity,
  onSpecialists,
  onSnapshot,
  onEnterChildMode,
  onSettings,
  onBack,
}: {
  onProgress: () => void;
  onTips: () => void;
  onChat: () => void;
  onCommunity: () => void;
  onSpecialists: () => void;
  onSnapshot: () => void;
  onEnterChildMode: () => void;
  onSettings: () => void;
  onBack: () => void;
}) {
  const { logoutUser, childProfile } = useApp();
  const { childName, stars } = useIris();
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  const name = childName || childProfile?.name || (ar ? 'طفلك' : 'your child');

  const sections: Array<{
    id: string;
    icon: IconName;
    tone: BrandTone;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    onClick: () => void;
    ready: boolean;
  }> = [
    {
      // The learning snapshot sits first: it answers the question a parent
      // actually arrives with — what can my child do right now — before the
      // session-by-session progress view answers what changed.
      id: 'snapshot',
      icon: 'sprout',
      tone: 'green',
      titleAr: 'لمحة عن التعلّم',
      titleEn: 'Learning Snapshot',
      descAr: 'اللي بيعرفه دلوقتي، واللي لسه بيتبني، والخطوة الجاية.',
      descEn: 'What he can do now, what is still building, and what comes next.',
      onClick: onSnapshot,
      ready: true,
    },
    {
      id: 'progress',
      icon: 'chart',
      tone: 'blue',
      titleAr: 'المتابعة والتقدّم',
      titleEn: 'Progress & Insights',
      descAr: 'إيه اللي بيتدرب عليه دلوقتي، وليه اتغيّر أي حاجة.',
      descEn: 'What he is practising now, and why anything changed.',
      onClick: onProgress,
      ready: true,
    },
    {
      id: 'tips',
      icon: 'house',
      tone: 'yellow',
      titleAr: 'أفكار للبيت',
      titleEn: 'Home Tips',
      descAr: 'حاجات بسيطة تعمليها معاه في اليوم العادي.',
      descEn: 'Simple things to do together in an ordinary day.',
      onClick: onTips,
      ready: true,
    },
    {
      id: 'chat',
      icon: 'chat',
      tone: 'purple',
      titleAr: 'اسألي IRIS',
      titleEn: 'Ask IRIS',
      descAr: 'أسئلة عن التعلّم — الأسئلة الطبية بتتحال لمختص.',
      descEn: 'Questions about learning — medical ones are referred to a professional.',
      onClick: onChat,
      ready: true,
    },
    {
      id: 'community',
      icon: 'family',
      tone: 'coral',
      titleAr: 'مجتمع الأهالي',
      titleEn: 'Parent Community',
      descAr: 'مساحة للأهالي — لسه مش مفتوحة.',
      descEn: 'A space for families — not open yet.',
      onClick: onCommunity,
      ready: false,
    },
    {
      id: 'specialists',
      icon: 'specialist',
      tone: 'blue',
      titleAr: 'التواصل مع المختصين',
      titleEn: 'Connect with Specialists',
      descAr: 'الطريق للمراجعة المهنية — لسه مش متاح.',
      descEn: 'The route to professional review — not available yet.',
      onClick: onSpecialists,
      ready: false,
    },
  ];

  return (
    <div className="lc-root" dir={ar ? 'rtl' : 'ltr'}>
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
            <span>{ar ? 'الرئيسية' : 'Home'}</span>
          </button>
          <div className="lc-header-side lc-header-side--parent">
            <ChromeActions />
            <span className="lc-pill lc-pill--yellow" role="status">
              <Award aria-hidden="true" />
              <span dir="ltr">{stars}</span>
            </span>
            <span className="lc-name-chip">{name}</span>
          </div>
        </div>
      </header>

      <main className="lc-main">
        {/* Hero — the same white plate the child greeting uses */}
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
                  <>متابعة <span className="lc-hero-mark">{name}</span></>
                ) : (
                  <><span className="lc-hero-mark">{name}</span>'s learning</>
                )}
              </h1>
              <p className="lc-hero-sub">
                {ar
                  ? 'كل حاجة عن تعلّمه في مكان واحد: التقدّم، أفكار للبيت، ودعم لطيف.'
                  : 'Everything about his learning in one place: progress, home ideas, and gentle support.'}
              </p>
              <div className="lc-hero-actions">
                <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onEnterChildMode}>
                  <Sparkles aria-hidden="true" />
                  <span>{ar ? 'وضع الطفل' : 'Child Mode'}</span>
                </button>
                <button type="button" className="lc-pill lc-pill--ghost" onClick={onSettings}>
                  <Settings aria-hidden="true" />
                  <span>{ar ? 'الإعدادات' : 'Settings'}</span>
                </button>
                <button type="button" className="lc-pill lc-pill--ghost" onClick={logoutUser}>
                  <LogOut aria-hidden="true" />
                  <span>{ar ? 'خروج' : 'Log out'}</span>
                </button>
              </div>
            </div>
            <div className="lc-hero-mascot">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </motion.section>

        {/* Sections */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
              <BrandIcon name="chart" className="w-7 h-7" tone="transparent" />
            </span>
            <h2 className="lc-section-title">{ar ? 'أقسام المتابعة' : 'Your sections'}</h2>
          </div>
          <div className="lc-grid lc-grid--parent">
            {sections.map((s, i) => (
              <motion.div
                key={s.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: i * 0.045 }}
              >
                <button type="button" className="lc-card lc-card--section" onClick={s.onClick}>
                  <span className={`lc-bubble lc-bubble--${s.tone} lc-card-bubble`} aria-hidden="true">
                    <BrandIcon name={s.icon} className="w-7 h-7" tone="transparent" />
                  </span>
                  <span className="lc-card-name">{ar ? s.titleAr : s.titleEn}</span>
                  <span className="lc-card-desc">{ar ? s.descAr : s.descEn}</span>
                  {s.ready ? (
                    <span className="lc-card-chip">
                      <span>{ar ? 'افتحي' : 'Open'}</span>
                      <ChevronRight aria-hidden="true" style={{ transform: ar ? 'scaleX(-1)' : undefined }} />
                    </span>
                  ) : (
                    <span className="lc-card-chip lc-card-chip--soon">
                      <span>{ar ? 'قريبًا' : 'Soon'}</span>
                    </span>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <p className="lc-disclaimer">
          {ar
            ? 'IRIS نموذج أولي مبني على إطار أدلة بحثي — لم تتم مراجعته من مختص بعد، ولا يقدّم تشخيصًا ولا نصيحة طبية.'
            : 'IRIS is a research-informed prototype — not yet specialist-reviewed, and it provides no diagnosis or medical advice.'}
        </p>
      </main>
    </div>
  );
}
