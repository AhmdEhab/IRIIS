import React, { useEffect } from 'react';
import {
  Accessibility, Apple, ArrowLeft, ArrowRight, AudioLines, BarChart3,
  BookOpen, Check, CircleCheck, Gamepad2, HeartHandshake, Languages,
  Layers, Puzzle, ShieldCheck, Sparkles, Sprout,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LandingHeader, landingLinks } from './LandingHeader';
import { LandingButton, LandingSection, SectionHeading } from './LandingPrimitives';
import { LearningPreview } from './LearningPreview';
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

  const steps = [
    [text('اعمل حساب للأهل', 'Create a parent account'), text('عرّفنا بطفلك واحتياجاته.', 'Tell us a little about your child.')],
    [text('نلعب ونتعرّف عليه', 'Start with a playful session'), text('أنشطة قصيرة، مش امتحان.', 'Short activities, not an exam.')],
    [text('نفهم منين نبدأ', 'Find the right starting point'), text('مهارات قوية ومهارات لسه بتتبني.', 'See strengths and skills still developing.')],
    [text('نختار أنشطة على مقاسه', 'Build a personal learning plan'), text('خطوات صغيرة بالسرعة المناسبة.', 'Small steps, at a comfortable pace.')],
    [text('نتابع التقدم سوا', 'Follow progress together'), text('لمحة واضحة وأفكار تكمل بيها في البيت.', 'A clear snapshot and ideas for home.')],
  ];

  return (
    <div className="iris-landing" dir={ar ? 'rtl' : 'ltr'} lang={language}>
      <a className="lp-skip" href="#landing-main">{text('انتقل للمحتوى', 'Skip to content')}</a>
      <LandingHeader onLogin={onLogin} onStart={goStart} isAuthenticated={isAuthenticated} />
      <main id="landing-main" tabIndex={-1}>
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-pill"><Sparkles aria-hidden="true" />{text('تعلّم على مقاس طفلك', 'Learning, at their own pace')}</p>
              <h1 id="hero-title">
                {ar ? <><span>نفهم الطفل، <mark>مش نقيسه</mark></span><span>بمسطرة واحدة.</span></> : <><span>One child.</span><span><mark>Their own</mark> path.</span></>}
              </h1>
              <p className="lp-hero-description">{text(
                'رحلة تعلّم متكيفة للأطفال من أصحاب الإعاقة الذهنية والتوحد وتأخر النمو. نفهم مهارات طفلك، ونبني معاه خطوة خطوة — وإنت معاه في كل خطوة.',
                'Adaptive learning for children with intellectual and developmental disabilities. We get to know their skills and build step by step — with you beside them all the way.',
              )}</p>
              <div className="lp-cta-row">
                <LandingButton onClick={goStart} data-testid="hero-start"><Sparkles aria-hidden="true" />{isAuthenticated ? text('كمل رحلة طفلك', 'Continue your journey') : text('ابدأ رحلة طفلك', 'Start your child’s journey')}</LandingButton>
                {!isAuthenticated && <LandingButton variant="secondary" onClick={onLogin} data-testid="hero-login">{text('عندي حساب', 'I have an account')}</LandingButton>}
              </div>
              <ul className="lp-trust" aria-label={text('عن المنصة', 'About the platform')}>
                <li><ShieldCheck aria-hidden="true" />{text('بلا تشخيص ولا درجات ذكاء', 'No diagnosis or IQ scores')}</li>
                <li><Languages aria-hidden="true" />{text('عربي وإنجليزي', 'Arabic & English')}</li>
              </ul>
            </div>
            <div className="lp-hero-visual">
              <img className="lp-hero-art" src="/images/landing/hero-learning.jpg" width={1400} height={1050} fetchPriority="high" alt={text('طفلان يتعلّمان باللعب مع شخصية IRIS والحروف والمكعبات', 'Two children learning through play with the IRIS companion, a book and colorful blocks')} />
              <a className="lp-activity-dock" href="#experience" data-testid="hero-preview-link">
                <span className="lp-dock-object"><Apple aria-hidden="true" /></span>
                <span className="lp-dock-copy"><span className="lp-small-label">{text('لمحة من تجربة التعلّم', 'A little learning preview')}</span><strong>{text('استكشف. اسمع. جرّب.', 'Explore. Listen. Try.')}</strong></span>
                <span className="lp-dock-link">{text('جرّب بنفسك', 'Try it')}<Arrow aria-hidden="true" /></span>
              </a>
            </div>
          </div>
        </section>

        <LandingSection id="about">
          <div className="lp-editorial-grid">
            <SectionHeading id="about" eyebrow={text('أهلًا بيك في IRIS', 'Meet IRIS')} title={text('كل طفل له طريقه. نلاقيه سوا.', 'Every child has a path. Let’s find it together.')} />
            <div className="lp-editorial-copy">
              <p className="lp-lead">{text('IRIS بتجمع التعرّف على المهارات، الأنشطة المناسبة، ومتابعة الأهل في رحلة واحدة. من أول جلسة لعب لخطوات التعلّم اليومية، البداية بتكون من الطفل نفسه.', 'IRIS brings skill discovery, meaningful activities and parent follow-up into one journey. From the first playful session to everyday learning, the starting point is always your child.')}</p>
              <div className="lp-facts">
                <div><Layers aria-hidden="true" /><strong>{text('٥ مستويات لكل مهارة', '5 levels per skill')}</strong></div>
                <div><Gamepad2 aria-hidden="true" /><strong>{text('جلسات قصيرة', 'Short sessions')}</strong></div>
                <div><HeartHandshake aria-hidden="true" /><strong>{text('أفكار للبيت', 'Ideas for home')}</strong></div>
              </div>
            </div>
          </div>
        </LandingSection>

        <LandingSection id="problem" tone="warm" className="lp-problem-section">
          <div className="lp-problem-layout">
            <div className="lp-problem-note"><BookOpen aria-hidden="true" /><p>{text('رقم واحد مش بيحكي حكاية طفل.', 'One number cannot tell a child’s story.')}</p><span>{text('المهم نفهم: نبدأ منين؟ وندعم إزاي؟', 'What matters is where to begin — and how to help.')}</span></div>
            <SectionHeading id="problem" eyebrow={text('المشكلة اللي بنحلّها', 'The problem we solve')} title={text('مش مقارنة. فرصة أحسن للتعلّم.', 'Not comparison. A better chance to learn.')} description={text('الاختبار القياسي ممكن يدي رقم، لكن الأهل محتاجين خطوة واضحة. IRIS بتساعدك تفهم نقاط القوة والمهارات اللي محتاجة دعم، وتحول الفهم ده لأنشطة عملية — من غير مقارنة بطفل تاني.', 'A standard test may give a number. Families need a useful next step. IRIS connects strengths and developing skills to practical activities — without comparing one child with another.')} />
          </div>
        </LandingSection>

        <LandingSection id="how">
          <SectionHeading id="how" centered eyebrow={text('من أول خطوة', 'From the very first step')} title={text('رحلة بسيطة. وخطوات ليها معنى.', 'A simple journey. Meaningful steps.')} description={text('من حساب الأهل لخطة يومية، كل خطوة بتبني على اللي قبلها.', 'From a parent account to an everyday plan, each step builds on the last.')} />
          <div className="lp-how-layout">
            <div className="lp-journey-art"><img src="/images/landing/journey-3d.jpg" width={1600} height={900} loading="lazy" alt={text('رسم تعليمي يوضح رحلة الطفل من التعرّف على المهارات إلى متابعة التقدم', 'An illustration of the learning journey from skill discovery to progress follow-up')} /><p>{text('كل خطوة صغيرة تستحق التشجيع.', 'Every little step deserves encouragement.')}</p></div>
            <ol className="lp-step-list">
              {steps.map(([title, description], index) => <li key={index}><span className="lp-step-number">{ar ? ['١', '٢', '٣', '٤', '٥'][index] : index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}
            </ol>
          </div>
        </LandingSection>

        <LandingSection id="features" tone="blue">
          <div className="lp-feature-layout">
            <div>
              <SectionHeading id="features" eyebrow={text('التعلّم المتكيف', 'Adaptive by design')} title={text('خطة بتتغيّر مع طفلك.', 'A plan that grows with your child.')} description={text('السلّم بيتحرك حسب أداء الطفل، مش تشخيصه. خطوة أصعب لما يكون مستعد، ودعم أكتر لما يحتاج — من غير ضغط ولا استعجال.', 'The learning ladder responds to performance, not a diagnosis. A new challenge when they’re ready; more support when they need it. No pressure, no rush.')} />
              <ul className="lp-feature-list">
                {[
                  [<Puzzle aria-hidden="true" />, text('أنشطة شخصية', 'Personalized activities'), text('على مستوى المهارة الحالي، مش على عمر الطفل بس.', 'Matched to current skills, not just age.')],
                  [<AudioLines aria-hidden="true" />, text('تعليمات مسموعة', 'Audio-supported learning'), text('بالعربي والإنجليزي، حتى قبل القراءة.', 'Arabic and English, even before reading.')],
                  [<BarChart3 aria-hidden="true" />, text('تقدم محفوظ', 'Progress that stays'), text('بيانات التعلّم محفوظة في حسابك للمتابعة.', 'Learning records are saved for parent follow-up.')],
                ].map(([icon, title, description], index) => <li key={index}><span className="lp-feature-icon">{icon}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}
              </ul>
            </div>
            <div className="lp-ladder-panel" role="figure" aria-label={text('رسم توضيحي لخمسة مستويات للمهارة', 'Illustrative five-level learning ladder')}>
              <div className="lp-ladder-heading"><Sprout aria-hidden="true" /><strong>{text('خطوة خطوة', 'One step at a time')}</strong><span>{text('رسم توضيحي', 'Illustration')}</span></div>
              <ol className="lp-ladder">
                {[
                  text('نتعرّف على المهارة', 'Discover the skill'),
                  text('نجرّب مع دعم', 'Try it with support'),
                  text('نتمرّن ونكتشف', 'Practice and explore'),
                  text('نحل بثقة أكتر', 'Build confidence'),
                  text('نستعد لخطوة جديدة', 'Get ready for the next step'),
                ].map((label, index) => <li key={index}><span>{ar ? ['١', '٢', '٣', '٤', '٥'][index] : index + 1}</span><strong>{label}</strong><Check aria-hidden="true" /></li>)}
              </ol>
              <p>{text('كل مهارة لها مسارها — ومش لازم تتقدم كلها بنفس السرعة.', 'Each skill has its own path. They don’t all need to grow at the same pace.')}</p>
            </div>
          </div>
        </LandingSection>

        <LandingSection id="experience">
          <SectionHeading id="experience" centered eyebrow={text('التعلّم باللعب', 'Learning through play')} title={text('حاجات صغيرة. اكتشافات كبيرة.', 'Little activities. Big discoveries.')} description={text('حروف وكلمات، أرقام وأنماط، قصص وفواكه وأشكال. محتوى يساعد الطفل يجرّب ويتفاعل، مش يتفرّج وبس.', 'Letters and words, numbers and patterns, stories and objects. Activities that invite children to take part, not just watch.')} />
          <div className="lp-activities-layout">
            <div className="lp-activity-copy">
              <h3>{text('جرّب جزء من التجربة دلوقتي.', 'Try a little of the experience.')}</h3>
              <p>{text('دي نفس المجسّمات الموجودة في الأنشطة. اختار حاجة، شغّل النموذج، ولفّه من كل ناحية. مش محتاج حساب عشان تستكشف.', 'These are the same models used in activities. Choose one, start the preview and turn it around. No account needed to explore.')}</p>
              <ul className="lp-activity-points"><li><CircleCheck aria-hidden="true" />{text('لمس واستكشاف', 'Touch and explore')}</li><li><CircleCheck aria-hidden="true" />{text('بديل ثابت للأجهزة الأضعف', 'Static alternatives for lighter devices')}</li><li><CircleCheck aria-hidden="true" />{text('تحكم من غير حركة تلقائية', 'You control the motion')}</li></ul>
              <LandingButton variant="secondary" onClick={goStart} data-testid="activities-start">{text('اكتشف أنشطة طفلك', 'Discover your child’s activities')}<Arrow aria-hidden="true" /></LandingButton>
            </div>
            <LearningPreview />
          </div>
        </LandingSection>

        <LandingSection id="parents" tone="purple">
          <div className="lp-parent-layout">
            <div className="lp-parent-image"><img src="/images/landing/parent-support.jpg" width={1400} height={1050} loading="lazy" alt={text('أم تساعد طفلها على التعلّم في البيت باستخدام IRIS', 'A parent helping their child learn at home with IRIS')} /></div>
            <div>
              <SectionHeading id="parents" eyebrow={text('وضع الوالدين', 'Made for parents, too')} title={text('إنت مش متفرّج. إنت شريك.', 'Not on the sidelines. Part of the journey.')} description={text('لمحة واضحة عن التعلّم، من غير مصطلحات مخوّفة. افهم نقاط القوة، تابع اللي بيتبني، وخد أفكار بسيطة تكمل بيها مع طفلك في البيت.', 'A clear learning snapshot, without intimidating jargon. Understand strengths, follow developing skills and find simple ways to support learning at home.')} />
              <ul className="lp-parent-list"><li><Check aria-hidden="true" />{text('نقاط قوة وخطوات محتاجة دعم', 'Strengths and skills needing support')}</li><li><Check aria-hidden="true" />{text('إرشاد عملي للبيت', 'Practical ideas for home')}</li><li><Check aria-hidden="true" />{text('تحكم في الصوت والحركة والحسّيات', 'Sound, motion and sensory controls')}</li><li><Check aria-hidden="true" />{text('الأسئلة الطبية لمختص', 'Medical questions go to professionals')}</li></ul>
              <LandingButton onClick={goStart} data-testid="parents-start">{isAuthenticated ? text('افتح وضع الوالدين', 'Open Parent Mode') : text('ابدأ مع طفلك', 'Start with your child')}<Arrow aria-hidden="true" /></LandingButton>
            </div>
          </div>
        </LandingSection>

        <LandingSection id="why">
          <SectionHeading id="why" centered eyebrow={text('ليه IRIS؟', 'Why IRIS?')} title={text('تعلّم أقرب للطفل. وأوضح للأهل.', 'Closer to your child. Clearer for you.')} />
          <div className="lp-values">
            {[
              [<Puzzle aria-hidden="true" />, text('شخصي', 'Personal'), text('المسار يبدأ من الطفل نفسه.', 'A path that starts with the child.')],
              [<Accessibility aria-hidden="true" />, text('مريح ومتاح', 'Accessible'), text('لغة بسيطة ودعم للصوت والحسّيات.', 'Plain language, audio and sensory support.')],
              [<HeartHandshake aria-hidden="true" />, text('قريب من البيت', 'At home'), text('خطوات صغيرة وسط اليوم العادي.', 'Small steps in an ordinary day.')],
              [<Gamepad2 aria-hidden="true" />, text('مُشوّق', 'Engaging'), text('اكتشاف ولعب، من غير مقارنة.', 'Play and discovery, without comparison.')],
            ].map(([icon, title, description], index) => <div className="lp-value" key={index}><span>{icon}</span><h3>{title}</h3><p>{description}</p></div>)}
          </div>
        </LandingSection>

        <LandingSection id="start" className="lp-final-section">
          <div className="lp-final-cta">
            <p className="lp-eyebrow">{text('خطوة صغيرة النهارده', 'A little step today')}</p>
            <h2 id="start-title">{text('كل طفل وله سلّمه. يلا نلاقيه.', 'Every child has their own ladder. Let’s find it.')}</h2>
            <p>{text('ابدأ بجلسة تعرّف فيها لعب واكتشاف، وشوف أول خطوة مناسبة لطفلك.', 'Begin with a playful getting-to-know session and discover a meaningful first step.')}</p>
            <div className="lp-cta-row"><LandingButton variant="inverse" onClick={goStart} data-testid="final-start"><Sparkles aria-hidden="true" />{isAuthenticated ? text('كمل الرحلة', 'Continue the journey') : text('ابدأ رحلة طفلك', 'Start your child’s journey')}</LandingButton>{!isAuthenticated && <LandingButton variant="text" onClick={onLogin} data-testid="final-login">{text('عندي حساب', 'I have an account')}</LandingButton>}</div>
          </div>
        </LandingSection>
      </main>
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand"><a href="/" aria-label={text('IRIS — الرئيسية', 'IRIS — home')}><img src="/images/iris-logo-tight.png" width={726} height={509} alt="IRIS" /></a><p>{text('رحلة تعلّم متكيفة تبدأ بالطفل، وتكمل مع الأسرة.', 'An adaptive learning journey that starts with the child and grows with the family.')}</p></div>
          <nav aria-label={text('روابط أسفل الصفحة', 'Footer navigation')}><h3>{text('اكتشف IRIS', 'Explore IRIS')}</h3>{landingLinks(ar).map(link => <a href={link.href} key={link.href}>{link.label}</a>)}<a href="#experience">{text('جرّب التعلّم التفاعلي', 'Try interactive learning')}</a></nav>
          <div className="lp-footer-note"><h3>{text('تعلّم مساعد. مش تشخيص.', 'Supportive learning. Not diagnosis.')}</h3><p>{text('IRIS نموذج أولي مبني على إطار أدلة بحثي للتقييم والتعليم المساند. لا يقدم تشخيصًا أو نصيحة طبية، ولا يحل محل المختصين.', 'IRIS is a research-framed prototype for assessment and supportive learning. It does not provide diagnosis or medical advice, and does not replace specialists.')}</p></div>
        </div>
        <div className="lp-container lp-footer-bottom"><span>© 2026 IRIS</span><span>{text('نفهم الطفل، مش نقيسه بمسطرة واحدة.', 'Understanding, not standardizing.')}</span></div>
      </footer>
    </div>
  );
}
