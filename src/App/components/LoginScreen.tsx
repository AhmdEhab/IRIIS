import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { authMessage } from '../authMessages';
import {
  ScreenFrame,
  TopBar,
  Logo,
  DisplayTitle,
  Button,
  Field,
  ErrorState,
  inputClass,
} from './iris/ui/brand';
import { ChromeActions } from './iris/ui/ChromeActions';

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
    navigateTo('landing');
  };

  const ready = !!email && !!password;

  return (
    <ScreenFrame
      accent="blue"
      width="sm"
      topBar={
        <TopBar
          ar={ar}
          onBack={handleBack}
          backLabel={ar ? 'الرئيسية' : 'Home'}
          actions={<ChromeActions />}
        />
      }
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="pt-4"
      >
        <div className="text-center mb-7">
          <Logo size="md" />
          <DisplayTitle size="title" className="mt-2">
            {ar ? 'مرحباً بعودتك' : 'Welcome back'}
          </DisplayTitle>
          <p className="t-body text-ink-muted mt-2">
            {ar ? 'سجّل الدخول لمتابعة تعلّم طفلك.' : "Sign in to see your child's learning."}
          </p>
        </div>

        <div className="bg-surface border-2 border-hairline rounded-brand-xl shadow-brand p-5 sm:p-6 space-y-5">
          <Field label={ar ? 'البريد الإلكتروني' : 'Email'} id="login-email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                speak(ar ? 'البريد الإلكتروني' : 'Email', language);
                playSound('tap');
              }}
              className={inputClass}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </Field>

          <Field label={ar ? 'كلمة المرور' : 'Password'} id="login-password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                speak(ar ? 'كلمة المرور' : 'Password', language);
                playSound('tap');
              }}
              className={inputClass}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          {/* Visible failure message. This used to be spoken only, so a muted
              or deaf user got no explanation at all and the screen looked
              simply broken. */}
          {shownError && (
            <ErrorState title={ar ? 'مش قادرين ندخّلك' : 'We could not sign you in'} body={shownError} />
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
          >
            {isLoading ? (ar ? 'جاري الدخول...' : 'Signing in…') : ar ? 'دخول الآن' : 'Login Now'}
          </Button>
        </div>

        {/* The wrapper is load-bearing, not decoration. The registration link
            is reached in QA (and by a screen reader walking the region) as
            "the button next to 'Don't have an account?'". Without its own
            container the nearest ancestor of that sentence is the whole form,
            which holds the Login button too — so "the button beside the
            question" becomes ambiguous and resolves to the wrong control. */}
        <div className="mt-6">
          <p className="text-center t-body text-ink-muted">
            {ar ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                playSound('tap');
                navigateTo('registration');
              }}
              className="text-brand-blue-ink font-bold underline underline-offset-4 hover:no-underline"
            >
              {ar ? 'سجل الآن' : 'Register now'}
            </button>
          </p>
        </div>
      </motion.div>
    </ScreenFrame>
  );
}
