/**
 * IRIS public landing page v2 — the front door of the product (spec §16 +
 * refinement pass).
 *
 * What changed from v1 and why: the v1 hero leaned on floating blobs and a
 * mascot card; the refinement said plainly: no random shapes, no generic
 * template feel, show the REAL product. So the hero now carries a commissioned
 * brand-palette illustration, a live 3D learning object (the same viewer the
 * child uses — the promise and the proof are literally the same component),
 * and a miniature of the actual child home. Sections were rebuilt to the
 * spec's outline: 5-step journey, six named features, Why IRIS values, parent
 * support with its own illustration, CTA, professional footer. No invented
 * contact details, no claims the prototype cannot keep.
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles, Accessibility, BadgeDollarSign, Gamepad2, Headphones,
  Layers, Puzzle, ScanSearch, UserPlus, Wallet, BarChart3, HeartHandshake,
  Languages, ShieldCheck, Eye,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Logo, DisplayTitle, Mark } from '../iris/ui/brand';

/* Same lazy chunk the child activities use — on the landing it is a preview;
   on a device without WebGL the viewer's own error boundary shows the static
   fallback tile. Nothing here can crash if 3D fails. */
const Object3DViewer = lazy(() =>
  import('../three/Object3DViewer').then((m) => ({ default: m.Object3DViewer ?? m.default }))
);

function Hero3DApple({ reduced }: { reduced: boolean }) {
  return (
    <div className="rounded-[2rem] bg-brand-yellow-wash border border-brand-yellow/40 shadow-brand-lg p-3 w-40 sm:w-48">
      <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-surface">
        <Suspense fallback={<div className="size-full grid place-items-center text-5xl" aria-hidden>🍎</div>}>
          <Object3DViewer src="/models/apple.glb" alt="Apple" autoRotate={!reduced} fallbackEmoji="🍎" />
        </Suspense>
      </div>
      <p className="text-center font-bold text-sm py-2 text-brand-yellow-ink">
        تفاحة — Apple 🧊
      </p>
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

  const fade = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.45, delay, ease: 'easeOut' as const },
        };

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue';
  const btnPrimary = `${btn} bg-brand-blue text-surface px-7 py-3.5 text-lg shadow-brand-lg`;
  const btnGhost = `${btn} border-2 border-brand-blue text-brand-blue px-6 py-3 text-base`;

  const goStart = isAuthenticated ? onAppMode : onRegister;

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-surface text-ink">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-surface/92 backdrop-blur border-b border-brand-blue/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center" aria-label="IRIS home">
            <Logo className="h-10 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-6 text-base font-semibold">
            <a href="#about" className="hover:text-brand-blue">{ar ? 'عن IRIS' : 'About'}</a>
            <a href="#how" className="hover:text-brand-blue">{ar ? 'إزاي بيشتغل' : 'How it works'}</a>
            <a href="#features" className="hover:text-brand-blue">{ar ? 'المميزات' : 'Features'}</a>
            <a href="#parents" className="hover:text-brand-blue">{ar ? 'للأهل' : 'For parents'}</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 rounded-full border border-brand-blue/20 p-1" role="group" aria-label="Language">
              {([['ar', 'عربي'], ['en', 'EN']] as const).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${language === code ? 'bg-brand-blue text-surface' : 'text-brand-blue hover:bg-brand-blue/10'}`}
                >
                  {label}
                </button>
              ))}
            </span>
            {!isAuthenticated && (
              <button onClick={onLogin} className="text-brand-blue font-bold px-3 py-2 rounded-full hover:bg-brand-blue/5">
                {ar ? 'دخول' : 'Log in'}
              </button>
            )}
            <button onClick={goStart} className={`${btnPrimary} !px-5 !py-2.5 !text-base`}>
              {isAuthenticated ? (ar ? 'متابعة' : 'Continue') : ar ? 'ابدأ الآن' : 'Get started'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-ground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-16 lg:pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-blue-wash px-4 py-1.5 text-sm font-bold text-brand-blue-ink mb-5">
              <Sparkles className="size-4" />
              {ar ? 'تعلّم على مقاس طفلك' : 'Learning sized to your child'}
            </p>
            <DisplayTitle size="title" className="leading-[1.22]">
              {ar ? (
                <>
                  نفهم الطفل، <Mark>مش نقيسه</Mark>
                  <br />
                  بمسطرة واحدة
                </>
              ) : (
                <>
                  Understanding, <Mark>not standardizing.</Mark>
                  <br />
                  One child, one path.
                </>
              )}
            </DisplayTitle>
            <p className="mt-5 text-xl leading-relaxed text-ink-muted max-w-xl">
              {ar
                ? 'IRIS رحلة تعلّم متكيفة للأطفال من أصحاب الإعاقة الذهنية والتوحد وتأخر النمو — تبدأ بالتعرّف على الطفل، وتبني معاه خطوة خطوة، والخطة بتتغيّر معاه لحظة بلحظة. والأهل في كل لحظة في الصورة.'
                : 'IRIS is an adaptive learning journey for children with intellectual and developmental disabilities — it starts by getting to know your child, builds step by step, and the plan shifts in real time. Parents are part of it all.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button onClick={goStart} className={`${btnPrimary} text-xl !px-8 !py-4`}>
                <Sparkles className="size-6" />
                {isAuthenticated ? (ar ? 'كمل رحلتك' : 'Continue your journey') : ar ? 'ابدأ رحلة طفلك' : 'Get started'}
              </button>
              {!isAuthenticated && (
                <button onClick={onLogin} className={btnGhost}>
                  {ar ? 'عندي حساب' : 'I already have an account'}
                </button>
              )}
            </div>
            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-green" />{ar ? 'بلا تشخيص وبلا درجات ذكاء' : 'Diagnosis-blind, no IQ scores'}</span>
              <span className="inline-flex items-center gap-1.5"><Languages className="size-4 text-brand-blue" />{ar ? 'عربي أولاً وإنجليزي' : 'Arabic-first, bilingual'}</span>
            </p>
          </div>

          {/* Product preview: illustration + the REAL 3D viewer + mini child home */}
          <motion.div {...fade(0.15)} className="relative">
            <img
              src="/images/landing/hero-learning.jpg"
              alt={ar ? 'أطفال يتعلمون مع شخصية إيريس' : 'Children learning with the IRIS companion'}
              className="w-full rounded-[2.5rem] shadow-brand-lg border border-brand-blue/10"
              loading="eager"
            />
            <div className="absolute -bottom-6 start-4 sm:-start-6">
              <Hero3DApple reduced={reduced} />
            </div>
            <div className="absolute -top-4 end-2 sm:end-[-1.25rem] bg-surface rounded-2xl shadow-brand-lg border border-brand-blue/10 p-3 flex items-center gap-2.5">
              <span className="size-10 rounded-xl bg-brand-green-wash grid place-items-center text-2xl" aria-hidden>⭐</span>
              <div className="leading-tight">
                <p className="font-bold text-base">{ar ? '١٢ نجمة النهارده' : '12 stars today'}</p>
                <p className="text-xs text-ink-muted">{ar ? 'من غير ضغط ولا مقارنة' : 'No pressure, no comparison'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fade()}>
            <DisplayTitle size="section">{ar ? 'إيه المشكلة اللي IRIS بتحلّها؟' : 'What problem does IRIS solve?'}</DisplayTitle>
            <p className="mt-5 text-xl text-ink-muted leading-relaxed">
              {ar
                ? 'الأطفال من أصحاب الإعاقة الذهنية والتوحد وتأخر النمو بيستاهلوا تعليم على مقاسهم — لكن الاختبارات القياسية بتدي رقم، والرقم ده مبيقولش للمدرسة ولا للأهل يبدأوا من فين. IRIS بتحوّل تقييم الطفل لخطة يومية حقيقية: الأنشطة المناسبة، بالسرعة المناسبة، والأهل فاهمين كل خطوة.'
                : 'Children with intellectual disabilities, autism and developmental delays deserve education sized to them — but standard tests hand back a number, and that number tells a school or a parent nothing about where to begin. IRIS turns assessment into an actual daily plan: the right activities, at the right pace, with parents understanding every step.'}
            </p>
            <ul className="mt-6 space-y-3 text-lg">
              {[
                { icon: <Puzzle className="size-5 text-brand-coral" />, t: ar ? 'كل طفل ليـه مساره، من غير مقارنة' : 'A path of its own for every child — never a comparison' },
                { icon: <ScanSearch className="size-5 text-brand-blue" />, t: ar ? 'تعرّف حقيقي على المهارات، مهارة مهارة' : 'A real read of each skill, separately' },
                { icon: <HeartHandshake className="size-5 text-brand-purple" />, t: ar ? 'الأهل شريك في الخطة مش متفرج' : 'Parents as partners in the plan, not spectators' },
              ].map((li, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 shrink-0">{li.icon}</span>
                  <span>{li.t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fade(0.12)} className="grid grid-cols-2 gap-4">
            {[
              { c: 'bg-brand-blue-wash', k: ar ? '٥ مستويات لكل مهارة' : '5 levels per skill', d: ar ? 'من أساسيات لخطوات متقدمة' : 'from basics to further steps' },
              { c: 'bg-brand-yellow-wash', k: ar ? 'جلسات قصيرة' : 'Short sessions', d: ar ? 'عشر دقايق تكفي' : 'ten minutes is enough' },
              { c: 'bg-brand-green-wash', k: ar ? 'خطة بيتية' : 'A home plan', d: ar ? 'حاجات بسيطة تعمليها معاه' : 'small everyday things to do' },
              { c: 'bg-brand-purple-wash', k: ar ? 'بلا مصطلحات مخوّفة' : 'No scary jargon', d: ar ? 'لغة طيبة ومفهومة' : 'kind, plain language' },
            ].map((s, i) => (
              <div key={i} className={`${s.c} rounded-[1.75rem] p-6 border border-ink/5`}>
                <p className="t-heading text-lg mb-1">{s.k}</p>
                <p className="text-base text-ink-muted">{s.d}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works: the 5-step journey ── */}
      <section id="how" className="bg-surface-sunk/50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'الرحلة من الأول للآخر' : 'The journey, start to finish'}</DisplayTitle>
          <img
            src="/images/landing/journey-3d.jpg"
            alt={ar ? 'رحلة التعلم في خمس خطوات' : 'The learning journey in five steps'}
            className="mt-8 mx-auto w-full max-w-4xl rounded-[2rem] border border-brand-blue/10 shadow-brand"
            loading="lazy"
          />
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: <UserPlus className="size-6 text-brand-blue" />, t: ar ? 'الأهل يعملوا حساب' : 'Create an account', d: ar ? 'دقايق وبس' : 'Minutes, that is all' },
              { icon: <ScanSearch className="size-6 text-brand-yellow-ink" />, t: ar ? 'جلسة تعرّف على الطفل' : 'Getting-to-know session', d: ar ? 'لعب مش امتحان' : 'Played, not sat' },
              { icon: <Layers className="size-6 text-brand-green" />, t: ar ? 'IRIS تفهم احتياجات التعلم' : 'IRIS reads the needs', d: ar ? 'نقاط قوة ونقاط لسه بتتبني' : 'strengths and what is building' },
              { icon: <Gamepad2 className="size-6 text-brand-coral" />, t: ar ? 'الطفل ياخد أنشطته' : 'The child gets activities', d: ar ? 'خطة يومية على مقاسه' : 'a daily plan, their size' },
              { icon: <BarChart3 className="size-6 text-brand-purple" />, t: ar ? 'الأهل بيتابعوا التقدم' : 'Parents follow progress', d: ar ? 'لمحة واقتراحات للبيت' : 'a snapshot and home ideas' },
            ].map((s, i) => (
              <motion.li key={i} {...fade(i * 0.07)} className="bg-surface rounded-[1.75rem] p-5 border border-brand-blue/10 shadow-brand flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="size-12 rounded-2xl bg-brand-blue/8 grid place-items-center">{s.icon}</span>
                  <span className="t-display text-3xl text-brand-blue/30">{i + 1}</span>
                </div>
                <p className="font-bold text-lg leading-snug">{s.t}</p>
                <p className="text-sm text-ink-muted">{s.d}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'ست حاجات في صميم IRIS' : 'Six things at the heart of IRIS'}</DisplayTitle>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { c: 'from-brand-blue-wash', icon: <Puzzle className="size-7 text-brand-blue" />, t: ar ? 'تعلّم متكيف' : 'Adaptive learning', d: ar ? 'السلّم بيتحرك مع كل إجابة — أصعب خطوة أو دعم أكتر، حسب أداء الطفل فعلاً، مش حسب تشخيصه.' : 'The ladder moves with every answer — one rung harder or more support, driven by what the child actually does, not by a diagnosis.' },
              { c: 'from-brand-yellow-wash', icon: <Layers className="size-7 text-brand-yellow-ink" />, t: ar ? 'أنشطة تعليمية شخصية' : 'Personalized activities', d: ar ? 'حروف وكلمات وأرقام وأنماط وقصص — بتترتب من جديد كل يوم حول المستوى الحالي.' : 'Letters, words, numbers, patterns, stories — re-sequenced daily around the current level.' },
              { c: 'from-brand-green-wash', icon: <Eye className="size-7 text-brand-green" />, t: ar ? 'محتوى ثلاثي الأبعاد' : 'Interactive 3D content', d: ar ? 'حيوانات وفواكه وأشكال يقدر الطفل يلفها ويتفرج عليها من كل جهة — وبديل ثابت على الأجهزة الأضعف.' : 'Animals, fruits and shapes children can spin and explore from every angle — with a static fallback on weaker devices.' },
              { c: 'from-brand-coral-wash', icon: <Headphones className="size-7 text-brand-coral" />, t: ar ? 'تعلم بالصوت' : 'Audio-supported learning', d: ar ? 'كل تعليمات وكلمة مسموعة بصوت دافئ بالعربي أو الإنجليزي — مناسب للي مابيقرأوش بعد.' : 'Every instruction and word voiced warmly in Arabic or English — built for children who do not read yet.' },
              { c: 'from-brand-purple-wash', icon: <HeartHandshake className="size-7 text-brand-purple" />, t: ar ? 'وضع الوالدين' : 'Parent Mode', d: ar ? 'لمحة تعلّم واضحة، أفكار للبيت، وأسئلة تتحوّل لمختص لما تكون طبية.' : 'A clear learning snapshot, home ideas, and questions routed to specialists when they are medical.' },
              { c: 'from-brand-blue-wash', icon: <BarChart3 className="size-7 text-brand-blue" />, t: ar ? 'متابعة التقدم' : 'Progress tracking', d: ar ? 'التقدم بيتسجل على سيرفر حقيقي — لسه موجود بعد ما تفقد الصفحة أو تغير الجهاز.' : 'Genuinely recorded on a real server — still there after a closed tab or a different device.' },
            ].map((f, i) => (
              <motion.div key={i} {...fade(i * 0.05)} className={`bg-gradient-to-b ${f.c} to-surface rounded-[2rem] p-6 border border-brand-blue/10 shadow-brand`}>
                <div className="size-14 rounded-2xl bg-surface grid place-items-center shadow-brand mb-4">{f.icon}</div>
                <h3 className="t-heading text-xl mb-2">{f.t}</h3>
                <p className="text-base text-ink-muted leading-relaxed">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why IRIS ── */}
      <section className="bg-ground py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'ليه IRIS؟' : 'Why IRIS?'}</DisplayTitle>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Puzzle className="size-7 text-brand-blue" />, t: ar ? 'مخصص' : 'Personalized', d: ar ? 'مفيش طفلين بياخدوا نفس المسار.' : 'No two children walk the same path.' },
              { icon: <Accessibility className="size-7 text-brand-green" />, t: ar ? 'في متناول الكل' : 'Accessible', d: ar ? 'لوحة راحة وحسّيات، لغة مبسطة، وصوت لكل حاجة.' : 'Sensory controls, plain language, audio on everything.' },
              { icon: <Wallet className="size-7 text-brand-yellow-ink" />, t: ar ? 'في المتناول' : 'Affordable', d: ar ? 'بدائل جلسات الغلاء — رحلة مستمرة في البيت كل يوم.' : 'Not a weekly-hour substitute — a daily journey at home.' },
              { icon: <Gamepad2 className="size-7 text-brand-coral" />, t: ar ? 'مُشوّق' : 'Engaging', d: ar ? 'الطفل بيرجع لأنه عايز يرجع.' : 'Children come back because they want to.' },
            ].map((v, i) => (
              <motion.div key={i} {...fade(i * 0.07)} className="bg-surface rounded-[2rem] p-6 text-center border border-brand-blue/10 shadow-brand">
                <div className="size-14 mx-auto rounded-2xl bg-brand-blue/8 grid place-items-center mb-4">{v.icon}</div>
                <h3 className="t-heading text-xl mb-2">{v.t}</h3>
                <p className="text-base text-ink-muted">{v.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parent support ── */}
      <section id="parents" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fade()} className="order-2 lg:order-1">
            <DisplayTitle size="section">{ar ? 'إزاي IRIS بتساندك كأهل؟' : 'How IRIS supports you as a parent'}</DisplayTitle>
            <ul className="mt-7 space-y-4 text-lg">
              {[
                { n: '١', t: ar ? 'تفهمني تقدم طفلك بالواضح' : 'Understand your child\u2019s progress, clearly' },
                { n: '٢', t: ar ? 'تكتشفي نقاط قوته الحقيقية' : 'Discover the strengths your child actually has' },
                { n: '٣', t: ar ? 'تشوفي الحاجات اللي محتاجة دعم أكتر' : 'See exactly what still needs support' },
                { n: '٤', t: ar ? 'تاخدي إرشاد عملي لكل يوم' : 'Get practical guidance for ordinary days' },
                { n: '٥', t: ar ? 'تشاركي في رحلة التعلم بنفسك' : 'Take part in the learning journey yourself' },
              ].map((li, i) => (
                <motion.li key={i} {...fade(i * 0.05)} className="flex items-start gap-4">
                  <span className="t-display size-9 shrink-0 rounded-xl bg-brand-purple-wash text-brand-purple grid place-items-center text-xl">{ar ? li.n : String(i + 1)}</span>
                  <span className="leading-relaxed">{li.t}</span>
                </motion.li>
              ))}
            </ul>
            <button onClick={goStart} className={`${btnPrimary} mt-8`}>
              {isAuthenticated ? (ar ? 'ادخلي وضع الوالدين' : 'Open Parent Mode') : ar ? 'ابدئي مع IRIS' : 'Start with IRIS'}
            </button>
          </motion.div>
          <motion.div {...fade(0.1)} className="order-1 lg:order-2">
            <img
              src="/images/landing/parent-support.jpg"
              alt={ar ? 'أم تساعد طفلها على التعلم مع IRIS' : 'A parent guiding their child\u2019s learning with IRIS'}
              className="w-full rounded-[2.5rem] border border-brand-purple/15 shadow-brand-lg"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-brand-blue rounded-[2.5rem] px-8 py-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -bottom-16 h-40 bg-brand-yellow/25 blur-2xl rounded-full" />
          <DisplayTitle size="section" className="!text-surface relative">
            {ar ? 'كل طفل وله سلّمه. يلا نلاقيه.' : 'Every child has their own ladder. Let\u2019s find yours.'}
          </DisplayTitle>
          <p className="mt-3 text-xl text-surface/85 relative">
            {ar ? 'أول جلسة تعرّف بتتلعب مش بتتحكتش — وسريع هتشوفي أول لمحة.' : 'The first session is played, not sat — and the first snapshot is quick to see.'}
          </p>
          <button onClick={goStart} className={`${btn} relative mt-8 bg-surface text-brand-blue-ink px-9 py-4 text-xl shadow-brand-lg`}>
            <Sparkles className="size-6 text-brand-yellow-ink" />
            {ar ? 'ابدأ مجانًا' : 'Get started free'}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink/10 bg-ground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-[1.2fr_1fr] gap-8">
          <div>
            <Logo className="h-10 w-auto" />
            <p className="mt-4 text-base text-ink-muted max-w-sm leading-relaxed">
              {ar
                ? 'IRIS — رحلة تعلّم متكيفة مبنية على إطار أدلة بحثي. نموذج أولي للتقييم والتعليم المساند، مش أداة تشخيص.'
                : 'IRIS — an adaptive learning journey built on a research evidence framework. A prototype for assessment and supportive learning, not a diagnostic tool.'}
            </p>
            <p className="mt-3 text-xs text-ink-muted">
              {ar
                ? 'لا يقدّم IRIS تشخيصًا ولا نصيحة طبية؛ الأسئلة الطبية تتحوّل لمختص.'
                : 'IRIS offers no diagnosis and no medical advice; medical questions route to professionals.'}
            </p>
          </div>
          <nav className="flex flex-col gap-2.5 text-base font-semibold sm:items-end" aria-label="Footer">
            <a href="#about" className="hover:text-brand-blue">{ar ? 'عن IRIS' : 'About IRIS'}</a>
            <a href="#how" className="hover:text-brand-blue">{ar ? 'إزاي بيشتغل' : 'How it works'}</a>
            <a href="#features" className="hover:text-brand-blue">{ar ? 'المميزات' : 'Features'}</a>
            <a href="#parents" className="hover:text-brand-blue">{ar ? 'للأهل' : 'For parents'}</a>
            <button onClick={goStart} className="text-brand-blue hover:underline">{isAuthenticated ? (ar ? 'رجوع للتطبيق' : 'Back to the app') : (ar ? 'ابدأ الآن' : 'Get started')}</button>
          </nav>
        </div>
        <div className="border-t border-ink/5 py-5">
          <p className="max-w-6xl mx-auto px-4 sm:px-6 text-sm text-ink-muted flex items-center justify-between gap-4">
            <span>© 2026 IRIS</span>
            <span className="hidden sm:inline">{ar ? 'نفهم الطفل، مش نقيسه بمسطرة واحدة' : 'Understanding, not standardizing.'}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
