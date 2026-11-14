/**
 * Verification mail transport — chosen by configuration, never faked.
 *
 * Modes (first match wins):
 *   resend  RESEND_API_KEY set                    — HTTPS API call, no deps.
 *   smtp    SMTP_HOST + SMTP_USER + SMTP_PASS     — nodemailer, port 465/587.
 *   none    nothing configured                    — sendEmail throws
 *           EMAIL_NOT_CONFIGURED so callers can tell the user honestly.
 *
 * Template follows the owner's "Premium Playful Email" spec (P54):
 * real IRIS logo up top, the code as the visual centerpiece — each digit
 * in its own rounded box cycling the exact brand palette (blue/coral/
 * yellow/green/purple, washes and ink values from src/styles/iris.css) —
 * soft geometric confetti placed with intent (not random), warm off-white
 * paper, table layout, inline CSS only, safe fonts, no JS, no webfonts,
 * plain-text fallback, and the code selectable for copying.
 * The English copy is primary per the spec; an Arabic variant of the SAME
 * layout exists because the app itself is bilingual.
 */
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* only needed in smtp mode */ }

const APP_ORIGIN = process.env.PUBLIC_APP_ORIGIN || 'https://iris-kohl-seven.vercel.app';
const FROM = process.env.EMAIL_FROM || 'IRIS <verify@iris-app.local>';

// Exact tokens mirrored from src/styles/iris.css — nothing invented.
const P = {
  blue:   { solid: '#1f67b1', wash: '#e5eff9', ink: '#18508a' },
  coral:  { solid: '#c84b51', wash: '#fde9ea', ink: '#863236' },
  yellow: { solid: '#feca34', wash: '#fdf3d8', ink: '#614d14' },
  green:  { solid: '#358458', wash: '#e6f5ed', ink: '#23583b' },
  purple: { solid: '#8060b4', wash: '#f0eaf8', ink: '#5a437e' },
};
const ORDER = ['blue', 'coral', 'yellow', 'green', 'purple', 'blue'];
const C = {
  paper: '#FBF6EC', card: '#FFFFFF', ink: '#2A2118', inkSoft: '#57493A',
  inkFaint: '#9A8B76', line: '#EDE3D3',
};

const SANS = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

function brandAssets() {
  // Absolute HTTPS so Gmail/Outlook fetch them; shipped under public/images.
  return {
    logo: `${APP_ORIGIN}/images/iris-logo-static.png`,
    mascot: `${APP_ORIGIN}/images/iris-mascot-email.png`,
  };
}

// One rounded box per digit, cycling the brand palette. Digit ink is the
// brand-dark variant for contrast on the brand wash — readable in every
// client, playful but never noisy. dir=ltr keeps digit order safe in RTL.
function codeBoxes(code) {
  return String(code).split('').map((d, i) => {
    const p = P[ORDER[i % ORDER.length]];
    return `<td align="center" style="padding:0 4px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" width="52" height="62" bgcolor="${p.wash}" style="width:52px;height:62px;background:${p.wash};border:2px solid ${p.solid};border-radius:16px;">
          <span style="font-family:${SANS};font-size:28px;font-weight:bold;color:${p.ink};line-height:62px;">${d}</span>
        </td>
      </tr></table>
    </td>`;
  }).join('');
}

function copy(lang) {
  const ar = lang !== 'en';
  return ar
    ? {
        subject: 'IRIS — كود تأكيد بريدك الإلكتروني',
        pre: 'خطوة واحدة تفصل طفلك عن أول مغامرة تعليمية.',
        headline: 'يلا نبدأ!',
        msg: 'أهلاً بيك في IRIS! سعيدون إننا هنكون جزء من رحلة تعلّم طفلك. لتأكيد بريدك وتفعيل حسابك، أدخل كود التحقق ده:',
        codeLbl: 'كود التحقق الخاص بيك',
        valid: 'الكود صالح لمدة %M% دقيقة.',
        closing: 'خطوة صغيرة في طريق تعلّم أجمل',
        sign1: 'بكل عناية،',
        sign2: 'فريق IRIS',
        ignore: 'لو مش انت اللي عملت الحساب، تقدر تتجاهل الرسالة بأمان — لن يتغير أي شيء.',
        btn: 'تأكيد البريد الإلكتروني',
      }
    : {
        subject: 'IRIS — your email verification code',
        pre: 'One little step before the adventure begins.',
        headline: "Let's Get Started!",
        msg: "Welcome to IRIS! We're excited to be part of your child's learning journey. To verify your email address and activate your account, simply enter the code below.",
        codeLbl: 'YOUR VERIFICATION CODE',
        valid: 'This code is valid for %M% minutes.',
        closing: 'One little step towards a brighter learning journey!',
        sign1: 'With care,',
        sign2: 'The IRIS Team',
        ignore: "Didn't create this account? You can safely ignore this email — nothing will change.",
        btn: 'Verify my email',
      };
}

function buildVerificationEmail(code, lang, ttlMinutes) {
  const { logo, mascot } = brandAssets();
  const link = `${APP_ORIGIN}/verify?code=${code}`;
  const ar = lang !== 'en';
  const T = copy(lang);
  // The email must state the REAL lifetime — never a fixed sample number.
  const minutes = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : 15;
  const valid = T.valid.replace('%M%', String(ar ? minutes : minutes));

  // Gentle geometric background: a circle, a ring, a star and a dot at the
  // hero corners — brand colours, generous spacing, nothing random.
  const decor = (align) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height:14px;">
      <tr>
        <td width="25%" align="${align === 'right' ? 'left' : 'right'}" valign="bottom">
          <div style="width:14px;height:14px;border-radius:14px;background:${P.yellow.wash};border:2px solid ${P.yellow.solid};"></div>
        </td>
        <td width="50%"></td>
        <td width="25%" align="${align === 'right' ? 'right' : 'left'}" valign="bottom">
          <div style="width:10px;height:10px;border-radius:10px;background:${P.blue.solid};"></div>
        </td>
      </tr>
    </table>`;

  return {
    subject: T.subject,
    text: `${T.headline}

${T.msg}

${T.codeLbl}: ${code}
${valid}
${link}

${T.ignore}`,
    html: `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>IRIS</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${T.pre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
    <tr><td align="center" style="padding:36px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">

        <!-- the real logo, unmodified, clearly visible near the top -->
        <tr><td align="center" style="padding:6px 0 20px;">
          <img src="${logo}" width="110" height="110" alt="IRIS" style="display:block;width:110px;height:110px;border:0;">
        </td></tr>

        <!-- soft card -->
        <tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:22px;padding:34px 30px 26px;" bgcolor="${C.card}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

            <tr><td>${decor(ar ? 'right' : 'left')}</td></tr>

            <!-- headline -->
            <tr><td align="${ar ? 'right' : 'center'}" style="padding:6px 0 10px;">
              <h1 style="margin:0;font-family:${SERIF};font-size:24px;color:${C.ink};">${T.headline}</h1>
            </td></tr>

            <!-- welcome message -->
            <tr><td align="${ar ? 'right' : 'center'}" style="padding-bottom:26px;">
              <p style="margin:0;font-family:${SANS};font-size:14.5px;line-height:1.7;color:${C.inkSoft};">${T.msg}</p>
            </td></tr>

            <!-- THE CENTERPIECE: multicolored code -->
            <tr><td align="center" style="padding-bottom:12px;">
              <span dir="ltr" style="font-family:${SANS};font-size:11px;letter-spacing:2px;color:${C.inkFaint};font-weight:bold;">${T.codeLbl}</span>
            </td></tr>
            <tr><td align="center" dir="ltr" style="padding-bottom:14px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${codeBoxes(code)}</tr></table>
            </td></tr>
            <tr><td align="center" style="padding-bottom:26px;">
              <span style="font-family:${SANS};font-size:12.5px;color:${C.inkFaint};">${valid}</span>
            </td></tr>

            <!-- one calm action -->
            <tr><td align="center" style="padding-bottom:8px;">
              <a href="${link}" target="_blank" style="display:inline-block;background:${P.blue.solid};color:#FFFFFF;font-family:${SANS};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 34px;border-radius:9999px;">${T.btn}</a>
            </td></tr>
            <tr><td align="center" style="padding-bottom:24px;">
              <span style="font-family:${SANS};font-size:12px;color:${C.inkFaint};"><span dir="ltr" style="letter-spacing:3px;color:${P.blue.ink};font-weight:bold;font-size:13px;">${code}</span></span>
            </td></tr>

            <!-- closing line + signature with small mascot -->
            <tr><td align="${ar ? 'right' : 'center'}" style="padding-bottom:18px;">
              <p style="margin:0;font-family:${SERIF};font-size:14.5px;color:${P.purple.ink};">${T.closing}</p>
            </td></tr>
            <tr><td align="${ar ? 'right' : 'left'}" style="border-top:1px solid ${C.line};padding-top:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${ar ? 'right' : 'left'}"><tr>
                <td valign="middle" style="padding-${ar ? 'left' : 'right'}:12px;">
                  <img src="${mascot}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;border-radius:50%;">
                </td>
                <td valign="middle" align="${ar ? 'right' : 'left'}" nowrap style="font-family:${SERIF};font-size:13.5px;color:${C.ink};line-height:1.5;">${T.sign1}<br>${T.sign2}</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>

        <!-- fine print -->
        <tr><td align="center" style="padding:16px 10px 0;">
          <p style="margin:0 0 8px;font-family:${SANS};font-size:11.5px;line-height:1.6;color:${C.inkFaint};">${T.ignore}</p>
          <a href="${APP_ORIGIN}" style="font-family:${SANS};font-size:11.5px;color:${C.inkFaint};text-decoration:none;letter-spacing:1px;">iris · ${APP_ORIGIN.replace(/^https?:\/\//, '')}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function mode() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

async function sendVerificationEmail(email, code, lang, ttlMinutes) {
  const m = mode();
  if (m === 'none') {
    const err = new Error('EMAIL_NOT_CONFIGURED');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
  const mail = buildVerificationEmail(code, lang, ttlMinutes);
  if (m === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [email], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(`EMAIL_SEND_FAILED: resend ${res.status} ${body.slice(0, 200)}`);
      err.code = 'EMAIL_SEND_FAILED';
      throw err;
    }
    return 'resend';
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: FROM, to: email, subject: mail.subject, html: mail.html, text: mail.text });
  return 'smtp';
}

module.exports = { mode, buildVerificationEmail, sendVerificationEmail };
