import React, { useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Compass, HeartHandshake,
  Languages, Route, ShieldCheck, Sparkles, Star,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LandingHeader, landingLinks } from './LandingHeader';
import { LandingButton, LandingSection, SectionHeading } from './LandingPrimitives';
import { LearningPreview } from './LearningPreview';
import { PersonalizedPaths } from './PersonalizedPaths';
import { LearningAreas } from './LearningAreas';
import { FaqSection } from './FaqSection';
import { Blob, JourneyArc, Reveal, Sparkle, WaveDivider } from './LandingDecor';
import { IrisMascot } from '../iris/ui/IrisMascot';
import { IrisBuddy } from '../iris/ui/IrisBuddy';
import './landing.css';

export function LandingPage({ onLogin, onRegister, onAppMode, isAuthenticated }: {
  onLogin: () => void;
  onRegister: () => void;
  onAppMode: () => void;
  isAuthenticated: boolean;
}) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const reduced = useReducedMotion();
  const goStart = isAuthenticated ? onAppMode : onRegister;
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const text = (arabic: string, english: string) => ar ? arabic : english;

  useEffect(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : 'smooth';
    return () => { document.documentElement.style.scrollBehavior = previous; };
  }, [reduced]);

  const beliefs = [
    { icon: <Compass aria-hidden="true" />, title: text('كل طفل توصله طريقة مختلفة', 'Every child is reached differently'), body: text('مش أسلوب واحد ينفع للجميع — ولا طفل أقل من طريقة تناسبه.', 'One method does not fit all — and no child is out of reach of the right one.') },
    { icon: <Route aria-hidden="true" />, title: text('الخطوة الجاية أهم من الرقم', 'The next step beats the score'), body: text('الأرقام بتوصف الطفل مرة، لكن الخطوة المناسبة تمشي بيه.', 'A number describes a child once; the right step moves them forward.') },
    { icon: <HeartHandshake aria-hidden="true" />, title: text('الأهل جزء من الرحلة', 'Parents are part of the journey'), body: text('فهم بسيط ودعم بيتكم — مش مصطلحات ومخاوف.', 'Plain understanding and support at home — not jargon and worry.') },
  ];

  const steps = [
    { title: text('افهم الطفل', 'Understand the child'), body: text('الأهل يعملوا حساب ويحكوا عن طفلهم.', 'A parent signs up and shares who their child is.') },
    { title: text('خصّص الرحلة', 'Personalize the journey'), body: text('IRIS تعرّف مستوى المهارات بلعب، مش امتحان.', 'IRIS discovers skill levels through play, not exams.') },
    { title: text('تعلّم واستكشف', 'Learn and explore'), body: text('أنشطة يومية بتتكيّف مع كل مهارة.', 'Daily activities that adapt to every skill.') },
    { title: text('تقدّم ومتابعة', 'Progress together'), body: text('لمحة واضحة للأهل وأفكار للبيت.', 'A clear snapshot and ideas for home.') },
  ];

  return (
    <div className="iris-landing" dir={ar ? 'rtl' : 'ltr'} lang={language}>
      <a className="lp-skip" href="#landing-main">{text('انتقل للمحتوى', 'Skip to content')}</a>
      <LandingHeader onLogin={onLogin} onStart={goStart} isAuthenticated={isAuthenticated} />
      <main id="landing-main" tabIndex={-1}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-hero-bg" aria-hidden="true">
            <Blob className="lp-bg-blob lp-bg-blob--1" fill="var(--brand-yellow-wash)" />
            <Blob className="lp-bg-blob lp-bg-blob--2" fill="var(--brand-blue-wash)" />
            <Blob className="lp-bg-blob lp-bg-blob--3" fill="var(--brand-green-wash)" />
            <Sparkle className="lp-bg-spark lp-bg-spark--1" />
            <Sparkle className="lp-bg-spark lp-bg-spark--2" fill="var(--brand-coral)" />
            <Sparkle className="lp-bg-spark lp-bg-spark--3" fill="var(--brand-purple)" />
            <Sparkle className="lp-bg-spark lp-bg-spark--4" fill="var(--brand-green)" />
          </div>
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <Reveal>
                <p className="lp-pill"><Sparkles aria-hidden="true" />{text('تعلّم على مقاس طفلك', 'Learning, at their own pace')}</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 id="hero-title">
                  {ar
                    ? <><span>كل طفل له</span><span><mark>طريقته</mark> في التألق.</span></>
                    : <><span>Every child has</span><span>their <mark>own way</mark> to shine.</span></>}
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="lp-hero-description">{text(
                  'IRIS تبني رحلة تعلّم متكيفة حسب مهارات طفلك وقدراته — يتعلّم، ينمّي، ويحقق تقدّم حقيقي بالسرعة اللي تناسبه.',
                  'IRIS creates personalized learning experiences that adapt to every child\u2019s abilities — helping them learn, grow and make real progress at their own pace.',
                )}</p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="lp-cta-row">
                  <LandingButton onClick={goStart} data-testid="hero-start"><Sparkles aria-hidden="true" />{isAuthenticated ? text('كمل رحلة طفلك', 'Continue your journey') : text('ابدأ مع IRIS', 'Get started')}</LandingButton>
                  <a className="lp-button lp-button--secondary" href="#about">{text('اكتشف IRIS', 'Discover IRIS')}<Arrow aria-hidden="true" /></a>
                </div>
                <p className="lp-hero-alt">{isAuthenticated ? null : <><span>{text('عندك حساب بالفعل؟', 'Already have an account?')}</span><button type="button" className="lp-link" onClick={onLogin} data-testid="hero-login">{text('سجّل دخول', 'Log in')}</button></>}</p>
              </Reveal>
              <Reveal delay={0.32}>
                <ul className="lp-trust" aria-label={text('عن المنصة', 'About the platform')}>
                  <li><ShieldCheck aria-hidden="true" />{text('بلا تشخيص ولا درجات ذكاء', 'No diagnosis or IQ scores')}</li>
                  <li><Languages aria-hidden="true" />{text('عربي وإنجليزي', 'Arabic & English')}</li>
                </ul>
              </Reveal>
            </div>
            <div className="lp-hero-visual">
              <div className="lp-hero-stage" role="img" aria-label={text('شخصية IRIS حوالينها كروت تعلّم صغيرة: حرف، عدّ، وتقدّم', 'The IRIS companion surrounded by little learning cards: a letter, counting and progress')}>
                <span className="lp-hero-glow" aria-hidden="true" />
                <div className="lp-hero-beads lp-hero-beads--outer" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, i) => <i key={`o${i}`} style={{ transform: `rotate(${i * 30}deg) translateY(calc(-1 * var(--bead-r)))` }} />)}
                </div>
                <div className="lp-hero-beads lp-hero-beads--inner" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => <i key={`i${i}`} style={{ transform: `rotate(${i * 45}deg) translateY(calc(-1 * var(--bead-r)))` }} />)}
                </div>
                <div className="lp-hero-mascot">
                  <IrisBuddy mood="happy" className="lp-hero-buddy" />
                  <span className="lp-hero-pedestal" aria-hidden="true" />
                </div>
                <div className="lp-mini-card lp-mini-card--letters" aria-hidden="true">
                  <span className="lp-mini-glyph lp-mini-glyph--blue">{ar ? 'أ' : 'A'}</span>
                  <span><strong>{ar ? 'أرنب' : 'Rabbit'}</strong><small>{ar ? 'حرف ألف 🐰' : 'the letter A 🐰'}</small></span>
                </div>
                <div className="lp-mini-card lp-mini-card--count" aria-hidden="true">
                  <span className="lp-mini-glyph lp-mini-glyph--green">{ar ? '٣' : '3'}</span>
                  <span><strong>{ar ? 'برتقالات' : 'Oranges'}</strong><small>{ar ? 'عدّ باللمس 🍊' : 'count by touch 🍊'}</small></span>
                </div>
                <div className="lp-mini-card lp-mini-card--progress" aria-hidden="true">
                  <small>{text('تقدّم النهارده', 'Progress today')}</small>
                  <div className="lp-mini-bars"><i style={{ width: '82%' }} /><i style={{ width: '58%' }} /><i style={{ width: '34%' }} /></div>
                  <span className="lp-mini-check"><Check aria-hidden="true" /></span>
                </div>
                <Sparkle className="lp-hero-spark lp-hero-spark--a" aria-hidden="true" />
                <Sparkle className="lp-hero-spark lp-hero-spark--b" fill="var(--brand-coral)" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        <WaveDivider className="lp-wave--hero" fill="var(--surface)" />

        {/* ── Belief ───────────────────────────────────────── */}
        <LandingSection id="about">
          <div className="lp-belief-layout">
            <Reveal className="lp-belief-head">
              <p className="lp-eyebrow">{text('أهلًا بيك في IRIS', 'Meet IRIS')}</p>
              <h2 id="about-title">{ar ? <>مش كل الأطفال بيتعلّموا <mark>بنفس الطريقة</mark>.</> : <>Children do not all learn the <mark>same way</mark>.</>}</h2>
              <p className="lp-lead">{text(
                'لو الطريقة واحدة، بعض الأطفال هيقفوا عند أول خطوة. IRIS بتبدأ من الطفل نفسه — مهاراته، اهتماماته، وسرعته.',
                'If every child is taught one way, some stop at the very first step. IRIS starts from the child — their skills, interests and pace.',
              )}</p>
            </Reveal>
            <ul className="lp-beliefs">
              {beliefs.map((belief, index) => (
                <Reveal as="li" className="lp-belief" key={belief.title} delay={index * 0.1} y={20}>
                  <span className="lp-belief-icon">{belief.icon}</span>
                  <h3>{belief.title}</h3>
                  <p>{belief.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </LandingSection>

        {/* ── How it works ─────────────────────────────────── */}
        <LandingSection id="how" tone="warm" className="lp-how-section">
          <SectionHeading id="how" centered eyebrow={text('من أول خطوة', 'From the very first step')} title={text('رحلة بسيطة، خطوات ليها معنى', 'A simple journey with meaningful steps')} description={text('من حساب الأهل لخطة يومية، كل خطوة بتبني على اللي قبلها.', 'From a parent account to an everyday plan, each step builds on the last.')} />
          <div className="lp-steps-shell">
            <JourneyArc />
            <ol className="lp-steps">
              {steps.map((step, index) => (
                <Reveal as="li" className="lp-step" key={step.title} delay={index * 0.12} y={22}>
                  <span className={`lp-step-badge lp-step-badge--${index + 1}`}>{ar ? ['١', '٢', '٣', '٤'][index] : index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </LandingSection>

        {/* ── Personalized learning ────────────────────────── */}
        <LandingSection id="features" tone="blue">
          <SectionHeading id="features" centered eyebrow={text('تعلّم متكيّف بالتصميم', 'Adaptive by design')} title={text('نفس المنصة. مسار مختلف.', 'Same platform. Different path.')} description={text('كل مهارة ليها ٥ مستويات، وIRIS تختار المستوى اللي يناسب كل طفل.', 'Every skill has 5 levels — IRIS picks the one that fits each child.')} />
          <Reveal y={22}><PersonalizedPaths /></Reveal>
        </LandingSection>

        {/* ── Learning through play: areas + live preview ──── */}
        <LandingSection id="experience">
          <SectionHeading id="experience" centered eyebrow={text('التعلّم باللعب', 'Learning through play')} title={text('حاجات صغيرة. اكتشافات كبيرة.', 'Little activities. Big discoveries.')} description={text('المجالات اللي IRIS بتبني عليها الأنشطة — كلها موجودة فعلًا في التطبيق، بالعربي والإنجليزي ومعاهم تعليمات صوتية.', 'The areas IRIS builds activities on — all of them already live in the app, in Arabic and English, with spoken instructions.')} />
          <LearningAreas />
          <div className="lp-activities-layout">
            <div className="lp-activity-copy">
              <Reveal>
                <h3>{text('جرّب جزء من التجربة دلوقتي.', 'Try a little of the experience.')}</h3>
                <p>{text('دي نفس المجسّمات الموجودة في الأنشطة. اختار حاجة، شغّل النموذج، ولفّه من كل ناحية. مش محتاج حساب عشان تستكشف.', 'These are the same models used in activities. Choose one, start the preview and turn it around. No account needed to explore.')}</p>
                <ul className="lp-activity-points">
                  <li><Check aria-hidden="true" />{text('لمس واستكشاف', 'Touch and explore')}</li>
                  <li><Check aria-hidden="true" />{text('بديل ثابت للأجهزة الأضعف', 'Static alternatives for lighter devices')}</li>
                  <li><Check aria-hidden="true" />{text('تحكم من غير حركة تلقائية', 'You control the motion')}</li>
                </ul>
                <LandingButton variant="secondary" onClick={goStart} data-testid="activities-start">{text('اكتشف أنشطة طفلك', 'Discover your child\u2019s activities')}<Arrow aria-hidden="true" /></LandingButton>
              </Reveal>
            </div>
            <Reveal delay={0.1} y={22}><LearningPreview /></Reveal>
          </div>
        </LandingSection>

        {/* ── Supporting parents ───────────────────────────── */}
        <LandingSection id="parents" tone="purple">
          <div className="lp-parent-layout">
            <div>
              <SectionHeading id="parents" eyebrow={text('وضع الوالدين', 'Made for parents, too')} title={text('إنت مش متفرّج. إنت شريك.', 'Not on the sidelines. Part of the journey.')} description={text('لمحة واضحة عن التعلّم، من غير مصطلحات مخوّفة. افهم نقاط القوة، تابع اللي بيتبني، وخد أفكار بسيطة تكمل بيها مع طفلك في البيت.', 'A clear learning snapshot, without intimidating jargon. Understand strengths, follow developing skills and find simple ways to support learning at home.')} />
              <Reveal delay={0.1}>
                <LandingButton onClick={goStart} data-testid="parents-start">{isAuthenticated ? text('افتح وضع الوالدين', 'Open Parent Mode') : text('ابدأ مع طفلك', 'Start with your child')}<Arrow aria-hidden="true" /></LandingButton>
              </Reveal>
            </div>
            <Reveal delay={0.08} y={24}>
              <div className="lp-snapshot-card" role="img" aria-label={text('نموذج لمحة تعلّم من وضع الوالدين: نقاط قوة ومهارات قيد التطوير', 'A sample learning snapshot from Parent Mode: strengths and skills still developing')}>
                <div className="lp-snapshot-head">
                  <span className="lp-snapshot-avatar" aria-hidden="true"><IrisMascot mood="idle" size="sm" language={ar ? 'ar' : 'en'} /></span>
                  <div><h4>{text('لمحة التعلّم', 'Learning snapshot')}</h4><p>{text('آخر جلسة: لعب واستكشاف', 'Last session: play and explore')}</p></div>
                  <Star className="lp-snapshot-star" aria-hidden="true" />
                </div>
                <div className="lp-snap-group">
                  <span className="lp-snap-tag lp-snap-tag--strength">{text('نقاط قوة', 'Strengths')}</span>
                  <ul>
                    <li><span>{text('التمييز بين الأصوات', 'Sound matching')}</span><b>{ar ? '٤/٥' : '4/5'}</b></li>
                    <li><span>{text('عدّ الأشياء الصغيرة', 'Counting small things')}</span><b>{ar ? '٣/٥' : '3/5'}</b></li>
                  </ul>
                </div>
                <div className="lp-snap-group">
                  <span className="lp-snap-tag lp-snap-tag--developing">{text('لسه بتتبني', 'Still building')}</span>
                  <ul>
                    <li><span>{text('ربط الحرف بالصوت', 'Letter-sound links')}</span><span className="lp-snap-bar" aria-hidden="true"><i style={{ width: '60%' }} /></span></li>
                    <li><span>{text('أنماط بسيطة', 'Simple patterns')}</span><span className="lp-snap-bar" aria-hidden="true"><i style={{ width: '35%' }} /></span></li>
                  </ul>
                </div>
                <p className="lp-snap-tip">{text('اقتراح النهارده: لعبة الحروف الصوتية.', 'Today\u2019s idea: the letter-sound game.')}</p>
              </div>
            </Reveal>
          </div>
        </LandingSection>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <LandingSection id="faq">
          <SectionHeading id="faq" centered eyebrow={text('أسئلة شائعة', 'Good questions')} title={text('حاجات الأهل بيسألوا عنها.', 'What families ask us.')} />
          <div className="lp-faq-wrap"><FaqSection /></div>
        </LandingSection>

        {/* ── Final CTA ────────────────────────────────────── */}
        <LandingSection id="start" className="lp-final-section">
          <div className="lp-final-cta">
            <Blob className="lp-final-blob lp-final-blob--1" fill="var(--brand-blue-ink)" aria-hidden="true" />
            <Sparkle className="lp-final-spark lp-final-spark--1" />
            <Sparkle className="lp-final-spark lp-final-spark--2" fill="var(--brand-coral)" />
            <p className="lp-eyebrow">{text('خطوة صغيرة النهارده', 'A little step today')}</p>
            <h2 id="start-title">{text('كل طفل وله سلّمه. يلا نلاقيه.', 'Every child has their own ladder. Let\u2019s find it.')}</h2>
            <p>{text('ابدأ بجلسة تعرّف فيها لعب واكتشاف، وشوف أول خطوة مناسبة لطفلك.', 'Begin with a playful getting-to-know session and discover a meaningful first step.')}</p>
            <div className="lp-cta-row">
              <LandingButton variant="inverse" onClick={goStart} data-testid="final-start"><Sparkles aria-hidden="true" />{isAuthenticated ? text('كمل الرحلة', 'Continue the journey') : text('ابدأ رحلة طفلك', 'Start your child\u2019s journey')}</LandingButton>
              {!isAuthenticated && <LandingButton variant="text" className="lp-final-login" onClick={onLogin} data-testid="final-login">{text('عندي حساب', 'I have an account')}</LandingButton>}
            </div>
          </div>
        </LandingSection>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand"><a href="/" aria-label={text('IRIS — الرئيسية', 'IRIS — home')}><img src="/images/iris-logo-tight.png" width={726} height={509} alt="IRIS" /></a><p>{text('رحلة تعلّم متكيفة تبدأ بالطفل، وتكمل مع الأسرة.', 'An adaptive learning journey that starts with the child and grows with the family.')}</p></div>
          <nav aria-label={text('روابط أسفل الصفحة', 'Footer navigation')}><h3>{text('اكتشف IRIS', 'Explore IRIS')}</h3>{landingLinks(ar).map(link => <a href={link.href} key={link.href}>{link.label}</a>)}</nav>
          <div className="lp-footer-note"><h3>{text('تعلّم مساعد. مش تشخيص.', 'Supportive learning. Not diagnosis.')}</h3><p>{text('IRIS نموذج أولي مبني على إطار أدلة بحثي للتقييم والتعليم المساند. لا يقدم تشخيصًا أو نصيحة طبية، ولا يحل محل المختصين.', 'IRIS is a research-framed prototype for assessment and supportive learning. It does not provide diagnosis or medical advice, and does not replace specialists.')}</p></div>
        </div>
        <div className="lp-container lp-footer-bottom"><span>© 2026 IRIS</span><span>{text('نفهم الطفل، مش نقيسه بمسطرة واحدة.', 'Understanding, not standardizing.')}</span></div>
      </footer>
    </div>
  );
}
