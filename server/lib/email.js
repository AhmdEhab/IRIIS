/**
 * Verification mail transport — chosen by configuration, never faked.
 *
 * Modes (first match wins):
 *   resend  RESEND_API_KEY set                    — HTTPS API call, no deps.
 *   smtp    SMTP_HOST + SMTP_USER + SMTP_PASS     — nodemailer, port 465/587.
 *   none    nothing configured                    — sendEmail throws
 *           EMAIL_NOT_CONFIGURED so callers can tell the user honestly.
 *
 * Documented in docs/AUTH_FLOW_REPORT.md. On Vercel set the vars as secrets:
 *   vercel env add RESEND_API_KEY production   (or SMTP_HOST/PORT/USER/PASS)
 * Optional: EMAIL_FROM, PUBLIC_APP_ORIGIN (link target /verify?code=…).
 *
 * Design language (v2, after the owner rejected the confetti version):
 * one accent (brand blue), generous whitespace, serif display headline with
 * a single soft-yellow swash — the same calm-premium mood as the landing
 * page. The mascot appears ONCE, small, as the signature. No rainbows.
 */
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* only needed in smtp mode */ }

const APP_ORIGIN = process.env.PUBLIC_APP_ORIGIN || 'https://iris-kohl-seven.vercel.app';
const FROM = process.env.EMAIL_FROM || 'IRIS <verify@iris-app.local>';

// Mirrors src/styles/iris.css tokens, pared back to a calm two-tone palette.
const C = {
  paper: '#FBF7EF', card: '#FFFFFF', ink: '#2A2118', inkSoft: '#5A4E3F',
  inkFaint: '#9A8B76', blue: '#1F67B1', blueDeep: '#16456F', blueTint: '#EAF3FB',
  yellow: '#FECA34', line: '#EDE3D3',
};

function brandAssets() {
  // Absolute HTTPS so Gmail can fetch them; both shipped under public/images.
  return {
    logo: `${APP_ORIGIN}/images/iris-logo-static.png`,
    mascot: `${APP_ORIGIN}/images/iris-mascot-email.png`,
  };
}

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

function buildVerificationEmail(code, lang) {
  const { logo, mascot } = brandAssets();
  const link = `${APP_ORIGIN}/verify?code=${code}`;
  const ar = lang !== 'en';
  // Per-language copy — the account holder picked a UI language on the site.
  const T = ar
    ? {
        title: 'كود تأكيد البريد',
        sub: 'خطوة أخيرة قبل أن تبدأ المغامرة. أدخل الكود على شاشة الموقع، أو اضغط الزر للتأكيد السريع.',
        codeLbl: 'كود التحقق',
        expires: 'صالح لمدة ١٥ دقيقة',
        btn: 'تأكيد البريد الآن',
        alt: 'أو أدخل الكود يدويًا: ',
        ignore: 'إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذا البريد بأمان — لن يتغير أي شيء.',
        team: 'فريق IRIS',
        pre: 'خطوة واحدة تفصل طفلك عن أول مغامرة تعليمية.',
      }
    : {
        title: 'Confirm your email',
        sub: 'One last step before the adventure begins. Enter the code on the website, or verify instantly with the button.',
        codeLbl: 'Verification code',
        expires: 'Valid for 15 minutes',
        btn: 'Verify my email',
        alt: 'Or enter the code manually: ',
        ignore: "Didn't create this account? You can safely ignore this email — nothing will change.",
        team: 'The IRIS team',
        pre: 'One step away from your child’s first learning adventure.',
      };

  // The code itself: one ticket, big spaced digits, LTR no matter the page
  // direction so digits never reorder in RTL clients.
  const ticket = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:${C.blueTint};border:1.5px solid ${C.blue};border-radius:16px;">
      <tr><td align="center" dir="ltr" style="padding:20px 16px 16px;">
        <span style="font-family:${SANS};font-size:11px;letter-spacing:2.5px;color:${C.blueDeep};text-transform:uppercase;font-weight:bold;">${T.codeLbl}</span>
      </td></tr>
      <tr><td align="center" dir="ltr" style="padding:0 16px 16px;">
        <span style="font-family:${SERIF};font-size:34px;font-weight:bold;color:${C.ink};letter-spacing:10px;text-indent:10px;display:block;">${code}</span>
      </td></tr>
      <tr><td align="center" dir="ltr" style="padding:0 16px 16px;">
        <span style="font-family:${SANS};font-size:12px;color:${C.inkFaint};">${T.expires}</span>
      </td></tr>
    </table>`;

  return {
    subject: ar ? 'IRIS — كود تأكيد بريدك الإلكتروني' : 'IRIS — your email verification code',
    text: `${T.title}\n\n${T.codeLbl}: ${code}\n${T.expires}\n${link}\n\n${T.ignore}`,
    html: `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>IRIS</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${T.pre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

        <!-- logo, quietly centered — the only brand mark up top -->
        <tr><td align="center" style="padding:0 0 34px;">
          <img src="${logo}" width="86" height="86" alt="IRIS" style="display:block;width:86px;height:86px;border:0;">
        </td></tr>

        <!-- card -->
        <tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:34px 32px 26px;" bgcolor="${C.card}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

            <!-- headline + single brand swash (like the landing mark) -->
            <tr><td style="padding-bottom:4px;">
              <h1 style="margin:0;font-family:${SERIF};font-size:23px;font-weight:bold;color:${C.ink};">${T.title}</h1>
            </td></tr>
            <tr><td style="padding:8px 0 14px;">
              <div style="width:56px;height:5px;border-radius:5px;background:${C.yellow};${ar ? 'margin-left:auto;' : ''}"></div>
            </td></tr>

            <tr><td style="padding-bottom:24px;">
              <p style="margin:0;font-family:${SANS};font-size:14.5px;line-height:1.7;color:${C.inkSoft};">${T.sub}</p>
            </td></tr>

            <!-- code ticket -->
            <tr><td>${ticket}</td></tr>

            <!-- one clear action -->
            <tr><td align="center" style="padding:26px 0 4px;">
              <a href="${link}" target="_blank" style="display:inline-block;background:${C.blue};color:#FFFFFF;font-family:${SANS};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 36px;border-radius:9999px;">${T.btn}</a>
            </td></tr>
            <tr><td align="center" style="padding:8px 0 24px;">
              <span style="font-family:${SANS};font-size:12px;color:${C.inkFaint};">${T.alt}<b dir="ltr" style="letter-spacing:2px;color:${C.blueDeep};font-size:13px;">${code}</b></span>
            </td></tr>

            <!-- signature: the mascot joins once, small, beside the team name -->
            <tr><td style="border-top:1px solid ${C.line};padding-top:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${ar ? 'float:right;' : 'float:left;'}">
                <tr>
                  <td valign="middle" style="padding-${ar ? 'left' : 'right'}:10px;">
                    <img src="${mascot}" width="38" height="38" alt="" style="display:block;width:38px;height:38px;border:0;border-radius:50%;">
                  </td>
                  <td valign="middle" style="font-family:${SERIF};font-size:14px;color:${C.ink};">${T.team}</td>
                </tr>
              </table>
              <div style="clear:both;"></div>
            </td></tr>
          </table>
        </td></tr>

        <!-- fine print, outside the card -->
        <tr><td align="center" style="padding:18px 12px 0;">
          <p style="margin:0 0 10px;font-family:${SANS};font-size:11.5px;line-height:1.6;color:${C.inkFaint};">${T.ignore}</p>
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

async function sendVerificationEmail(email, code, lang) {
  const m = mode();
  if (m === 'none') {
    const err = new Error('EMAIL_NOT_CONFIGURED');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
  const mail = buildVerificationEmail(code, lang);
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
