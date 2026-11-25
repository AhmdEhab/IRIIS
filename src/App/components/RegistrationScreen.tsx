import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Baby, Users, Brain, Check, Sparkles } from 'lucide-react';
import { useApp, ChildProfile, Condition } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { authMessage } from '../authMessages';
import { MuteButton } from './auth/MuteButton';
import { AuthShell } from './auth/AuthShell';
import { API_URL } from '../config';

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
 * ── WHY THE VALIDATION LOOKS LIKE THIS (user report: "مش راضي يعمل register")
 * The wizard used to enforce its rules *invisibly*: the CTA carried a long
 * `disabled={…}` expression, so leaving one required field empty — most often
 * العمر / age, which does not look required next to the optional birth date —
 * turned the button grey and silent. Nothing on screen said what was missing,
 * so the form read as broken. Three changes fix that class of dead end:
 *
 *   1. The CTA is never disabled by validation. Pressing it always answers,
 *      with one message per offending field, placed under that field.
 *   2. Required fields are marked (*) and say so once at the top of the step;
 *      `aria-required` / `aria-invalid` / `aria-describedby` carry the same
 *      fact to assistive tech.
 *   3. The email is checked against /api/register/check at step 1 instead of
 *      at submit. A duplicate email used to be revealed only after all three
 *      steps were filled, which felt like the whole form refusing to work.
 *
 * Step flow, the speak/play prompts, `startTransition` and the submit path are
 * untouched, as is the `dir` handling on the chevrons.
 */

/** Required fields per step — one source for the * marks, the inline errors
 *  and the "still missing" hint under the CTA, so they can never disagree. */
type FieldKey =
  | 'email' | 'password' | 'name' | 'age' | 'gender'
  | 'country' | 'phone'
  | 'condition' | 'consent';

type EmailStatus = 'idle' | 'checking' | 'free' | 'taken' | 'unknown';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with one field — a *code*, not a sentence.
 *
 *  Resolved strings were the first attempt and they broke on the language
 *  toggle: switching to English left every visible error in Arabic, because
 *  the message had been frozen at the moment of the failed attempt. Codes are
 *  language-free, so `messageFor()` can re-render them in whatever language
 *  the parent is reading right now. */
type FieldIssue =
  | 'missing'
  | 'email-invalid'
  | 'email-taken'
  | 'password-short'
  | 'age-range';

/** The asterisk that marks a required field (visual only — the input itself
 *  carries aria-required for assistive tech). */
function Req() {
  return <span className="ir-auth-req" aria-hidden="true">*</span>;
}

/** One inline error line under one field. Rendered only when there is a
 *  message, and referenced by the input's aria-describedby. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="ir-auth-field-error" id={id} role="alert">{message}</p>;
}

export function RegistrationScreen() {
  const { registerUser, authError, clearAuthError, navigateTo, startTransition } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  const handleBack = () => {
    playSound('tap');
    navigateTo('marketing');
  };

  const [step, setStep] = useState(1);
  /* Audit P2: client validation was TTS-only — a silent form refusal for a
     muted or Deaf parent. The same message now appears in the error banner. */
  const [fieldError, setFieldError] = useState<string | null>(null);
  /* Per-field messages, so the answer appears where the mistake is instead of
     as one banner far from the field that needs fixing. */
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, FieldIssue>>>({});
  /* True once the parent has pressed the CTA and something was missing — the
     "still missing" checklist only appears after that, never as a nag on a
     form nobody has tried to send yet. */
  const [attempted, setAttempted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');

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

  /* A stale banner used to follow the parent here from another screen (an
     AUTH_REQUIRED from a guarded call, typically), so the very first thing a
     new visitor saw on the sign-up page was "من فضلك سجّل الدخول للمتابعة" —
     on the page whose whole job is to create that account. Errors raised *by
     this screen* still show; only the inherited ones are dropped. */
  useEffect(() => {
    clearAuthError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conditions: { id: Condition; name: string; icon: string }[] = [
    { id: 'down-syndrome', name: t.downSyndrome, icon: '🧬' },
    { id: 'autism', name: t.autism, icon: '🧩' },
    { id: 'williams', name: t.williams, icon: '💙' },
    { id: 'fragile-x', name: t.fragileX, icon: '🔬' },
    { id: 'other', name: t.other, icon: '✨' }
  ];

  /** Ask the server whether this address is free. Never throws: an
   *  unreachable check answers 'unknown' and /api/register stays the
   *  authority, so a flaky network can never block a real sign-up. */
  const checkEmailAvailability = async (value: string): Promise<EmailStatus> => {
    const candidate = value.trim().toLowerCase();
    if (!EMAIL_RE.test(candidate)) {
      setEmailStatus('idle');
      return 'idle';
    }
    setEmailStatus('checking');
    try {
      const res = await fetch(`${API_URL}/register/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidate }),
      });
      const data = await res.json().catch(() => ({}));
      const next: EmailStatus = res.ok && typeof data.available === 'boolean'
        ? (data.available ? 'free' : 'taken')
        : 'unknown';
      setEmailStatus(next);
      return next;
    } catch {
      setEmailStatus('unknown');
      return 'unknown';
    }
  };

  /**
   * The rules of one step, expressed once.
   *
   * `status` lets a caller pass the result of the fresh availability check it
   * just awaited — React state would still be one render behind, which is
   * exactly the kind of race that made the old validation feel arbitrary.
   */
  const validateStep = (target: number, status?: EmailStatus): Partial<Record<FieldKey, FieldIssue>> => {
    const errs: Partial<Record<FieldKey, FieldIssue>> = {};
    const mail = status ?? emailStatus;

    if (target === 1) {
      if (!email.trim()) {
        errs.email = 'missing';
      } else if (!EMAIL_RE.test(email.trim())) {
        errs.email = 'email-invalid';
      } else if (mail === 'taken') {
        errs.email = 'email-taken';
      }
      if (!password) {
        errs.password = 'missing';
      } else if (password.length < 8) {
        errs.password = 'password-short';
      }
      if (!formData.name.trim()) {
        errs.name = 'missing';
      }
      if (!String(formData.age).trim()) {
        errs.age = 'missing';
      } else if (!(Number(formData.age) >= 0 && Number(formData.age) <= 18)) {
        errs.age = 'age-range';
      }
      if (!formData.gender) {
        errs.gender = 'missing';
      }
    }

    if (target === 2) {
      if (!formData.country.trim()) errs.country = 'missing';
      if (!formData.phone.trim()) errs.phone = 'missing';
    }

    if (target === 3) {
      if (!formData.condition) errs.condition = 'missing';
      if (!consentGiven) errs.consent = 'missing';
    }

    return errs;
  };

  /** Issue code + field → one sentence in the language being read right now. */
  const messageFor = (key: FieldKey, issue: FieldIssue): string => {
    if (issue === 'email-invalid') {
      return ar
        ? 'البريد الإلكتروني غير صحيح — مثال: name@example.com'
        : 'That email does not look right — e.g. name@example.com';
    }
    if (issue === 'email-taken') {
      return ar
        ? 'البريد ده متسجّل بالفعل — سجّل الدخول بدل ما تعمل حساب جديد.'
        : 'That email is already registered — log in instead.';
    }
    if (issue === 'password-short') {
      return ar
        ? 'كلمة المرور لازم تكون ٨ أحرف على الأقل'
        : 'Use at least 8 characters';
    }
    if (issue === 'age-range') {
      return ar ? 'العمر لازم يكون بين ٠ و ١٨' : 'Age must be between 0 and 18';
    }
    const missing: Record<FieldKey, [string, string]> = {
      email: ['اكتب البريد الإلكتروني', 'Enter your email'],
      password: ['اكتب كلمة المرور', 'Enter a password'],
      name: ['اكتب اسم الطفل', "Enter your child's name"],
      age: ['اكتب العمر أو تاريخ الميلاد', 'Enter the age or birth date'],
      gender: ['اختار النوع', 'Choose a gender'],
      country: ['اكتب الدولة', 'Enter the country'],
      phone: ['اكتب رقم الهاتف', 'Enter a phone number'],
      condition: ['اختار الحالة عشان نكمل', 'Choose a condition to continue'],
      consent: ['لازم توافق على الاستخدام قبل الإرسال', 'Please agree before submitting'],
    };
    return missing[key][ar ? 0 : 1];
  };

  const fieldLabels: Record<FieldKey, string> = {
    email: ar ? 'البريد الإلكتروني' : 'email',
    password: ar ? 'كلمة المرور' : 'password',
    name: ar ? 'اسم الطفل' : "child's name",
    age: ar ? 'العمر' : 'age',
    gender: ar ? 'النوع' : 'gender',
    country: ar ? 'الدولة' : 'country',
    phone: ar ? 'رقم الهاتف' : 'phone',
    condition: ar ? 'الحالة' : 'condition',
    consent: ar ? 'الموافقة' : 'consent',
  };

  const handleNext = async () => {
    playSound('tap');

    /* Step 1 asks the server about the email BEFORE deciding, so a duplicate
       is caught here rather than after step 3. */
    const status = step === 1 ? await checkEmailAvailability(email) : undefined;
    const errs = validateStep(step, status);

    if (Object.keys(errs).length > 0) {
      setAttempted(true);
      setFieldErrors(errs);
      /* Speak the first problem, in the language on screen. */
      const firstKey = Object.keys(errs)[0] as FieldKey;
      const first = messageFor(firstKey, errs[firstKey] as FieldIssue);
      setFieldError(null);
      speak(first, language);
      playSound('error');
      return;
    }

    setFieldErrors({});
    setFieldError(null);
    setAttempted(false);

    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    clearAuthError();

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
      speak(ar ? 'تم التسجيل بنجاح! أهلاً بك يا بطل.' : 'Registration successful! Welcome, hero.', language);
      const settingUp = ar
        ? `جاري تجهيز رحلة ${formData.name || 'طفلك'} التعليمية...`
        : `Setting up ${formData.name || "your child"}'s learning journey...`;
      // Spec: registration never skips verification — the transition
      // lands on the OTP screen; the hub is only reached after the
      // code is confirmed (and the assessment gate afterwards).
      startTransition(settingUp, 'verify-email', 2000);
    } else {
      speak(ar ? 'حدث خطأ في التسجيل. يرجى التأكد من البيانات.' : 'Registration error. Please check your data.', language);
      playSound('error');
    }
    setIsSubmitting(false);
  };

  const handlePrevious = () => {
    playSound('tap');
    if (step > 1) {
      setAttempted(false);
      setFieldErrors({});
      setFieldError(null);
      setStep(step - 1);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  /**
   * Birth date and age are the same fact typed two ways, so the parent only
   * has to supply one. This used to be a trap: the age field is required, the
   * birth date is not, and filling the date left the age empty — the CTA then
   * went grey for a reason nothing on screen explained.
   */
  const updateBirthDate = (value: string) => {
    setFormData(prev => {
      const next = { ...prev, dateOfBirth: value };
      if (value) {
        const born = new Date(value);
        if (!Number.isNaN(born.getTime())) {
          const now = new Date();
          let years = now.getFullYear() - born.getFullYear();
          const monthDiff = now.getMonth() - born.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) years -= 1;
          if (years >= 0 && years <= 18) next.age = String(years);
        }
      }
      return next;
    });
    setFieldErrors(prev => ({ ...prev, age: undefined }));
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    setEmailStatus('idle');
    setFieldErrors(prev => ({ ...prev, email: undefined }));
  };

  /* What is still missing on this step — shown under the CTA after the first
     attempt, so the parent never has to guess which of nine fields is the
     one holding the form back. */
  const pending = attempted ? Object.keys(validateStep(step)) as FieldKey[] : [];
  /* Boolean, not the message itself: a truthy string here would have been
     rendered as text right before the "log in instead" button. */
  const emailTaken = emailStatus === 'taken' && Boolean(fieldErrors.email);
  const pendingLabels = pending.map((key) => (
    /* A filled-but-rejected email is not "missing" — say which it is, so the
       checklist never claims a field the parent can see is empty. */
    key === 'email' && emailTaken
      ? (ar ? 'البريد الإلكتروني (متسجّل بالفعل)' : 'email (already registered)')
      : fieldLabels[key]
  ));

  return (
    <AuthShell
      tone="neutral"
      wide
      title={t.registration}
      tagline={ar ? 'رحلة جديدة تبدأ هنا' : 'A new journey starts here'}
      topBar={
        <div className="ir-auth-bar">
          <button type="button" className="ir-auth-back" onClick={handleBack}>
            {dir === 'rtl' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
            <span>{ar ? 'رجوع' : 'Back'}</span>
          </button>
          <MuteButton />
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
                <span key={label} dir={ar ? 'rtl' : 'ltr'} className={`ir-auth-step ir-auth-step--${state}`}>
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

              <p className="ir-auth-required-note">
                <span className="ir-auth-req" aria-hidden="true">*</span>
                {' '}
                {ar ? 'الحقول الإلزامية' : 'Required fields'}
              </p>

              <div className="ir-auth-grid ir-auth-grid--2">
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-email">
                    {ar ? 'البريد الإلكتروني' : 'Email'} <Req />
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    onBlur={() => { void checkEmailAvailability(email); }}
                    className="ir-auth-input"
                    placeholder="hero@kingdom.com"
                    aria-required="true"
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                  />
                  <FieldError id="reg-email-error" message={fieldErrors.email ? messageFor('email', fieldErrors.email) : undefined} />
                  {emailStatus === 'taken' && !fieldErrors.email && (
                    <p className="ir-auth-field-hint">
                      {ar ? 'البريد ده متسجّل بالفعل.' : 'That email is already registered.'}
                    </p>
                  )}
                  {emailTaken && (
                    <button
                      type="button"
                      className="ir-auth-linkbtn ir-auth-field-action"
                      onClick={() => { playSound('tap'); navigateTo('login'); }}
                    >
                      {ar ? 'سجّل الدخول' : 'Log in'}
                    </button>
                  )}
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-password">
                    {ar ? 'كلمة المرور' : 'Password'} <Req />
                  </label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className="ir-auth-input"
                    placeholder={ar ? '٨ أحرف على الأقل' : 'at least 8 characters'}
                    aria-required="true"
                    aria-invalid={fieldErrors.password ? 'true' : undefined}
                    aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
                  />
                  <FieldError id="reg-password-error" message={fieldErrors.password ? messageFor('password', fieldErrors.password) : undefined} />
                </div>

                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-child-name">
                    {t.childName} <Req />
                  </label>
                  <Input
                    id="reg-child-name"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="ir-auth-input"
                    placeholder={ar ? 'اسم طفلنا البطل' : "Our Hero's Name"}
                    aria-required="true"
                    aria-invalid={fieldErrors.name ? 'true' : undefined}
                    aria-describedby={fieldErrors.name ? 'reg-child-name-error' : undefined}
                  />
                  <FieldError id="reg-child-name-error" message={fieldErrors.name ? messageFor('name', fieldErrors.name) : undefined} />
                </div>

                <div className="ir-auth-grid ir-auth-grid--2sm">
                  <div className="ir-auth-field">
                    <label className="ir-auth-label" htmlFor="reg-age">
                      {t.age} <Req />
                    </label>
                    <Input
                      id="reg-age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => updateField('age', e.target.value)}
                      className="ir-auth-input"
                      aria-required="true"
                      aria-invalid={fieldErrors.age ? 'true' : undefined}
                      aria-describedby={fieldErrors.age ? 'reg-age-error' : undefined}
                    />
                    <FieldError id="reg-age-error" message={fieldErrors.age ? messageFor('age', fieldErrors.age) : undefined} />
                  </div>
                  <div className="ir-auth-field">
                    <label className="ir-auth-label" htmlFor="reg-dob">{ar ? 'تاريخ الميلاد' : 'Birth Date'}</label>
                    <Input
                      id="reg-dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateBirthDate(e.target.value)}
                      className="ir-auth-input"
                    />
                  </div>
                </div>

                <div className="ir-auth-span-2">
                  <div className="ir-auth-label ir-auth-label--block">
                    {t.gender} <Req />
                  </div>
                  <div className="ir-auth-grid ir-auth-grid--2sm ir-auth-grid--tight">
                    <Button
                      type="button"
                      variant={formData.gender === 'male' ? 'default' : 'outline'}
                      onClick={() => { updateField('gender', 'male'); playSound('tap'); }}
                      className={`ir-auth-choice ${formData.gender === 'male' ? 'ir-auth-choice--boy-on' : ''}`}
                      aria-pressed={formData.gender === 'male'}
                    >
                      👦 {t.male}
                    </Button>
                    <Button
                      type="button"
                      variant={formData.gender === 'female' ? 'default' : 'outline'}
                      onClick={() => { updateField('gender', 'female'); playSound('tap'); }}
                      className={`ir-auth-choice ${formData.gender === 'female' ? 'ir-auth-choice--girl-on' : ''}`}
                      aria-pressed={formData.gender === 'female'}
                    >
                      👧 {t.female}
                    </Button>
                  </div>
                  <FieldError id="reg-gender-error" message={fieldErrors.gender ? messageFor('gender', fieldErrors.gender) : undefined} />
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

              <p className="ir-auth-required-note">
                <span className="ir-auth-req" aria-hidden="true">*</span>
                {' '}
                {ar ? 'الحقول الإلزامية' : 'Required fields'}
              </p>

              <div className="ir-auth-grid ir-auth-grid--2">
                <div className="ir-auth-field">
                  <label className="ir-auth-label" htmlFor="reg-country">
                    {t.country} <Req />
                  </label>
                  <Input
                    id="reg-country"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="ir-auth-input"
                    aria-required="true"
                    aria-invalid={fieldErrors.country ? 'true' : undefined}
                    aria-describedby={fieldErrors.country ? 'reg-country-error' : undefined}
                  />
                  <FieldError id="reg-country-error" message={fieldErrors.country ? messageFor('country', fieldErrors.country) : undefined} />
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
                  <label className="ir-auth-label" htmlFor="reg-phone">
                    {t.phone} <Req />
                  </label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="ir-auth-input"
                    placeholder="+20 123 456 7890"
                    aria-required="true"
                    aria-invalid={fieldErrors.phone ? 'true' : undefined}
                    aria-describedby={fieldErrors.phone ? 'reg-phone-error' : undefined}
                  />
                  <FieldError id="reg-phone-error" message={fieldErrors.phone ? messageFor('phone', fieldErrors.phone) : undefined} />
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
                    type="button"
                    onClick={() => {
                      updateField('condition', condition.id);
                      playSound('tap');
                      speak(condition.name, language);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={formData.condition === condition.id}
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
              <FieldError id="reg-condition-error" message={fieldErrors.condition ? messageFor('condition', fieldErrors.condition) : undefined} />

              <p className="ir-auth-note">
                {ar
                  ? 'ملاحظة: هذه المعلومة تُستخدم فقط لتفعيل تسهيلات الوصول (وقت إضافي، إعادة الصوت، تقليل الحركة). لا تحدد قدرة طفلك ولا مستواه — مسار التعلم يعتمد بالكامل على أدائه الفعلي.'
                  : "Note: this is used only to enable access accommodations (extra time, audio repeat, reduced animation). It never determines your child's ability or level — the learning pathway is driven entirely by actual performance."}
              </p>

              <label className="ir-auth-consent">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    setFieldErrors(prev => ({ ...prev, consent: undefined }));
                  }}
                  aria-required="true"
                  aria-invalid={fieldErrors.consent ? 'true' : undefined}
                />
                <span className="ir-auth-consent-text">
                  {ar
                    ? 'أوافق على استخدام IRIS كنموذج أولي تعليمي مبني على الأدلة (غير مُعتمد إكلينيكيًا بعد) لتخصيص أنشطة التعلّم لطفلي، وعلى حفظ بيانات تقدّمه لهذا الغرض فقط.'
                    : "I agree to use IRIS as a research-informed educational prototype (not yet clinically validated) to personalise my child's learning activities, and to store their progress data for this purpose only."}
                </span>
              </label>
              <FieldError id="reg-consent-error" message={fieldErrors.consent ? messageFor('consent', fieldErrors.consent) : undefined} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visible registration failure. The server distinguishes a duplicate
          email from a short password from an invalid address; all three used
          to be spoken only and otherwise looked like the form silently
          refusing to submit. */}
      {(authError || fieldError) && (
        <div className="ir-auth-error">
          <div role="alert">
            <span aria-hidden="true" className="ir-auth-error-mark">⚠️</span>
            <span>{authError ? authMessage(authError, ar ? 'ar' : 'en') : fieldError}</span>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="ir-auth-nav">
        {step > 1 && (
          <Button
            type="button"
            onClick={handlePrevious}
            variant="outline"
            size="lg"
            className="ir-auth-ghost"
          >
            {dir === 'rtl' ? <ChevronRight className="size-6 me-2" /> : <ChevronLeft className="size-6 me-2" />}
            {t.previous}
          </Button>
        )}

        <Button
          type="button"
          onClick={() => { void handleNext(); }}
          size="lg"
          className={`ir-auth-cta ir-auth-cta--grow ${step === 3 ? 'ir-auth-cta--finish' : ''}`}
          /* Deliberately NOT disabled by validation: a disabled CTA with no
             explanation is what made the wizard read as broken. Pressing it
             always answers — with a message under the field that needs it. */
          disabled={isSubmitting}
        >
          <div className="ir-auth-cta-inner">
            {isSubmitting ? (
              <><Sparkles className="ir-auth-spin size-6" />{ar ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : (
              <>
                {step === 3 ? t.submit : t.next}
                {dir === 'rtl' ? <ChevronLeft className="size-6 ms-2" /> : <ChevronRight className="size-6 ms-2" />}
              </>
            )}
          </div>
        </Button>
      </div>

      {/* "Still missing" checklist — the sentence the old greyed-out button
          should have said. Appears only after a real attempt. */}
      {pendingLabels.length > 0 && (
        <p className="ir-auth-cta-hint" role="status">
          {ar ? 'لسه ناقص: ' : 'Still needed: '}
          {pendingLabels.join(ar ? '، ' : ', ')}
        </p>
      )}
    </AuthShell>
  );
}
