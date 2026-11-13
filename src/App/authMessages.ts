/**
 * Human-readable, bilingual messages for the server's auth error codes.
 *
 * The registration and login screens used to `console.error` the server's code
 * and return a bare `false`, so a parent who mistyped their password, reused an
 * email, or chose a 5-character password saw the form simply refuse to advance
 * with no explanation. These map every code the API can return to a sentence a
 * parent can act on.
 *
 * Codes come from server/server.js — keep the two in step.
 */
export type AuthErrorCode =
  | 'EMAIL_AND_PASSWORD_REQUIRED'
  | 'EMAIL_INVALID'
  | 'PASSWORD_TOO_SHORT'
  | 'CONSENT_REQUIRED'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_REGISTRATION'
  | 'REGISTRATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'UNAUTHENTICATED'
  | 'NETWORK'
  | 'UNKNOWN';

const MESSAGES: Record<AuthErrorCode, { ar: string; en: string }> = {
  EMAIL_AND_PASSWORD_REQUIRED: {
    ar: 'من فضلك اكتب البريد الإلكتروني وكلمة المرور.',
    en: 'Please enter both an email address and a password.',
  },
  EMAIL_INVALID: {
    ar: 'البريد الإلكتروني غير صحيح. مثال: name@example.com',
    en: 'That email address does not look right. Example: name@example.com',
  },
  PASSWORD_TOO_SHORT: {
    ar: 'كلمة المرور لازم تكون ٨ أحرف على الأقل.',
    en: 'Your password needs to be at least 8 characters.',
  },
  CONSENT_REQUIRED: {
    ar: 'لازم توافق على استخدام IRIS كنموذج تعليمي أوّلي قبل ما نكمل.',
    en: 'Please agree to use IRIS as a research-informed prototype before continuing.',
  },
  EMAIL_ALREADY_REGISTERED: {
    ar: 'فيه حساب موجود بالفعل بالبريد ده. جرّب تسجّل الدخول بدل ما تعمل حساب جديد.',
    en: 'An account already exists for this email. Please log in instead.',
  },
  INVALID_REGISTRATION: {
    ar: 'فيه بيانات ناقصة أو غير صحيحة. راجع الحقول من فضلك.',
    en: 'Some details were missing or invalid. Please check the fields and try again.',
  },
  REGISTRATION_FAILED: {
    ar: 'مقدرناش نكمّل التسجيل دلوقتي. حاول تاني من فضلك.',
    en: "We couldn't complete your registration just now. Please try again.",
  },
  INVALID_CREDENTIALS: {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    en: 'That email and password do not match an account.',
  },
  SESSION_EXPIRED: {
    ar: 'انتهت مدة الجلسة. من فضلك سجّل الدخول تاني.',
    en: 'Your session has expired. Please log in again.',
  },
  UNAUTHENTICATED: {
    ar: 'من فضلك سجّل الدخول للمتابعة.',
    en: 'Please log in to continue.',
  },
  NETWORK: {
    // The single most common cause during a demo: the backend is not running.
    ar: 'مقدرناش نوصل للخادم. اتأكد إن الخادم شغّال وحاول تاني.',
    en: "We couldn't reach the server. Check that the backend is running, then try again.",
  },
  UNKNOWN: {
    ar: 'حصل خطأ غير متوقع. حاول تاني من فضلك.',
    en: 'Something went wrong. Please try again.',
  },
};

export function authMessage(code: string | undefined | null, language: 'ar' | 'en'): string {
  const key = (code as AuthErrorCode) in MESSAGES ? (code as AuthErrorCode) : 'UNKNOWN';
  return MESSAGES[key][language];
}
