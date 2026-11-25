import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL, authHeaders } from '../config';
import { AuthShell } from './auth/AuthShell';
import { Button } from './iris/ui/brand';
import { ChevronLeft, ChevronRight, Mail, RefreshCw } from 'lucide-react';

/**
 * Email verification (auth spec §3).
 *
 * Reached automatically when a signed-in account has no verified email:
 * right after the child assessment finishes, or on login for an account
 * that never completed verification. The code itself is the server's
 * business — this screen only asks for it, shows honest states, and hands
 * control back to the router once /api/verify/confirm says the account is
 * verified. Nothing here can mark the account verified locally: the flag
 * comes back from the database with every response.
 *
 * Honest email delivery: the first mount calls /api/verify/send. If the
 * deployment has no email provider configured the server answers
 * `sent:false` + reason, and this screen says exactly that (test mode may
 * hand back the code as devCode — shown as a hint, never auto-accepted).
 */
export function EmailVerificationScreen() {
  const { navigateTo, childProfile, setEmailVerified, registerEmailSent, logoutUser } = useApp();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const { playSound, speak } = useAudio();

  const email = childProfile?.email || '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [phase, setPhase] = useState<'sending' | 'waiting' | 'checking' | 'sent'>('sending');
  const [note, setNote] = useState<string | null>(null); // honest provider note
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const boxesRef = useRef<Array<HTMLInputElement | null>>([]);
  const startedRef = useRef(false);

  const codeString = digits.join('');

  const requestSend = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      // The email template follows the language of the interface that asked
      // for it — the server stores nothing about language, so we say so.
      const res = await fetch(`${API_URL}/verify/send`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ lang: language }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setCooldown(Math.ceil((data.retryAfterMs || 15000) / 1000));
        setNote(ar
          ? 'طلبتي كود جديد من قبل — انتظر ثواني قليلة ثم أعد المحاولة.'
          : 'You just requested a code — wait a few seconds and try again.');
      } else if (data.alreadyVerified) {
        // Verified elsewhere (link opened twice, other device): straight in.
        setEmailVerified(true);
        navigateTo('iris-parent');
        return;
      } else if (data.sent) {
        setPhase('sent');
        // Test mode works with a real provider too: VERIFY_DEV_CODES makes
        // the server echo the code it just emailed, so local QA (and the
        // on-screen chip) can complete the flow without an inbox. On any
        // real deployment the field is absent and this stays invisible.
        if (data.devCode) setDevCode(String(data.devCode));
        setNote(ar
          ? `أرسلنا كوداً من ٦ أرقام إلى ${email}. الكود صالح ١٥ دقيقة.`
          : `We sent a 6-digit code to ${email}. It is valid for 15 minutes.`);
        setCooldown(30);
      } else if (data.reason === 'EMAIL_NOT_CONFIGURED') {
        setPhase('waiting');
        if (data.devCode) {
          setDevCode(String(data.devCode));
          setNote(ar
            ? 'خدمة البريد غير مفعّلة على هذا النشر — وضع الاختبار يُظهر الكود هنا.'
            : 'No email provider is configured on this deployment — test mode shows the code here.');
        } else {
          setNote(ar
            ? 'خدمة البريد غير مفعّلة على هذا النشر، لم يُرسل شيء فعلياً. فعّل بريد الخدمة (RESEND_API_KEY أو SMTP) ثم أعد المحاولة.'
            : 'This deployment has no email provider configured, so nothing was actually sent. Set RESEND_API_KEY or SMTP_* and retry.');
        }
      } else if (data.error === 'EMAIL_SEND_FAILED') {
        setPhase('waiting');
        setError(ar
          ? 'تعذر إرسال البريد — اضغط إعادة الإرسال للمحاولة مرة أخرى.'
          : 'The email could not be delivered — press resend to try again.');
      } else if (!res.ok) {
        setPhase('waiting');
        setError(ar ? 'حدث خطأ غير متوقع. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
      }
    } catch {
      setPhase('waiting');
      setError(ar ? 'تعذر الوصول إلى الخادم — تحقق من الاتصال.' : 'Cannot reach the server — check your connection.');
    } finally {
      setBusy(false);
    }
  }, [ar, email, navigateTo, setEmailVerified]);

  // First mount: if the email link carried a code (?code=…), prefill it and
  // skip generating a fresh one. Otherwise ask the server to send.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const fromLink = new URLSearchParams(window.location.search).get('code');
    if (fromLink && /^\d{6}$/.test(fromLink)) {
      setDigits(fromLink.split(''));
      setPhase('waiting');
      setNote(ar ? 'فتحنا لك هذا من رابط التحقق — أكمل بإدخال الكود.' : 'Opened from your verification link — confirm the code to continue.');
      return;
    }
    if (registerEmailSent === true) {
      // Spec: registration itself already generated AND emailed the first
      // code. Re-sending here would only hit the resend cooldown, so we
      // simply wait for the parent to type it in.
      setPhase('sent');
      setNote(ar
        ? 'أرسلنا لك كودًا مكونًا من ٦ أرقام لحظة التسجيل — افتح بريدك وأدخله.'
        : 'We emailed a 6-digit code the moment you registered — open your inbox and enter it.');
      return;
    }
    if (registerEmailSent === false) {
      // Honest failure: the code exists but the email did not go out.
      setPhase('waiting');
      setError(ar
        ? 'تعذر إرسال البريد لحظة التسجيل — اضغط إعادة الإرسال.'
        : 'The registration email could not be sent — use resend below.');
      return;
    }
    void requestSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i: number, ch: string) => {
    setError(null);
    const clean = ch.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[i] = '';
      setDigits(next);
      return;
    }
    if (clean.length > 1) {
      // Pasted full code.
      const spread = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''].map((_, k) => spread[k] ?? '').slice(0, 6);
      setDigits(next);
      const focusAt = Math.min(spread.length, 5);
      boxesRef.current[focusAt]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean[clean.length - 1];
    setDigits(next);
    if (i < 5) boxesRef.current[i + 1]?.focus();
  };

  const onKey = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      boxesRef.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && i > 0) boxesRef.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < 5) boxesRef.current[i + 1]?.focus();
  };

  const confirm = async () => {
    if (codeString.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    setPhase('checking');
    try {
      const res = await fetch(`${API_URL}/verify/confirm`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: codeString }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        playSound('success');
        speak(ar ? 'تم التحقق! أهلاً بك في IRIS.' : 'Verified! Welcome to IRIS.', language);
        setEmailVerified(true);
        // Leave /verify out of history so the back button cannot revisit it.
        window.history.replaceState({ screen: 'iris-parent' }, '', '/parent');
        navigateTo('iris-parent');
        return;
      }
      playSound('error');
      if (data.error === 'CODE_EXPIRED' || data.error === 'NO_PENDING_CODE' || data.error === 'TOO_MANY_ATTEMPTS') {
        setDigits(['', '', '', '', '', '']);
        setNote(ar
          ? 'الكود لم يعد صالحاً — اطلب كوداً جديداً.'
          : 'That code is no longer valid — request a new one.');
        setError(ar ? 'انتهت صلاحية الكود. اضغط إعادة الإرسال.' : 'The code expired. Press resend.');
      } else if (data.error === 'CODE_WRONG') {
        setError(ar ? 'الكود غير صحيح — راجع الأرقام.' : 'That code is not correct — check the digits.');
      } else {
        setError(data.detail || (ar ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
      }
      setPhase('waiting');
    } catch {
      setPhase('waiting');
      setError(ar ? 'تعذر الوصول إلى الخادم.' : 'Cannot reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    playSound('tap');
    navigateTo('marketing');
  };

  /**
   * Escape hatch for the one loop this screen used to have no answer for:
   * the address is wrong (typo, or a family member's inbox) or the parent
   * simply cannot get into it. Registration had already created the account,
   * so retrying sign-up answered EMAIL_ALREADY_REGISTERED — and the account
   * could not be entered either, because the code goes to an inbox nobody can
   * open. Signing out here clears the session so the parent can start again
   * with a different address (or log in properly).
   */
  const startOver = async () => {
    playSound('tap');
    await logoutUser();
    navigateTo('registration');
  };

  return (
    <AuthShell
      tone="blue"
      title={ar ? 'تأكيد البريد الإلكتروني' : 'Verify your email'}
      tagline={ar
        ? 'خطوة إلزامية قبل دخول IRIS — أرسلنا كود تحقق إلى بريدك.'
        : 'A required step before entering IRIS — we emailed you a verification code.'}
      topBar={
        <div className="ir-auth-bar">
          <button type="button" className="ir-auth-back" onClick={handleBack}>
            {ar ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
            <span>{ar ? 'الرئيسية' : 'Home'}</span>
          </button>
        </div>
      }
      footer={
        <div className="ir-verify-foot">
          <p className="ir-auth-footnote">
            {ar ? 'لم يصلك البريد؟ ' : "Didn't get it? "}
            <button
              type="button"
              className="ir-auth-linkbtn"
              onClick={() => { void requestSend(); }}
              disabled={busy || cooldown > 0}
            >
              <RefreshCw size={14} aria-hidden="true" />{' '}
              {cooldown > 0
                ? (ar ? `إعادة الإرسال بعد ${cooldown} ثانية` : `Resend in ${cooldown}s`)
                : (ar ? 'إعادة إرسال الكود' : 'Resend the code')}
            </button>
          </p>
          <p className="ir-auth-footnote">
            {ar ? 'البريد ده مش بتاعك أو مش قادر تفتحه؟ ' : "Wrong address or can't open it? "}
            <button type="button" className="ir-auth-linkbtn" onClick={() => { void startOver(); }}>
              {ar ? 'ابدأ من جديد ببريد تاني' : 'Start over with another email'}
            </button>
          </p>
        </div>
      }
    >
      <div className="ir-verify" dir={ar ? 'rtl' : 'ltr'}>
        <div className="ir-verify-mail" aria-hidden="true">
          <Mail size={18} />
        </div>
        <p className="ir-verify-email">{email || (ar ? 'بريدك المسجّل' : 'your registered email')}</p>

        {phase === 'sending' && (
          <p className="ir-verify-note" role="status">
            {ar ? 'جارٍ إرسال كود التحقق…' : 'Sending your verification code…'}
          </p>
        )}
        {note && <p className="ir-verify-note">{note}</p>}

        {/* Deliverability is the single most common reason a correct code is
            never entered: the mail is in spam, or on its way. Say it here
            rather than leaving the parent to guess. */}
        {phase !== 'checking' && (
          <p className="ir-verify-hint">
            {ar
              ? 'مش لاقي الرسالة؟ بص في مجلد «الرسائل غير المرغوب فيها / Spam»، وتأكد إنك بتفتح نفس البريد المكتوب فوق.'
              : "Can't find it? Check your spam folder, and make sure you are opening the address shown above."}
          </p>
        )}

        {devCode && (
          <button
            type="button"
            className="ir-verify-devcode"
            onClick={() => { setDigits(devCode.split('')); }}
            title={ar ? 'اضغط لملء الكود تلقائياً (وضع اختبار)' : 'Click to fill the code (test mode)'}
          >
            {ar ? `كود وضع الاختبار: ${devCode}` : `Test-mode code: ${devCode}`}
          </button>
        )}

        <div
          className="ir-verify-code"
          role="group"
          /* P66: OTP digits are Latin and ALWAYS read left→right — including
             in the Arabic UI. Under the card's dir=rtl the flex row painted
             digit 1 on the right, so typing marched backwards and the code
             looked reversed (user report). Pin the group to ltr; the labels,
             buttons and prose around it stay rtl. */
          dir="ltr"
          aria-label={ar ? 'كود التحقق من ستة أرقام' : 'Six digit verification code'}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { boxesRef.current[i] = el; }}
              className={`ir-verify-box${d ? ' ir-verify-box--filled' : ''}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={onKey(i)}
              onFocus={(e) => e.target.select()}
              aria-label={ar ? `الرقم ${i + 1}` : `digit ${i + 1}`}
            />
          ))}
        </div>

        {error && <p className="ir-verify-error" role="alert">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          full
          onClick={() => { void confirm(); }}
          disabled={busy || codeString.length !== 6 || phase === 'checking'}
          hint={ar ? 'تأكيد الدخول إلى IRIS' : 'Confirm and enter IRIS'}
        >
          {/* Audit P2: 'checking' existed in state but nothing ever showed
              it — the confirm press looked dead for the whole request. */}
          <span className="ir-auth-cta-inner">
            {phase === 'checking'
              ? (ar ? 'جارٍ التحقق…' : 'Verifying…')
              : (ar ? 'تأكيد الكود' : 'Confirm code')}
          </span>
        </Button>
      </div>
    </AuthShell>
  );
}

export default EmailVerificationScreen;
