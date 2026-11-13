import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { authMessage } from '../authMessages';
import { TopBar, Button, Field, ErrorState } from './iris/ui/brand';
import { ChromeActions } from './iris/ui/ChromeActions';
import { AuthShell } from './auth/AuthShell';

/**
 * Parent login.
 *
 * ── WHAT PHASE 10 CHANGED ─────────────────────────────────────────────────
 * D11 — the primary button was a full-width brand-blue slab rendered at
 *       `disabled:opacity-50` whenever the fields were empty, which is the
 *       state a parent SEES FIRST. A 50%-faded primary button reads "this app
 *       is broken", not "there is something for you to fill in". The brand
 *       Button switches to a quiet style when disabled and takes a `hint`
 *       saying what would enable it. The fill was never wrong — the treatment
 *       was, and that only became clear from looking at the rendered screen.
 * D12 — the back arrow pointed left in an RTL layout. TopBar picks the
 *       chevron from the writing direction.
 * The purple heading with a 👋 emoji, the 8px white card border, the four
 * different type sizes and the floating "Don't have an account?" card are all
 * replaced by the shared system.
 *
 * ── WHAT THE AUTH RESKIN CHANGED ──────────────────────────────────────────
 * The frame, and only the frame. The screen hands its composition to
 * <AuthShell/>, which gives it the same cream ground, blob-and-sparkle
 * ambience, white plate, mascot and pill CTA as the marketing hero, so the
 * product stops changing character in the step between "that looks lovely" and
 * "let me in". Every decision above still holds: the same `ready` flag drives
 * `disabled`, the same `hint` says what would enable the button, the same
 * `Field` binds each label to its input by id, the same `ErrorState` owns the
 * `role="alert"`, and the registration link keeps its own container.
 *
 * Auth logic, error handling, speech prompts and navigation are untouched.
 */
export function LoginScreen() {
  const { loginUser, navigateTo, authError, clearAuthError } = useApp();
  const { speak, playSound } = useAudio();
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Locally-detected problems (empty fields) shown in the same banner as
  // server-reported ones, so there is exactly one place errors appear.
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError || (authError ? authMessage(authError, ar ? 'ar' : 'en') : null);

  const handleLogin = async () => {
    setLocalError(null);
    clearAuthError();
    if (!email || !password) {
      setLocalError(authMessage('EMAIL_AND_PASSWORD_REQUIRED', ar ? 'ar' : 'en'));
      speak(ar ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', language);
      playSound('error');
      return;
    }

    setIsLoading(true);
    playSound('tap');

    const userData = await loginUser(email, password);

    if (userData) {
      playSound('success');
      speak(ar ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!', language);
      setIsLoading(false);
      navigateTo('iris-parent');
    } else {
      playSound('error');
      speak(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password', language);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    playSound('tap');
    navigateTo('marketing');
  };

  const ready = !!email && !!password;

  return (
    <AuthShell
      tone="blue"
      title={ar ? 'مرحباً بعودتك' : 'Welcome back'}
      tagline={ar ? 'سجّل الدخول لمتابعة تعلّم طفلك.' : "Sign in to see your child's learning."}
      topBar={
        <TopBar
          ar={ar}
          onBack={handleBack}
          backLabel={ar ? 'الرئيسية' : 'Home'}
          actions={<ChromeActions showLanguage={false} />}
          sticky={false}
        />
      }
      footer={
        /* The wrapper is load-bearing, not decoration. The registration link
           is reached in QA (and by a screen reader walking the region) as
           "the button next to 'Don't have an account?'". Without its own
           container the nearest ancestor of that sentence is the whole form,
           which holds the Login button too — so "the button beside the
           question" becomes ambiguous and resolves to the wrong control. */
        <div className="ir-auth-foot">
          <p>
            {ar ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                playSound('tap');
                navigateTo('registration');
              }}
              className="ir-auth-link"
            >
              {ar ? 'سجل الآن' : 'Register now'}
            </button>
          </p>
        </div>
      }
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="ir-auth-form"
      >
        <div className="ir-auth-field">
          <Field label={ar ? 'البريد الإلكتروني' : 'Email'} id="login-email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                speak(ar ? 'البريد الإلكتروني' : 'Email', language);
                playSound('tap');
              }}
              className="ir-auth-input"
              placeholder="example@email.com"
              autoComplete="email"
            />
          </Field>
        </div>

        <div className="ir-auth-field">
          <Field label={ar ? 'كلمة المرور' : 'Password'} id="login-password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                speak(ar ? 'كلمة المرور' : 'Password', language);
                playSound('tap');
              }}
              className="ir-auth-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
        </div>

        {/* Visible failure message. This used to be spoken only, so a muted
            or deaf user got no explanation at all and the screen looked
            simply broken. */}
        {shownError && (
          <div className="ir-auth-error">
            <ErrorState title={ar ? 'مش قادرين ندخّلك' : 'We could not sign you in'} body={shownError} />
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          onClick={handleLogin}
          disabled={isLoading || !ready}
          iconEnd={ready && !isLoading ? 'forward' : undefined}
          hint={
            !ready
              ? ar
                ? 'اكتبي البريد وكلمة المرور عشان نكمّل.'
                : 'Enter your email and password to continue.'
              : undefined
          }
          className="ir-auth-cta ir-auth-cta--full"
        >
          {isLoading ? (ar ? 'جاري الدخول...' : 'Signing in…') : ar ? 'دخول الآن' : 'Login Now'}
        </Button>
      </motion.div>
    </AuthShell>
  );
}
