/**
 * IRIS public landing page — the front door of the product (spec §16).
 *
 * Deliberately NOT the app: no auth required to read it, no claims it cannot
 * keep. It tells the truth about what IRIS is (a research-framed prototype,
 * diagnosis-blind, no IQ anywhere) and sells the honest version hard, because
 * for this audience trust IS the feature.
 *
 * Visual language is the same unified system every screen now uses: brand
 * tokens, Baloo display voice, the Mark highlight carrying the signature
 * phrase, Mascot A as the companion, corner blobs at a visible ~16%.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, BarChart3, Home, Users, ShieldCheck, Languages } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Logo, DisplayTitle, Mark } from '../iris/ui/brand';
import { IrisBuddy } from '../iris/ui/IrisBuddy';

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

  // The language pill needs the setter; pull it lazily to keep imports tight.
  const [, force] = useState(0);
  useEffect(() => {
    // re-render when context language changes is automatic; this is a no-op guard
    force((n) => n + 1);
  }, [language]);

  const fadeUp = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: 0.5, delay, ease: 'easeOut' },
        };

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue';
  const btnPrimary = `${btn} bg-brand-blue text-surface px-7 py-3.5 text-lg shadow-brand-lg`;
  const btnGhost = `${btn} border-2 border-brand-blue text-brand-blue px-6 py-3 text-base`;

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-screen bg-surface text-ink overflow-x-hidden">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-brand-blue/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center" aria-label="IRIS home">
            <Logo className="h-10 w-auto" />
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-base font-semibold text-ink">
            <a href="#about" className="hover:text-brand-blue transition-colors">
              {ar ? 'عن IRIS' : 'About'}
            </a>
            <a href="#how" className="hover:text-brand-blue transition-colors">
              {ar ? 'إزاي بيشتغل' : 'How it works'}
            </a>
            <a href="#features" className="hover:text-brand-blue transition-colors">
              {ar ? 'المميزات' : 'Features'}
            </a>
            <a href="#parents" className="hover:text-brand-blue transition-colors">
              {ar ? 'للأهل' : 'For parents'}
            </a>
            <span className="flex items-center gap-1 rounded-full border border-brand-blue/20 p-1" role="group" aria-label="Language">
              {([['ar','عربي'],['en','EN']] as const).map(([code,label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${language===code ? 'bg-brand-blue text-surface' : 'text-brand-blue hover:bg-brand-blue/10'}`}
                >
                  {label}
                </button>
              ))}
            </span>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onAppMode} className="hidden sm:inline-flex text-brand-blue font-bold px-3 py-2 rounded-full hover:bg-brand-blue/5">
              {ar ? 'دخول' : 'Log in'}
            </button>
            <button onClick={isAuthenticated ? onAppMode : onRegister} className={`${btnPrimary} !px-5 !py-2.5 !text-base`}>
              {isAuthenticated ? (ar ? 'متابعة' : 'Continue') : ar ? 'ابدأ الآن' : 'Get started'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative">
        <div className="pointer-events-none absolute -top-10 -left-24 size-72 rounded-full bg-brand-blue opacity-[0.16]" />
        <div className="pointer-events-none absolute top-40 -right-28 size-80 rounded-full bg-brand-yellow opacity-[0.16]" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 size-56 rounded-full bg-brand-coral opacity-[0.10]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <DisplayTitle size="title" className="leading-[1.25]">
              {ar ? (
                <>
                  نفهم الطفل،{' '}
                  <Mark>مش نقيسه</Mark>
                  <br />
                  بمسطرة واحدة
                </>
              ) : (
                <>
                  Understanding,{' '}
                  <Mark>not standardizing</Mark>
                  .
                  <br />
                  One child, one path.
                </>
              )}
            </DisplayTitle>
            <motion.p {...fadeUp(0.15)} className="mt-6 text-xl sm:text-2xl text-ink-muted max-w-xl leading-relaxed">
              {ar
                ? 'IRIS رحلة تعلّم تمشي على مقاس كل طفل — بتتعرف عليه الأول، وبعدين بتبني معاه خطوة خطوة، والأهل شايفين كل تقدم.'
                : 'IRIS is an adaptive learning journey sized to each child — it gets to know them first, then builds step by step, with parents seeing every bit of progress.'}
            </motion.p>
            <motion.div {...fadeUp(0.25)} className="mt-9 flex flex-wrap items-center gap-4">
              <button onClick={isAuthenticated ? onAppMode : onRegister} className={`${btnPrimary} text-xl !px-9 !py-4`}>
                <Sparkles className="size-6" />
                {ar ? 'يلا نبدأ الرحلة' : 'Start the journey'}
              </button>
              <a href="#how" className={btnGhost}>
                {ar ? 'شوف إزاي بيشتغل' : 'See how it works'}
              </a>
            </motion.div>
            <motion.p {...fadeUp(0.35)} className="mt-6 text-sm text-ink-muted flex flex-wrap gap-x-5 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-green" />{ar ? 'بلا تشخيص وبلا درجات ذكاء' : 'Diagnosis-blind, no IQ scores'}</span>
              <span className="inline-flex items-center gap-1.5"><Languages className="size-4 text-brand-blue" />{ar ? 'عربي أولاً وإنجليزي' : 'Arabic-first, bilingual'}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-brand-purple" />{ar ? 'الأهل في قلب الرحلة' : 'Parents at the centre'}</span>
            </motion.p>
          </div>
          <motion.div {...fadeUp(0.2)} className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2.5rem] bg-brand-yellow-wash p-8 sm:p-10 border border-brand-yellow/30 shadow-brand-lg">
              <IrisBuddy mood="happy" className="w-full h-64 sm:h-72" />
              <p className="t-display text-center text-2xl text-brand-yellow-ink mt-2">
                {ar ? 'أهلاً يا بطل!' : 'Hi there!'}
              </p>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-3xl bg-surface border border-brand-blue/15 shadow-brand-lg p-4 flex items-center gap-3">
              <span className="size-11 rounded-2xl bg-brand-green/15 flex items-center justify-center text-2xl">🦊</span>
              <div className="text-start">
                <p className="font-bold text-base">{ar ? 'خطوة جديدة اتفتحت' : 'A new step opened'}</p>
                <p className="text-sm text-ink-muted">{ar ? 'من غير ضغط ولا مقارنة' : 'No pressure, no comparison'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="bg-brand-blue-wash/50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'إيه IRIS بالظبط؟' : 'What exactly is IRIS?'}</DisplayTitle>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🪜',
                t: ar ? 'سلّم لكل طفل' : 'A ladder per child',
                d: ar
                  ? 'مفيش اختبار واحد للجميع. IRIS بتتعرف على مستوى الطفل في كل مهارة لوحدها، وبتبدأ من عند الخطوة اللي يقدر يمشيها.'
                  : 'There is no one test for everyone. IRIS finds where a child stands in each skill separately, and starts at the step they can actually take.',
              },
              {
                icon: '🧩',
                t: ar ? 'بنتكيّف مع اللعب' : 'It adapts while playing',
                d: ar
                  ? 'كل إجابة بتغيّر الخطوة الجاية — أصعب شوية أو دعم أكتر. الطفل بيحس بلعب، والمنهج بيتبني وراه لحظة بلحظة.'
                  : 'Every answer changes the next step — a rung up, or more support. The child feels play; the pathway rebuilds itself in real time.',
              },
              {
                icon: '🏠',
                t: ar ? 'الأهل شركاء' : 'Parents are partners',
                d: ar
                  ? 'لمحة واضحة عن اللي بيعرفه الطفل، واللي لسه بيتبني، وأفعال بسيطة تتعمل في البيت — من غير مصطلحات طبية ولا أرقام بتخوّف.'
                  : 'A clear view of what the child knows, what is still building, and small things to do at home — no scary numbers, no jargon.',
              },
            ].map((c, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)} className="bg-surface rounded-[2rem] p-7 shadow-brand border border-brand-blue/10">
                <span className="text-4xl">{c.icon}</span>
                <h3 className="t-display text-2xl mt-4 mb-2 text-brand-blue-ink">{c.t}</h3>
                <p className="text-lg text-ink-muted leading-relaxed">{c.d}</p>
              </motion.div>
            ))}
          </div>
          <motion.p {...fadeUp(0.2)} className="mt-10 text-center text-base text-ink-muted max-w-3xl mx-auto">
            {ar
              ? 'IRIS نموذج أولي مبني على إطار أدلة بحثي — مش أداة تشخيص ولا بديل عن متخصص. وده جزء من التزامنا، مش غياب فيه.'
              : 'IRIS is a prototype built on a research evidence framework — it is not a diagnostic tool and not a substitute for specialists. Saying so is part of the commitment.'}
          </motion.p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'الرحلة في 3 خطوات' : 'The journey in 3 steps'}</DisplayTitle>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {[
              {
                n: '١',
                en: '1',
                t: ar ? 'نتعرّف على بعض' : 'Getting to know',
                d: ar
                  ? 'جلسات قصيرة أشبه باللعب — سؤال واحد في كل مرة، ومفيش صح وغلط. بتدينا نقطة بداية شريفة لكل مهارة.'
                  : 'Short sessions that feel like play — one question at a time, nothing framed as right or wrong. It gives us an honest starting point per skill.',
                c: 'bg-brand-yellow',
              },
              {
                n: '٢',
                en: '2',
                t: ar ? 'نلعب ونتعلّم' : 'Play & learn',
                d: ar
                  ? 'أنشطة يومية على السلّم بتاع الطفل: حروف، كلمات، أرقام، أنماط — بمنطق واحد ثابت طول الوقت عشان ياطمن.'
                  : 'Daily activities on the child\u2019s own ladder: letters, words, numbers, patterns — one constant visual logic so nothing is ever a surprise.',
                c: 'bg-brand-green',
              },
              {
                n: '٣',
                en: '3',
                t: ar ? 'الأهل بيشوفوا' : 'Parents see it',
                d: ar
                  ? 'لمحة عن التعلّم، اقتراحات للبيت، ومساحة أسئلة — والتقدم بيتسجل فعلاً مش بيتحكي بس.'
                  : 'A learning snapshot, home suggestions, and a question space — progress that is genuinely recorded, not just narrated.',
                c: 'bg-brand-purple',
              },
            ].map((s, i) => (
              <motion.div key={i} {...fadeUp(i * 0.12)} className="relative">
                <div className={`${s.c} size-14 rounded-2xl grid place-items-center t-display text-3xl mb-4`}>
                  <span className="text-ink font-black">{ar ? s.n : s.en}</span>
                </div>
                <h3 className="t-display text-3xl mb-2">{s.t}</h3>
                <p className="text-lg text-ink-muted leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-surface-sunk/60 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DisplayTitle size="section" className="text-center">{ar ? 'مصمّم لكل طفل، بكل حاجة' : 'Designed for every child, everything'}</DisplayTitle>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <BarChart3 className="size-6 text-brand-blue" />, t: ar ? 'تكيّف لحظي حقيقي' : 'Real live adaptation', d: ar ? 'السلّم بيتحرك مع كل إجابة — ومش بيتحكم فيه التشخيص، بيتحكم فيه الأداء الفعلي.' : 'The ladder moves with every answer — driven by observed performance, never by a diagnosis.' },
              { icon: <span className="text-2xl">🎛️</span>, t: ar ? 'لوحة راحة وحسّيات' : 'Comfort & sensory panel', d: ar ? 'الأهل يتحكموا في الحركة والصوت — ووضع هادئ كامل لمن يحتاج.' : 'Parents lock motion and sound — a full calm mode for children who need less.' },
              { icon: <span className="text-2xl">📈</span>, t: ar ? 'تقدّم من غير درجات' : 'Progress without scores', d: ar ? 'مفيش نسب ولا مقارنة بأطفال تانيين. بس: بيعرف إيه، ولسه بيتبني إيه.' : 'No percentages, no comparing children. Only: what they know, and what is building.' },
              { icon: <Languages className="size-6 text-brand-purple" />, t: ar ? 'عربي مصري أصيل' : 'Authentic Arabic-first', d: ar ? 'مفردات وحروف وأصوات بالعربي أولاً، مع نسخة إنجليزية كاملة.' : 'Vocabulary, letters and sounds in Arabic first, with a complete English twin.' },
              { icon: <span className="text-2xl">⏸️</span>, t: ar ? 'استئناف في أي لحظة' : 'Resume anytime', d: ar ? 'لو القفل اتقفل أو الصفحة اتمقفلت، اللعب بيكمل من حيث ما وقف.' : 'Closed tab, dead battery — the session picks up exactly where it stopped.' },
              { icon: <Users className="size-6 text-brand-coral" />, t: ar ? 'جسر للمختصين' : 'A bridge to specialists', d: ar ? 'أسئلة الأهل الطبية بتتحال لمختص — IRIS بتساعده تفهم، مش بتدي رأي طبي.' : 'Medical questions route to professionals — IRIS helps you understand, it never plays doctor.' },
            ].map((f, i) => (
              <motion.div key={i} {...fadeUp(i * 0.06)} className="bg-surface rounded-3xl p-5 border border-brand-blue/10 flex gap-4 items-start">
                <div className="size-12 rounded-2xl bg-brand-blue/8 grid place-items-center shrink-0">{f.icon}</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{f.t}</h4>
                  <p className="text-base text-ink-muted leading-relaxed">{f.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <DisplayTitle size="section">{ar ? 'نمطة من عالم الطفل' : 'A glimpse of the child world'}</DisplayTitle>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { e: '🔤', t: ar ? 'الحروف' : 'Letters', c: 'bg-brand-blue-wash' },
              { e: '🔢', t: ar ? 'الأرقام' : 'Numbers', c: 'bg-brand-yellow-wash' },
              { e: '🦊', t: ar ? 'الحيوانات' : 'Animals', c: 'bg-brand-green-wash' },
              { e: '🎨', t: ar ? 'الألوان' : 'Colors', c: 'bg-brand-purple-wash' },
              { e: '📖', t: ar ? 'القصص' : 'Stories', c: 'bg-brand-coral-wash' },
              { e: '🧩', t: ar ? 'أنماط' : 'Patterns', c: 'bg-brand-blue-wash' },
            ].map((a, i) => (
              <motion.div key={i} {...fadeUp(i * 0.05)} className={`${a.c} rounded-[1.75rem] p-6 flex flex-col items-center gap-2 border border-ink/5`}>
                <span className="text-5xl">{a.e}</span>
                <span className="font-bold text-lg">{a.t}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-ink-muted text-base max-w-2xl mx-auto">
            {ar
              ? 'قريبًا: الحاجات التعليمية هتظهر بمجسمات ثلاثية الأبعاد يقدر الطفل يلفها ويتفرج عليها من كل الجهات.'
              : 'Coming next in this build: learning objects rendered as 3D models children can spin and explore from every angle.'}
          </p>
        </div>
      </section>

      {/* ── Parents ── */}
      <section id="parents" className="bg-brand-purple-wash/50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp(0)}>
            <DisplayTitle size="section" className="!text-left">{ar ? 'وضع الوالدين' : 'Parent Mode'}</DisplayTitle>
            <p className="mt-5 text-xl text-ink-muted leading-relaxed">
              {ar
                ? 'مساحة للبالغين بهدوء نفس التصميم لكن بشكل أوضح: تشوف لمحة التعلّم، تتابع التقدم، تاخد أفكار للبيت، تسأل IRIS، وتوصل للمختصين.'
                : 'An adult space with the same calm design language, clearly yours: the learning snapshot, progress you can follow, home ideas, a question space, and a path to specialists.'}
            </p>
            <ul className="mt-6 space-y-3 text-lg">
              {[
                ar ? 'لمحة عن التعلّم — نقاط القوة والمهارات اللي لسه بتتبني' : 'A learning snapshot — strengths and skills still building',
                ar ? 'اقتراحات للبيت — حاجات بسيطة تتعمل في اليوم العادي' : 'Home ideas — small things that fit an ordinary day',
                ar ? 'أسئلة بتتحال لمختص لما تكون طبية' : 'Medical questions routed to professionals',
                ar ? 'تحكم كامل في الراحة والحسّيات' : 'Full control over comfort and sensory settings',
              ].map((li, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Home className="size-5 text-brand-purple shrink-0 mt-1" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
            <button onClick={isAuthenticated ? onAppMode : onRegister} className={`${btnPrimary} mt-8`}>
              {isAuthenticated ? (ar ? 'ادخل وضع الوالدين' : 'Open Parent Mode') : ar ? 'سجّل طفلك' : 'Create your account'}
            </button>
          </motion.div>
          <motion.div {...fadeUp(0.15)} className="bg-surface rounded-[2rem] shadow-brand-lg p-7 border border-brand-purple/15 max-w-md mx-auto w-full">
            <p className="text-sm text-ink-muted mb-2">{ar ? 'اليوم' : 'Today'}</p>
            <h3 className="t-display text-2xl mb-5">{ar ? 'لمحة عن تعلّم نور' : 'Nour\u2019s learning snapshot'}</h3>
            {[
              { k: ar ? 'أسماء الحروف' : 'Letter names', v: '76', c: 'bg-brand-green/15 text-brand-green-ink' },
              { k: ar ? 'من الصوت للحرف' : 'Sound to letter', v: '68', c: 'bg-brand-green/15 text-brand-green-ink' },
              { k: ar ? 'فهم كلمة مسموعة' : 'Listening words', v: '37', c: 'bg-brand-yellow/20 text-brand-yellow-ink' },
              { k: ar ? 'المقارنة بين الكميات' : 'Comparing amounts', v: '—', c: 'bg-ink/5 text-ink-muted' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3 border-b border-ink/5 last:border-0">
                <span className="text-base">{r.k}</span>
                <span className={`${r.c} rounded-full px-3 py-1 text-sm font-bold`}>{r.v}</span>
              </div>
            ))}
            <div className="mt-5 rounded-2xl bg-brand-blue-wash p-4 text-base">
              {ar ? 'الخطوة الجاية: كلمات مسموعة قصيرة — حوالي ١٠ دقايق في اليوم.' : 'Next: short listening words — about 10 minutes a day.'}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center bg-brand-blue rounded-[2.5rem] px-8 py-14 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-brand-yellow opacity-25" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 size-44 rounded-full bg-brand-coral opacity-20" />
          <DisplayTitle size="section" className="!text-surface relative">
            {ar ? 'كل طفل وله سلّمه. يلا نلاقيه.' : 'Every child has their own ladder. Let\u2019s find yours.'}
          </DisplayTitle>
          <p className="mt-4 text-xl text-surface/85 relative">
            {ar ? 'التسجيل ياخد دقايق — وأول جلسة تعرّف بتتلعب، متتحكتش.' : 'Sign-up takes minutes — and the first session is played, not sat.'}
          </p>
          <button onClick={isAuthenticated ? onAppMode : onRegister} className={`${btn} relative mt-8 bg-surface text-brand-blue-ink px-9 py-4 text-xl shadow-brand-lg`}>
            <Sparkles className="size-6 text-brand-yellow-ink" />
            {ar ? 'ابدأ مجانًا' : 'Get started free'}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink/10 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <span className="text-sm text-ink-muted">{ar ? 'نفهم الطفل، مش نقيسه بمسطرة واحدة' : 'Understanding, not standardizing.'}</span>
          </div>
          <p className="text-xs text-ink-muted text-center sm:text-end max-w-md">
            {ar
              ? 'IRIS نموذج أولي للتقييم مبني على إطار أدلة بحثي — ليس معتمدًا إكلينيكيًا ولا يقدم تشخيصًا أو نصيحة طبية.'
              : 'IRIS is a research-framed assessment prototype — not clinically validated, and it offers no diagnosis and no medical advice.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
