import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../contexts/AppContext';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  ScreenFrame,
  TopBar,
  BarAction,
  ParentCard,
  Pill,
  StarCount,
  DisplayTitle,
  Button,
  type IconName,
  type BrandTone,
} from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';

/**
 * Parent Mode hub — the six sections a parent can reach.
 *
 * ── WHAT PHASE 10 CHANGED ─────────────────────────────────────────────────
 * D1 — "Log out" was `text-ink-muted` on the warm ground AND sat underneath
 *      the old floating GlobalControls pill. Between the two it was
 *      effectively invisible. It is now a normal control in the top bar, with
 *      full ink contrast, in a row that reserves its own space.
 * D10— the six section icons were emoji (🌱📊🏡💬👨‍👩‍👧🩺), which render as
 *      six different pieces of artwork depending on the operating system.
 *      They are drawn brand marks now.
 * The hand-rolled card markup is replaced by `ParentCard`, the component that
 * already existed for exactly this and had zero render sites — the brochure's
 * "WHAT WE DO?" tile, one-for-one.
 *
 * Nothing about the sections, their order, their copy or their readiness
 * badges changed. The honesty of "Soon" on Community and Specialists is a
 * substantive constraint, not styling.
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
    <ScreenFrame
      accent="blue"
      width="lg"
      tone="tint"
      topBar={
        <TopBar
          ar={ar}
          onBack={onBack}
          backLabel={ar ? 'الرئيسية' : 'Home'}
          actions={
            <>
              <StarCount count={stars} />
              <ChromeActions />
              {/* Was ink-faint under a floating overlay; now a real control. */}
              <BarAction onClick={onSettings}>{ar ? 'الإعدادات' : 'Settings'}</BarAction>
              <BarAction onClick={logoutUser}>{ar ? 'خروج' : 'Log out'}</BarAction>
            </>
          }
        />
      }
    >
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6 mt-1">
        <div className="min-w-0">
          <span className="t-label text-brand-blue-ink block mb-1">{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
          <DisplayTitle size="title" arc>
            {ar ? `متابعة ${name}` : `${name}'s learning`}
          </DisplayTitle>
        </div>
        <Button variant="primary" icon="child" onClick={onEnterChildMode}>
          {ar ? 'وضع الطفل' : 'Child Mode'}
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <motion.div
            key={s.id}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { delay: i * 0.045 }}
          >
            <ParentCard
              icon={s.icon}
              tone={s.tone}
              title={ar ? s.titleAr : s.titleEn}
              description={ar ? s.descAr : s.descEn}
              onClick={s.onClick}
              badge={!s.ready ? <Pill tone="yellow">{ar ? 'قريبًا' : 'Soon'}</Pill> : undefined}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>

      <p className="t-small text-ink-muted border-t border-hairline pt-4 mt-6 font-medium">
        {ar
          ? 'IRIS نموذج أولي مبني على إطار أدلة بحثي — لم تتم مراجعته من مختص بعد، ولا يقدّم تشخيصًا ولا نصيحة طبية.'
          : 'IRIS is a research-informed prototype — not yet specialist-reviewed, and it provides no diagnosis or medical advice.'}
      </p>
    </ScreenFrame>
  );
}
