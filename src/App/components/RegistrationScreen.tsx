import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Baby, Users, Brain, Check, Sparkles } from 'lucide-react';
import { useApp, ChildProfile, Condition } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { authMessage } from '../authMessages';
import { ChromeActions } from './iris/ui/ChromeActions';
import { AuthShell } from './auth/AuthShell';

/**
 * Parent registration — three steps: the child, the family, the condition.
 *
 * ── WHAT THE AUTH RESKIN CHANGED ──────────────────────────────────────────
 * Presentation only. The screen now composes itself inside <AuthShell/>, the
 * same cream scene, ambient blobs, white plate and pill CTA as the marketing
 * hero, so signing up looks like the same product that persuaded someone to
 * sign up. Inside that frame:
 *
 *   * One plate, not two. Each step used to render its own bordered Card on
 *     top of the screen's card, so the wizard was a box inside a box. The step
 *     is now a section — a colour chip, a heading, its fields — and the white
 *     plate belongs to the screen.
 *   * The step indicator keeps its three labelled pills (the format the
 *     comment below defends) and keeps its `role="progressbar"` semantics;
 *     only the paint changed, via classes.
 *   * Labels are now bound to their inputs with id/htmlFor. Before the reskin
 *     they were adjacent `<label>` elements with no association, so a screen
 *     reader announcing "edit text" had nothing to say about what the field
 *     was. No string, value or name moved.
 *   * The heading appears once, as the card's `<h1>`. It used to render in the
 *     top bar AND as a `DisplayTitle` under it — the same defect (D4) the
 *     landing audit caught with the logo above a retyped heading.
 *
 * Step flow, validation, the speak/play prompts, `startTransition` and the
 * submit path are untouched, as is the `dir` handling on the chevrons.
 */
export function RegistrationScreen() {
  const { registerUser, authError, clearAuthError, navigateTo, startTransition } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language, dir } = useLanguage();

  const handleBack = () => {
    playSound('tap');
    navigateTo('marketing');
  };

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [consentGiven, setConsentGiven] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | '',
    country: '',
    city: '',
    motherName: '',
    motherJob: '',
    fatherName: '',
    fatherJob: '',
    phone: '',
    condition: '' as Condition | ''
  });

  const conditions: { id: Condition; name: string; icon: string }[] = [
    { id: 'down-syndrome', name: t.downSyndrome, icon: '🧬' },
    { id: 'autism', name: t.autism, icon: '🧩' },
    { id: 'williams', name: t.williams, icon: '💙' },
    { id: 'fragile-x', name: t.fragileX, icon: '🔬' },
    { id: 'other', name: t.other, icon: '✨' }
  ];

  const validateStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      speak(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', language);
      return false;
    }
    if (password.length < 8) {
      speak(language === 'ar' ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters', language);
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    playSound('tap');
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      setIsSubmitting(true);
      clearAuthError();
      if (!consentGiven) { setIsSubmitting(false); return; }

      const profile: ChildProfile & { password?: string } = {
        ...formData,
        email,
        password,
        age: Number(formData.age),
        gender: formData.gender as 'male' | 'female',
        condition: formData.condition as Condition
      };

      const success = await registerUser(profile);

      if (success) {
        playSound('success');
        speak(language === 'ar' ? 'تم التسجيل بنجاح! أهلاً بك يا بطل.' : 'Registration successful! Welcome, hero.', language);
        const settingUp = language === 'ar'
          ? `جاري تجهيز رحلة ${formData.name || 'طفلك'} التعليمية...`
          : `Setting up ${formData.name || "your child"}'s learning journey...`;
        startTransition(settingUp, 'iris-parent', 2000);
      } else {
        speak(language === 'ar' ? 'حدث خطأ في التسجيل. يرجى التأكد من البيانات.' : 'Registration error. Please check your data.', language);
        playSound('error');
      }
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    playSound('tap');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthShell
      tone="neutral"
      wide
      title={t.registration}
      tagline={language === 'ar' ? 'رحلة جديدة تبدأ هنا' : 'A new journey starts here'}
      topBar={
        <div className="ir-auth-bar">
          <button type="button" className="ir-auth-back" onClick={handleBack}>
            {dir === 'rtl' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
            <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
          </button>
          <ChromeActions showLanguage={false} />
        </div>
      }
      head={
        /* Progress: three labelled pills, not a filled bar. Three steps is exactly the
           case where a bar tells a parent less than the dots do. */
        <div className="ir-auth-progress">
          <div className="ir-auth-progress-meta">
            <span className="ir-auth-progress-eyebrow">
              {step === 1 ? t.childInfo : step === 2 ? t.familyInfo : t.conditionSelection}
            </span>
            <span dir="ltr" className="ir-auth-progress-count">{step} / 3</span>
          </div>
          <div
            className="ir-auth-steps"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
            aria-label={`${step} / 3`}
          >
            {([t.childInfo, t.familyInfo, t.conditionSelection] as string[]).map((label, i) => {
              const n = i + 1;
              const state = step > n ? 'done' : step === n ? 'active' : 'upcoming';
              return (
                <span key={label} dir={language === 'ar' ? 'rtl' : 'ltr'} className={`ir-auth-step ir-auth-step--${state}`}>
                  {state === 'done' ? <Check className="size-4 shrink-0" /> : <span className="ir-auth-step-num">{n}</span>}
                  <span className="ir-auth-step-label">{label}</span>
                </span>
              );
            })}
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Child Information */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="ir-auth-step-card">
              <div className="ir-auth-step-head">
                <span className="ir-auth-step-glyph ir-auth-step-glyph--purple">
                  <Baby className="size-7" />
                </span>
                <h2 className="ir-auth-step-title">{t.childInfo}</h2>
              </div>

              <div className="ir-auth-grid ir-auth-grid--2">
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ir-auth-input"
                    placeholder="hero@kingdom.com"
                  />
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ir-auth-input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-child-name">{t.childName}</label>
                  <Input
                    id="reg-child-name"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="ir-auth-input"
                    placeholder={language === 'ar' ? 'اسم طفلنا البطل' : "Our Hero's Name"}
                  />
                </div>

                <div className="ir-auth-grid ir-auth-grid--2sm">
                  <div className="ir-auth-field">
                    <label className="ir-auth-label" htmlFor="reg-age">{t.age}</label>
                    <Input
                      id="reg-age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => updateField('age', e.target.value)}
                      className="ir-auth-input"
                    />
                  </div>
                  <div className="ir-auth-field">
                    <label className="ir-auth-label" htmlFor="reg-dob">{language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</label>
                    <Input
                      id="reg-dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className="ir-auth-input"
                    />
                  </div>
                </div>

                <div className="ir-auth-span-2">
                  <div className="ir-auth-label ir-auth-label--block">{t.gender}</div>
                  <div className="ir-auth-grid ir-auth-grid--2sm ir-auth-grid--tight">
                    <Button
                      variant={formData.gender === 'male' ? 'default' : 'outline'}
                      onClick={() => { updateField('gender', 'male'); playSound('tap'); }}
                      className={`ir-auth-choice ${formData.gender === 'male' ? 'ir-auth-choice--boy-on' : ''}`}
                    >
                      👦 {t.male}
                    </Button>
                    <Button
                      variant={formData.gender === 'female' ? 'default' : 'outline'}
                      onClick={() => { updateField('gender', 'female'); playSound('tap'); }}
                      className={`ir-auth-choice ${formData.gender === 'female' ? 'ir-auth-choice--girl-on' : ''}`}
                    >
                      👧 {t.female}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Family Information */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="ir-auth-step-card">
              <div className="ir-auth-step-head">
                <span className="ir-auth-step-glyph ir-auth-step-glyph--blue">
                  <Users className="size-7" />
                </span>
                <h2 className="ir-auth-step-title">{t.familyInfo}</h2>
              </div>

              <div className="ir-auth-grid ir-auth-grid--2">
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-country">{t.country}</label>
                  <Input
                    id="reg-country"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-city">{t.city}</label>
                  <Input
                    id="reg-city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-mother-name">{t.motherName}</label>
                  <Input
                    id="reg-mother-name"
                    value={formData.motherName}
                    onChange={(e) => updateField('motherName', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-mother-job">{t.motherJob}</label>
                  <Input
                    id="reg-mother-job"
                    value={formData.motherJob}
                    onChange={(e) => updateField('motherJob', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-father-name">{t.fatherName}</label>
                  <Input
                    id="reg-father-name"
                    value={formData.fatherName}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-father-job">{t.fatherJob}</label>
                  <Input
                    id="reg-father-job"
                    value={formData.fatherJob}
                    onChange={(e) => updateField('fatherJob', e.target.value)}
                    className="ir-auth-input"
                  />
                </div>

                <div className="ir-auth-field ir-auth-span-2">
                  <label className="ir-auth-label" htmlFor="reg-phone">{t.phone}</label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="ir-auth-input"
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Condition Selection */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="ir-auth-step-card">
              <div className="ir-auth-step-head ir-auth-step-head--center">
                <span className="ir-auth-step-glyph ir-auth-step-glyph--yellow">
                  <Brain className="size-7" />
                </span>
                <h2 className="ir-auth-step-title">{t.conditionSelection}</h2>
              </div>

              <div className="ir-auth-tiles">
                {conditions.map((condition) => (
                  <motion.button
                    key={condition.id}
                    onClick={() => {
                      updateField('condition', condition.id);
                      playSound('tap');
                      speak(condition.name, language);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`ir-auth-tile ${formData.condition === condition.id ? 'ir-auth-tile--on' : ''}`}
                  >
                    {formData.condition === condition.id && (
                      <div className="ir-auth-tile-check">
                        <Check className="size-4" />
                      </div>
                    )}
                    <div className="ir-auth-tile-icon">{condition.icon}</div>
                    <div className="ir-auth-tile-name">{condition.name}</div>
                  </motion.button>
                ))}
              </div>

              <p className="ir-auth-note">
                {language === 'ar'
                  ? 'ملاحظة: هذه المعلومة تُستخدم فقط لتفعيل تسهيلات الوصول (وقت إضافي، إعادة الصوت، تقليل الحركة). لا تحدد قدرة طفلك ولا مستواه — مسار التعلم يعتمد بالكامل على أدائه الفعلي.'
                  : "Note: this is used only to enable access accommodations (extra time, audio repeat, reduced animation). It never determines your child's ability or level — the learning pathway is driven entirely by actual performance."}
              </p>

              <label className="ir-auth-consent">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span className="ir-auth-consent-text">
                  {language === 'ar'
                    ? 'أوافق على استخدام IRIS كنموذج أولي تعليمي مبني على الأدلة (غير مُعتمد إكلينيكيًا بعد) لتخصيص أنشطة التعلّم لطفلي، وعلى حفظ بيانات تقدّمه لهذا الغرض فقط.'
                    : "I agree to use IRIS as a research-informed educational prototype (not yet clinically validated) to personalise my child's learning activities, and to store their progress data for this purpose only."}
                </span>
              </label>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visible registration failure. The server distinguishes a duplicate
          email from a short password from an invalid address; all three used
          to be spoken only and otherwise looked like the form silently
          refusing to submit. */}
      {authError && (
        <div className="ir-auth-error">
          <div role="alert">
            <span aria-hidden="true" className="ir-auth-error-mark">⚠️</span>
            <span>{authMessage(authError, language === 'ar' ? 'ar' : 'en')}</span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="ir-auth-nav">
        <Button
          onClick={handlePrevious}
          variant="outline"
          size="lg"
          className={`ir-auth-ghost ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          {dir === 'rtl' ? <ChevronRight className="size-6 me-2" /> : <ChevronLeft className="size-6 me-2" />}
          {t.previous}
        </Button>

        <Button
          onClick={handleNext}
          size="lg"
          className={`ir-auth-cta ir-auth-cta--grow ${step === 3 ? 'ir-auth-cta--finish' : ''}`}
          disabled={
            isSubmitting ||
            (step === 1 && (!formData.name || !formData.age || !formData.gender || !email || !password)) ||
            (step === 2 && (!formData.country || !formData.phone)) ||
            (step === 3 && (!formData.condition || !consentGiven))
          }
        >
          <div className="ir-auth-cta-inner">
            {isSubmitting ? (
              <><Sparkles className="ir-auth-spin size-6" />{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : (
              <>
                {step === 3 ? t.submit : t.next}
                {dir === 'rtl' ? <ChevronLeft className="size-6 ms-2" /> : <ChevronRight className="size-6 ms-2" />}
              </>
            )}
          </div>
        </Button>
      </div>
    </AuthShell>
  );
}
