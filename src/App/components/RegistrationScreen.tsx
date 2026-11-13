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
import { ScreenFrame, TopBar, DisplayTitle } from './iris/ui/brand';
import { ChromeActions } from './iris/ui/ChromeActions';

export function RegistrationScreen() {
  const { registerUser, authError, clearAuthError, navigateTo, startTransition } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language, dir } = useLanguage();

  const handleBack = () => {
    playSound('tap');
    navigateTo('landing');
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
    <ScreenFrame
      accent="blue"
      width="md"
      topBar={
        <TopBar
          ar={language === 'ar'}
          onBack={handleBack}
          backLabel={language === 'ar' ? 'رجوع' : 'Back'}
          title={t.registration}
          actions={<ChromeActions />}
        />
      }
    >
      <div>
        {/* Header */}
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-7"
        >
          <DisplayTitle size="title">{t.registration}</DisplayTitle>
          <p className="t-body text-ink-muted mt-2">
            {language === 'ar' ? 'رحلة جديدة تبدأ هنا' : 'A new journey starts here'}
          </p>
        </motion.div>

        {/* Progress: three dots, not a filled bar. Three steps is exactly the
            case where a bar tells a parent less than the dots do. */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="t-label text-brand-blue-ink">
              {step === 1 ? t.childInfo : step === 2 ? t.familyInfo : t.conditionSelection}
            </span>
            <span dir="ltr" className="t-small text-ink tabular-nums">{step} / 3</span>
          </div>
          <div
            className="flex items-stretch justify-between gap-2"
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
                <span
                  key={label}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  className={
                    'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2.5 t-small font-bold text-center ' +
                    (state === 'active'
                      ? 'bg-brand-blue text-surface'
                      : state === 'done'
                        ? 'bg-brand-green text-surface'
                        : 'bg-brand-blue/10 text-brand-blue')
                  }
                >
                  {state === 'done' ? <Check className="size-4 shrink-0" /> : <span className="tabular-nums">{n}</span>}
                  <span className="truncate">{label}</span>
                </span>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Child Information */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="p-5 sm:p-6 space-y-8 rounded-brand-lg shadow-brand border border-brand-blue/10 bg-surface">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-4 rounded-brand-lg bg-brand-purple-wash text-brand-purple-ink">
                    <Baby className="size-10" />
                  </div>
                  <h2 className="t-heading text-ink">{t.childInfo}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                      placeholder="hero@kingdom.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.childName}</label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                      placeholder={language === 'ar' ? 'اسم طفلنا البطل' : "Our Hero's Name"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-lg font-black text-ink-muted">{t.age}</label>
                      <Input
                        type="number"
                        value={formData.age || ''}
                        onChange={(e) => updateField('age', e.target.value)}
                        className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-lg font-black text-ink-muted">{language === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.gender}</label>
                    <div className="grid grid-cols-2 gap-6 mt-2">
                      <Button
                        variant={formData.gender === 'male' ? 'default' : 'outline'}
                        onClick={() => { updateField('gender', 'male'); playSound('tap'); }}
                        className={`h-20 text-2xl font-black rounded-brand border-4 transition-all duration-200 ${formData.gender === 'male' ? 'bg-brand-blue border-brand-blue text-surface scale-105 shadow-brand' : 'bg-surface border-hairline text-ink-muted hover:bg-ground-tint active:scale-95'}`}
                      >
                        👦 {t.male}
                      </Button>
                      <Button
                        variant={formData.gender === 'female' ? 'default' : 'outline'}
                        onClick={() => { updateField('gender', 'female'); playSound('tap'); }}
                        className={`h-20 text-2xl font-black rounded-brand border-4 transition-all duration-200 ${formData.gender === 'female' ? 'bg-brand-coral-solid border-brand-coral-solid text-surface scale-105 shadow-brand' : 'bg-surface border-hairline text-ink-muted hover:bg-ground-tint active:scale-95'}`}
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
              <Card className="p-5 sm:p-6 space-y-10 rounded-brand-lg shadow-brand border border-brand-blue/10 bg-surface">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-4 rounded-brand-lg bg-brand-blue-wash text-brand-blue-ink">
                    <Users className="size-10" />
                  </div>
                  <h2 className="t-heading text-ink">{t.familyInfo}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.country}</label>
                    <Input
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.city}</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.motherName}</label>
                    <Input
                      value={formData.motherName}
                      onChange={(e) => updateField('motherName', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.motherJob}</label>
                    <Input
                      value={formData.motherJob}
                      onChange={(e) => updateField('motherJob', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.fatherName}</label>
                    <Input
                      value={formData.fatherName}
                      onChange={(e) => updateField('fatherName', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.fatherJob}</label>
                    <Input
                      value={formData.fatherJob}
                      onChange={(e) => updateField('fatherJob', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-lg font-black text-ink-muted">{t.phone}</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5 text-center tracking-widest"
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
              <Card className="p-5 sm:p-6 space-y-10 rounded-brand-lg shadow-brand border border-brand-blue/10 bg-surface">
                <div className="flex items-center gap-4 mb-2 text-center justify-center">
                  <div className="p-4 rounded-brand-lg bg-brand-yellow-wash text-brand-yellow-ink">
                    <Brain className="size-10" />
                  </div>
                  <h2 className="t-title text-ink">{t.conditionSelection}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      className={`p-10 rounded-brand-xl border-8 transition-all duration-200 relative flex flex-col items-center shadow-brand ${formData.condition === condition.id
                        ? 'border-brand-purple bg-brand-purple-wash scale-105'
                        : 'border-hairline bg-surface hover:border-hairline active:scale-95'
                        }`}
                    >
                      {formData.condition === condition.id && (
                        <div className="absolute top-4 right-4 bg-brand-purple-ink text-white p-2 rounded-full shadow-brand">
                          <Check className="size-6" />
                        </div>
                      )}
                      <div className="text-8xl mb-6 filter drop-shadow-brand">{condition.icon}</div>
                      <div className="font-black text-2xl text-ink">{condition.name}</div>
                    </motion.button>
                  ))}
                </div>

                <p className="text-sm text-ink-muted bg-ground-tint rounded-brand p-4 border-2 border-hairline">
                  {language === 'ar'
                    ? 'ملاحظة: هذه المعلومة تُستخدم فقط لتفعيل تسهيلات الوصول (وقت إضافي، إعادة الصوت، تقليل الحركة). لا تحدد قدرة طفلك ولا مستواه — مسار التعلم يعتمد بالكامل على أدائه الفعلي.'
                    : "Note: this is used only to enable access accommodations (extra time, audio repeat, reduced animation). It never determines your child's ability or level — the learning pathway is driven entirely by actual performance."}
                </p>

                <label className="flex items-start gap-4 bg-brand-purple-wash rounded-brand p-5 border-2 border-hairline cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 size-6 accent-brand-purple shrink-0"
                  />
                  <span className="text-sm md:text-base font-bold text-ink-muted">
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
          <div
            role="alert"
            className="mt-8 rounded-brand border-4 border-brand-yellow bg-brand-yellow-wash px-5 py-4 text-lg font-bold text-brand-yellow-ink flex items-start gap-3"
          >
            <span aria-hidden="true" className="text-2xl leading-none">⚠️</span>
            <span>{authMessage(authError, language === 'ar' ? 'ar' : 'en')}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12 gap-8">
          <Button
            onClick={handlePrevious}
            variant="outline"
            size="lg"
            className={`h-16 px-6 text-xl font-bold rounded-full border-2 shadow-brand transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-surface border-hairline text-ink hover:bg-ground-tint'}`}
          >
            {dir === 'rtl' ? <ChevronRight className="size-8 me-2" /> : <ChevronLeft className="size-8 me-2" />}
            {t.previous}
          </Button>

          <Button
            onClick={handleNext}
            size="lg"
            className={`flex-1 h-16 px-6 text-xl font-bold rounded-full shadow-brand transition-all duration-200 active:scale-95 hover:scale-[1.02] ${step === 3 ? 'bg-brand-green-solid text-surface' : 'bg-brand-blue text-surface'}`}
            disabled={
              isSubmitting ||
              (step === 1 && (!formData.name || !formData.age || !formData.gender || !email || !password)) ||
              (step === 2 && (!formData.country || !formData.phone)) ||
              (step === 3 && (!formData.condition || !consentGiven))
            }
          >
            <div className="flex items-center justify-center gap-3">
              {isSubmitting ? (
                <><Sparkles className="animate-spin size-8" />{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</>
              ) : (
                <>
                  {step === 3 ? t.submit : t.next}
                  {dir === 'rtl' ? <ChevronLeft className="size-8 ms-2" /> : <ChevronRight className="size-8 ms-2" />}
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </ScreenFrame>
  );
}
