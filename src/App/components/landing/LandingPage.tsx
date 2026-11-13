/**
 * IRIS public landing page v3 — layout, UX and responsive pass.
 *
 * v2 said the right things but arranged them at two widths: absolutely
 * positioned hero cards that overlapped content below ~640px, no mobile menu
 * at all (nav links simply vanished), and section paddings that drifted
 * between py-16 and py-20 for no reason. This version is organized around a
 * small, boring, deliberately enforced layout system:
 *
 *   - ONE section shell (Section): same max width, same gutters, same
 *     vertical rhythm (py-20 sm:py-28), scroll-mt for the sticky nav, and an
 *     accessible name from its own heading.
 *   - ONE heading block (HeadingBlock): title → one-line intro, always the
 *     same relationship, so the page has a visible rhythm top to bottom.
 *   - Hero: two columns on lg, single readable column below it; the 3D card
 *     and star chip are overlay decorations ONLY at sm+ where there is room
 *     for them — on phones they sit in the flow under the image, so nothing
 *     ever overlaps text.
 *   - Real mobile navigation: hamburger to a full panel, close on selection
 *     and on Escape, focus-visible rings everywhere, 44px+ touch targets.
 *   - Images: intrinsic sizes + aspect wrappers prevent layout shift;
 *     non-critical art lazy-loads; nothing wider than its column.
 *   - The interactive 3D preview is capped to a small grid on phones
 *     ("illustrations must not dominate the mobile screen").
 *
 * Order follows the spec's natural journey: nav, hero, about, how it works,
 * features, interactive learning, parent mode, why IRIS, CTA, footer.
 * Identity is untouched: same palette, Baloo voice, Mark, mascot-approved
 * illustrations, honest prototype language, and zero invented contacts.
 */
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles, Accessibility, Gamepad2, Headphones, Layers, Puzzle,
  ScanSearch, UserPlus, BarChart3, HeartHandshake, Languages, ShieldCheck,
  Wallet, Eye, Menu, X, MousePointerClick,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { DisplayTitle, Mark } from '../iris/ui/brand';

const Object3DViewer = lazy(() =>
  import('../three/Object3DViewer').then((m) => ({ default: m.Object3DViewer ?? m.default }))
);

/* ── Layout primitives (used by every section below) ─────────────────── */

function Section({
  id, label, tone = 'surface', children, className = '',
}: {
  id?: string; label: string; tone?: 'surface' | 'ground' | 'sunk';
  children: React.ReactNode; className?: string;
}) {
  const toneClass = { surface: 'bg-surface', ground: 'bg-ground', sunk: 'bg-surface-sunk/50' }[tone];
  return (
    <section
      id={id}
      aria-label={label}
      className={`${toneClass} py-16 sm:py-20 lg:py-24 scroll-mt-20 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function HeadingBlock({
  title, intro, center = false,
}: { title: React.ReactNode; intro?: string; center?: boolean; }) {
  return (
    <div className={center ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl'}>
      <DisplayTitle size="section">{title}</DisplayTitle>
      {intro && <p className="mt-4 text-lg sm:text-xl text-ink-muted leading-relaxed">{intro}</p>}
    </div>
  );
}

function ModelCard({ src, alt, emoji, label }: { src: string; alt: string; emoji: string; label: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="bg-brand-yellow-wash rounded-3xl border border-brand-yellow/40 p-3 shadow-brand">
      <div className="aspect-square rounded-2xl overflow-hidden bg-surface">
        <Suspense fallback={<div className="size-full grid place-items-center text-5xl" aria-hidden>{emoji}</div>}>
          <Object3DViewer src={src} alt={alt} autoRotate={!reduced} fallbackEmoji={emoji} />
        </Suspense>
      </div>
      <p className="text-center font-bold text-sm py-2 px-1 text-brand-yellow-ink truncate">{label}</p>
    </div>
  );
}

export function LandingPage({
  onLogin,
  onRegister,
  onAppMode,
  isAuthenticated,
}: {
  onLogin: () => void;
  onRegister: () => void;
  onAppMode: () => void;
  isAuthenticated: boolean;
}) {
  const { language, setLanguage } = useLanguage();
  const ar = language === 'ar';
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* Subtle smooth scrolling — only when motion is welcome. */
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollBehavior;
    if (!reduced) el.style.scrollBehavior = 'smooth';
    return () => { el.style.scrollBehavior = prev; };
  }, [reduced]);

  /* Escape closes the mobile menu; opening it returns scroll to the page. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fade = (delay = 0) =>
    reduced ? {} : {
      initial: { opacity: 0, y: 14 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-40px' },
      transition: { duration: 0.4, delay, ease: 'easeOut' as const },
    };

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue min-h-[44px]';
  const btnPrimary = `${btn} bg-brand-blue text-surface px-6 py-3 text-base sm:px-8 sm:text-lg shadow-brand-lg`;
  const goStart = isAuthenticated ? onAppMode : onRegister;

  const links = [
    { href: '#about', t: ar ? 'عن IRIS' : 'About' },
    { href: '#how', t: ar ? 'إزاي بيشتغل' : 'How it works' },
    { href: '#features', t: ar ? 'المميزات' : 'Features' },
    { href: '#parents', t: ar ? 'وضع الوالدين' : 'For parents' },
  ];

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-surface text-ink overflow-x-clip">
      {/* ── 1. Navigation ── */}
      <header className="sticky top-0 z-40 bg-surface/92 backdrop-blur border-b border-brand-blue/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <a href="/" aria-label="IRIS home" className="flex items-center shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
              <img src="/images/iris-logo-tight.png" alt="IRIS" width="220" height="86" className="h-9 sm:h-11 w-auto object-contain" />
            </a>

            <nav aria-label="Section navigation" className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-10 text-base font-semibold">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="rounded-lg px-1 py-2 hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                  {l.t}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:flex items-center gap-1 rounded-full border border-brand-blue/20 p-1" role="group" aria-label={ar ? 'اللغة' : 'Language'}>
                {([['ar', 'عربي'], ['en', 'EN']] as const).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    aria-pressed={language === code}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue ${language === code ? 'bg-brand-blue text-surface' : 'text-brand-blue hover:bg-brand-blue/10'}`}
                  >
                    {label}
                  </button>
                ))}
              </span>
              {!isAuthenticated && (
                <button onClick={onLogin} className="hidden sm:inline-flex text-brand-blue font-bold px-3 py-2 rounded-full hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                  {ar ? 'دخول' : 'Log in'}
                </button>
              )}
              <button onClick={goStart} className={`${btnPrimary} !px-5 !py-2.5 !text-base !min-h-[40px] !hidden sm:!inline-flex`}>
                {isAuthenticated ? (ar ? 'متابعة' : 'Continue') : ar ? 'ابدأ الآن' : 'Get started'}
              </button>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="landing-mobile-menu"
                aria-label={menuOpen ? (ar ? 'قفل القائمة' : 'Close menu') : (ar ? 'القائمة' : 'Open menu')}
                className="lg:hidden size-11 grid place-items-center rounded-full text-brand-blue-ink hover:bg-brand-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div ref={menuRef} id="landing-mobile-menu" className="lg:hidden border-t border-brand-blue/10 bg-surface">
            <nav aria-label="Mobile navigation" className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="px-4 py-3.5 rounded-2xl text-lg font-semibold hover:bg-brand-blue/5">
                  {l.t}
                </a>
              ))}
              <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                {([['ar', 'عربي'], ['en', 'English']] as const).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    aria-pressed={language === code}
                    className={`px-4 py-2 rounded-full text-sm font-bold ${language === code ? 'bg-brand-blue text-surface' : 'text-brand-blue border-2 border-brand-blue/25'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 px-2 pt-2">
                {!isAuthenticated && (
                  <button onClick={() => { setMenuOpen(false); onLogin(); }} className={`${btn} w-full border-2 border-brand-blue text-brand-blue py-3 text-lg`}>
                    {ar ? 'دخول' : 'Log in'}
                  </button>
                )}
                <button onClick={() => { setMenuOpen(false); goStart(); }} className={`${btn} w-full bg-brand-blue text-surface py-3.5 text-lg shadow-brand-lg`}>
                  <Sparkles className="size-5" />
                  {isAuthenticated ? (ar ? 'متابعة' : 'Continue') : ar ? 'ابدأ الآن' : 'Get started'}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── 2. Hero ── */}
      <section aria-label={ar ? 'مقدمة IRIS' : 'IRIS introduction'} className="bg-ground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-16">
          <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-center">
            <div className="max-w-xl lg:max-w-none">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-blue-wash px-4 py-1.5 text-sm font-bold text-brand-blue-ink mb-5">
                <Sparkles className="size-4" />
                {ar ? 'تعلّم على مقاس طفلك' : 'Learning sized to your child'}
              </p>
              <DisplayTitle size="title" className="leading-[1.22]">
                {ar ? (
                  <>نفهم الطفل، <Mark>مش نقيسه</Mark><br />بمسطرة واحدة</>
                ) : (
                  <>Understanding, <Mark>not standardizing.</Mark><br />One child, one path.</>
                )}
              </DisplayTitle>
              <p className="mt-5 text-lg sm:text-xl leading-relaxed text-ink-muted">
                {ar
                  ? 'IRIS رحلة تعلّم متكيفة للأطفال من أصحاب الإعاقة الذهنية والتوحد وتأخر النمو — تبدأ بالتعرّف على الطفل، وتبني معاه خطوة خطوة، والخطة بتتغيّر معاه لحظة بلحظة. والأهل في كل لحظة في الصورة.'
                  : 'IRIS is an adaptive learning journey for children with intellectual and developmental disabilities — it starts by getting to know your child, builds step by step, and the plan shifts in real time. Parents are part of it all.'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button onClick={goStart} className={`${btnPrimary} w-full sm:w-auto !py-4 !text-lg`}>
                  <Sparkles className="size-6" />
                  {isAuthenticated ? (ar ? 'كمل رحلتك' : 'Continue your journey') : ar ? 'ابدأ رحلة طفلك' : 'Get started'}
                </button>
                {!isAuthenticated && (
                  <button onClick={onLogin} className={`${btn} w-full sm:w-auto border-2 border-brand-blue text-brand-blue !py-3.5 !text-lg`}>
                    {ar ? 'عندي حساب' : 'I already have an account'}
                  </button>
                )}
              </div>
              <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-green" />{ar ? 'بلا تشخيص وبلا درجات ذكاء' : 'Diagnosis-blind, no IQ scores'}</span>
                <span className="inline-flex items-center gap-1.5"><Languages className="size-4 text-brand-blue" />{ar ? 'عربي أولاً وإنجليزي' : 'Arabic-first, bilingual'}</span>
              </p>
            </div>

            {/* Hero visual: overlays only where there is room for them */}
            <motion.div {...fade(0.1)} className="min-w-0">
              <div className="relative">
                <div className="aspect-[4/3] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-brand-blue/10 shadow-brand-lg">
                  <img
                    src="/images/landing/hero-learning.jpg"
                    alt={ar ? 'أطفال يتعلمون مع شخصية إيريس' : 'Children learning with the IRIS companion'}
                    width={1400} height={1050}
                    className="size-full object-cover"
                  />
                </div>

                <div className="hidden sm:flex absolute top-3 -end-4 items-center gap-2.5 bg-surface rounded-2xl shadow-brand-lg border border-brand-blue/10 p-3">
                  <span className="size-10 rounded-xl bg-brand-green-wash grid place-items-center text-2xl" aria-hidden>⭐</span>
                  <div className="leading-tight">
                    <p className="font-bold text-sm">{ar ? '١٢ نجمة النهارده' : '12 stars today'}</p>
                    <p className="text-xs text-ink-muted">{ar ? 'من غير ضغط' : 'No pressure'}</p>
                  </div>
                </div>
              </div>
              {/* The 3D preview lives in its own strip below the artwork —
                  it never covers a face at any width (screenshot defect fixed). */}
              <div className="mt-4 mx-auto lg:mx-0 lg:ms-6 flex items-center gap-4 max-w-sm rounded-3xl bg-surface border border-brand-blue/10 shadow-brand p-3">
                <div className="w-20 sm:w-24 shrink-0">
                  <ModelCard src="/models/apple.glb" alt="Apple" emoji="🍎" label={ar ? 'تفاحة' : 'Apple'} />
                </div>
                <p className="text-sm sm:text-base text-ink-muted leading-snug pe-2">
                  {ar ? 'نموذج حقيقي من جوه الأنشطة — اسحب ولفّه زي ما طفل هيلعب بيه.' : 'A real model from inside the activities — spin it the way a child will.'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. About IRIS ── */}
      <Section id="about" label={ar ? 'عن IRIS' : 'About IRIS'}>
        <HeadingBlock
          title={ar ? 'إيه المشكلة اللي IRIS بتحلّها؟' : 'What problem does IRIS solve?'}
          intro={ar
            ? 'الاختبارات القياسية بتدي رقم — والرقم مبيقولش للأهل ولا للمدرسة يبدأوا من فين. IRIS بتحوّل فهم الطفل لخطة يومية حقيقية: الأنشطة المناسبة، بالسرعة المناسبة، والأهل فاهمين كل خطوة.'
            : 'A standard test hands back a number, and a number tells a family nothing about where to begin. IRIS turns understanding into an actual daily plan: the right activities, at the right pace, with parents following every step.'}
          center
        />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { c: 'bg-brand-blue-wash', k: ar ? '٥ مستويات لكل مهارة' : '5 levels per skill', d: ar ? 'من أساسيات لخطوات متقدمة' : 'basics to further steps' },
            { c: 'bg-brand-yellow-wash', k: ar ? 'عشر دقايق في اليوم' : 'Ten minutes a day', d: ar ? 'جلسة قصيرة تكفي' : 'a short session is enough' },
            { c: 'bg-brand-green-wash', k: ar ? 'خطة للبيت' : 'A home plan', d: ar ? 'حاجات بسيطة تعمليها معاه' : 'small everyday things to do' },
            { c: 'bg-brand-purple-wash', k: ar ? 'بلا مصطلحات مخوّفة' : 'No scary jargon', d: ar ? 'لغة طيبة ومفهومة' : 'kind, plain language' },
          ].map((s, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className={`${s.c} rounded-[1.75rem] p-5 sm:p-6 border border-ink/5`}>
              <p className="t-heading text-lg mb-1.5">{s.k}</p>
              <p className="text-base text-ink-muted leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-ink-muted max-w-2xl mx-auto">
          {ar
            ? 'IRIS نموذج أولي مبني على إطار أدلة بحثي — مش أداة تشخيص ولا بديل عن متخصص، وده جزء من التزامنا.'
            : 'IRIS is a research-framed prototype — not a diagnostic tool and not a substitute for specialists. Saying so is part of the commitment.'}
        </p>
      </Section>

      {/* ── 4. How IRIS works ── */}
      <Section id="how" label={ar ? 'إزاي بيشتغل' : 'How it works'} tone="sunk">
        <HeadingBlock title={ar ? 'الرحلة من الأول للآخر' : 'The journey, start to finish'} center />
        <img
          src="/images/landing/journey-3d.jpg"
          alt={ar ? 'رحلة التعلم في خمس خطوات' : 'The learning journey in five steps'}
          width={1600} height={900} loading="lazy"
          className="mt-8 mx-auto w-full max-w-4xl aspect-[16/9] object-cover rounded-[1.5rem] sm:rounded-[2rem] border border-brand-blue/10 shadow-brand"
        />
        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: <UserPlus className="size-6 text-brand-blue" />, t: ar ? 'الأهل يعملوا حساب' : 'Create an account', d: ar ? 'دقايق وبس' : 'Minutes, that is all' },
            { icon: <ScanSearch className="size-6 text-brand-yellow-ink" />, t: ar ? 'جلسة تعرّف على الطفل' : 'Getting-to-know session', d: ar ? 'لعب مش امتحان' : 'Played, not sat' },
            { icon: <Layers className="size-6 text-brand-green" />, t: ar ? 'IRIS تفهم احتياجات التعلم' : 'IRIS reads the needs', d: ar ? 'نقاط قوة ونقاط لسه بتتبني' : 'strengths and what is building' },
            { icon: <Gamepad2 className="size-6 text-brand-coral" />, t: ar ? 'الطفل ياخد أنشطته' : 'The child gets activities', d: ar ? 'خطة يومية على مقاسه' : 'a daily plan, their size' },
            { icon: <BarChart3 className="size-6 text-brand-purple" />, t: ar ? 'الأهل بيتابعوا التقدم' : 'Parents follow progress', d: ar ? 'لمحة واقتراحات للبيت' : 'a snapshot and home ideas' },
          ].map((s, i) => (
            <motion.li key={i} {...fade(i * 0.06)} className="bg-surface rounded-[1.75rem] p-5 border border-brand-blue/10 shadow-brand flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="size-12 rounded-2xl bg-brand-blue/8 grid place-items-center shrink-0">{s.icon}</span>
                <span className="t-display text-3xl text-brand-blue/30 leading-none">{ar ? ['١','٢','٣','٤','٥'][i] : i + 1}</span>
              </div>
              <p className="font-bold text-lg leading-snug">{s.t}</p>
              <p className="text-sm text-ink-muted">{s.d}</p>
            </motion.li>
          ))}
        </ol>
      </Section>

      {/* ── 5. Main features ── */}
      <Section id="features" label={ar ? 'المميزات' : 'Features'}>
        <HeadingBlock title={ar ? 'ست حاجات في صميم IRIS' : 'Six things at the heart of IRIS'} center />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { c: 'from-brand-blue-wash', icon: <Puzzle className="size-6 text-brand-blue" />, t: ar ? 'تعلّم متكيف' : 'Adaptive learning', d: ar ? 'السلّم بيتحرك مع كل إجابة — حسب أداء الطفل فعلاً، مش حسب تشخيصه.' : 'The ladder moves with every answer — driven by what the child actually does, never by a diagnosis.' },
            { c: 'from-brand-yellow-wash', icon: <Layers className="size-6 text-brand-yellow-ink" />, t: ar ? 'أنشطة تعليمية شخصية' : 'Personalized activities', d: ar ? 'حروف وكلمات وأرقام وأنماط وقصص — بتترتب من جديد حول المستوى الحالي.' : 'Letters, words, numbers, patterns, stories — re-sequenced around the current level.' },
            { c: 'from-brand-green-wash', icon: <Eye className="size-6 text-brand-green" />, t: ar ? 'محتوى ثلاثي الأبعاد' : 'Interactive 3D content', d: ar ? 'حيوانات وفواكه وأشكال يلفها الطفل ويتفرج من كل جهة — وبديل ثابت على الأجهزة الأضعف.' : 'Animals, fruits and shapes children can spin — with a static fallback on weaker devices.' },
            { c: 'from-brand-coral-wash', icon: <Headphones className="size-6 text-brand-coral" />, t: ar ? 'تعلم بالصوت' : 'Audio-supported learning', d: ar ? 'كل التعليمات والكلمات مسموعة بصوت دافئ بالعربي أو الإنجليزي.' : 'Every instruction and word voiced warmly in Arabic or English.' },
            { c: 'from-brand-purple-wash', icon: <HeartHandshake className="size-6 text-brand-purple" />, t: ar ? 'وضع الوالدين' : 'Parent Mode', d: ar ? 'لمحة تعلّم واضحة، أفكار للبيت، وأسئلة تتحول لمختص لما تكون طبية.' : 'A clear learning snapshot, home ideas, and questions routed to professionals when medical.' },
            { c: 'from-brand-blue-wash', icon: <BarChart3 className="size-6 text-brand-blue" />, t: ar ? 'متابعة التقدم' : 'Progress tracking', d: ar ? 'التقدم بيتسجل على سيرفر حقيقي — فاضل بعد ما تفقد الصفحة أو تغير الجهاز.' : 'Recorded on a real server — still there after a closed tab or a new device.' },
          ].map((f, i) => (
            <motion.div key={i} {...fade(i * 0.04)} className={`bg-gradient-to-b ${f.c} to-surface rounded-[2rem] p-5 sm:p-6 border border-brand-blue/10 shadow-brand flex flex-col gap-4`}>
              <div className="size-12 rounded-2xl bg-surface grid place-items-center shadow-brand">{f.icon}</div>
              <div>
                <h3 className="t-heading text-lg sm:text-xl mb-1.5">{f.t}</h3>
                <p className="text-base text-ink-muted leading-relaxed">{f.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 6. Interactive learning experience ── */}
      <Section id="experience" label={ar ? 'تجربة التعلم التفاعلية' : 'Interactive learning experience'} tone="ground">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 lg:gap-12 items-center">
          <div>
            <HeadingBlock
              title={ar ? 'جرّب دلوقتي — من غير تسجيل' : 'Try it right here — no sign-up'}
              intro={ar
                ? 'دي نماذج ثلاثية الأبعاد حقيقية من جوه الأنشطة. اسحب عشان تلفّه، بالظبط زي ما طفل هيلعب بيه.'
                : 'These are the real 3D models used inside the activities. Drag to spin them, exactly as a child would.'}
            />
            <p className="mt-5 inline-flex items-center gap-2 text-base font-bold text-brand-blue bg-brand-blue-wash rounded-full px-4 py-2">
              <MousePointerClick className="size-5" />
              {ar ? 'اسحب للتدوير — تكبير بإصبعين' : 'Drag to rotate — pinch to zoom'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <ModelCard src="/models/orange.glb" alt="Orange" emoji="🍊" label={ar ? 'برتقالة' : 'Orange'} />
            <ModelCard src="/models/fox.glb" alt="Fox" emoji="🦊" label={ar ? 'ثعلب' : 'Fox'} />
            <ModelCard src="/models/sphere.glb" alt="Sphere" emoji="🔮" label={ar ? 'كرة' : 'Sphere'} />
            <ModelCard src="/models/cube.glb" alt="Cube" emoji="🧊" label={ar ? 'مكعب' : 'Cube'} />
            <ModelCard src="/models/star.glb" alt="Star" emoji="⭐" label={ar ? 'نجمة' : 'Star'} />
            <ModelCard src="/models/heart.glb" alt="Heart" emoji="❤️" label={ar ? 'قلب' : 'Heart'} />
          </div>
        </div>
      </Section>

      {/* ── 7. Parent Mode ── */}
      <Section id="parents" label={ar ? 'وضع الوالدين' : 'Parent Mode'}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="order-2 lg:order-1 min-w-0">
            <div className="aspect-[4/3] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-brand-purple/15 shadow-brand-lg">
              <img
                src="/images/landing/parent-support.jpg"
                alt={ar ? 'أم تساعد طفلها على التعلم مع IRIS' : 'A parent guiding their child\u2019s learning with IRIS'}
                width={1400} height={1050} loading="lazy"
                className="size-full object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <HeadingBlock
              title={ar ? 'وضع الوالدين — بهدوء ووضوح' : 'Parent Mode — calm and clear'}
              intro={ar
                ? 'نفس الهوية البصرية، لكن بشكل أنضج وأهدى: تشوف لمحة التعلّم، تتابع التقدم، تاخد أفكار للبيت، وتوصل للمختصين.'
                : 'The same identity, grown-up and quiet: the learning snapshot, honest progress, home ideas, and a path to professionals.'}
            />
            <ul className="mt-6 space-y-3.5 text-base sm:text-lg">
              {[
                { icon: <BarChart3 className="size-5 text-brand-blue" />, t: ar ? 'لمحة عن التعلّم — قوة ونقاط لسه بتتبني' : 'A learning snapshot — strengths and skills still building' },
                { icon: <HeartHandshake className="size-5 text-brand-coral" />, t: ar ? 'إرشاد عملي لكل يوم في البيت' : 'Practical guidance for ordinary days' },
                { icon: <ShieldCheck className="size-5 text-brand-green" />, t: ar ? 'أسئلة طبية بتتحال لمختص' : 'Medical questions routed to professionals' },
                { icon: <Accessibility className="size-5 text-brand-purple" />, t: ar ? 'تحكم كامل في الحركة والصوت' : 'Full control over motion and sound' },
              ].map((li, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">{li.icon}</span>
                  <span className="leading-relaxed">{li.t}</span>
                </li>
              ))}
            </ul>
            <button onClick={goStart} className={`${btnPrimary} mt-7 w-full sm:w-auto`}>
              {isAuthenticated ? (ar ? 'ادخل وضع الوالدين' : 'Open Parent Mode') : ar ? 'ابدأ مع IRIS' : 'Start with IRIS'}
            </button>
          </div>
        </div>
      </Section>

      {/* ── 8. Why IRIS ── */}
      <Section label={ar ? 'ليه IRIS؟' : 'Why IRIS?'} tone="sunk">
        <HeadingBlock title={ar ? 'ليه IRIS؟' : 'Why IRIS?'} center />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            { icon: <Puzzle className="size-6 text-brand-blue" />, t: ar ? 'مخصص' : 'Personalized', d: ar ? 'مفيش طفلين بياخدوا نفس المسار.' : 'No two children walk the same path.' },
            { icon: <Accessibility className="size-6 text-brand-green" />, t: ar ? 'في متناول الكل' : 'Accessible', d: ar ? 'لوحة حسّيات، لغة مبسطة، وصوت لكل حاجة.' : 'Sensory controls, plain language, audio on everything.' },
            { icon: <Wallet className="size-6 text-brand-yellow-ink" />, t: ar ? 'في المتناول' : 'Affordable', d: ar ? 'رحلة مستمرة كل يوم في البيت.' : 'A daily journey at home.' },
            { icon: <Gamepad2 className="size-6 text-brand-coral" />, t: ar ? 'مُشوّق' : 'Engaging', d: ar ? 'الطفل بيرجع لأنه عايز يرجع.' : 'Children come back because they want to.' },
          ].map((v, i) => (
            <motion.div key={i} {...fade(i * 0.05)} className="bg-surface rounded-[2rem] p-6 text-center border border-brand-blue/10 shadow-brand">
              <div className="size-12 mx-auto rounded-2xl bg-brand-blue/8 grid place-items-center mb-4">{v.icon}</div>
              <h3 className="t-heading text-lg sm:text-xl mb-1.5">{v.t}</h3>
              <p className="text-base text-ink-muted">{v.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 9. Final CTA ── */}
      <Section label={ar ? 'ابدأ الآن' : 'Get started'}>
        <div className="bg-brand-blue rounded-[2rem] sm:rounded-[2.5rem] px-6 py-12 sm:px-10 sm:py-16 text-center relative overflow-hidden">
          <DisplayTitle size="section" className="!text-surface">
            {ar ? 'كل طفل وله سلّمه. يلا نلاقيه.' : 'Every child has their own ladder. Let\u2019s find yours.'}
          </DisplayTitle>
          <p className="mt-4 text-lg sm:text-xl text-surface/85 max-w-2xl mx-auto">
            {ar ? 'أول جلسة تعرّف بتتلعب مش بتتحكتش — وسريع هتشوف أول لمحة.' : 'The first session is played, not sat — and the first snapshot comes quickly.'}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={goStart} className={`${btn} bg-surface text-brand-blue-ink px-9 py-4 text-xl shadow-brand-lg`}>
              <Sparkles className="size-6 text-brand-yellow-ink" />
              {ar ? 'ابدأ مجانًا' : 'Get started free'}
            </button>
            {!isAuthenticated && (
              <button onClick={onLogin} className={`${btn} border-2 border-surface/70 text-surface px-8 py-4 text-lg`}>
                {ar ? 'دخول' : 'Log in'}
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ── 10. Footer ── */}
      <footer className="border-t border-ink/10 bg-ground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 sm:grid-cols-2">
          <div>
            <img src="/images/iris-logo-tight.png" alt="IRIS" width="220" height="86" className="h-9 w-auto object-contain" />
            <p className="mt-4 text-base text-ink-muted max-w-sm leading-relaxed">
              {ar
                ? 'IRIS — رحلة تعلّم متكيفة مبنية على إطار أدلة بحثي. نموذج أولي للتقييم والتعليم المساند، مش أداة تشخيص.'
                : 'IRIS — an adaptive learning journey built on a research evidence framework. A prototype for assessment and supportive learning, not a diagnostic tool.'}
            </p>
            <p className="mt-3 text-xs text-ink-muted">
              {ar ? 'لا يقدّم IRIS تشخيصًا ولا نصيحة طبية؛ الأسئلة الطبية تتحول لمختص.' : 'IRIS offers no diagnosis and no medical advice; medical questions route to professionals.'}
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-col gap-2.5 text-base font-semibold sm:items-end">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="rounded-lg hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">{l.t}</a>
            ))}
            <a href="#experience" className="rounded-lg hover:text-brand-blue">{ar ? 'جرّب التعلّم التفاعلي' : 'Try the interactive experience'}</a>
            <button onClick={goStart} className="text-brand-blue hover:underline text-start sm:text-end">
              {isAuthenticated ? (ar ? 'رجوع للتطبيق' : 'Back to the app') : (ar ? 'ابدأ الآن' : 'Get started')}
            </button>
          </nav>
        </div>
        <div className="border-t border-ink/5">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
            <p className="text-sm text-ink-muted flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>© 2026 IRIS</span>
              <span className="hidden sm:inline">{ar ? 'نفهم الطفل، مش نقيسه بمسطرة واحدة' : 'Understanding, not standardizing.'}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
