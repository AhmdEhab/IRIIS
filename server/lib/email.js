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
 * Optional: EMAIL_FROM (defaults to IRIS <onboarding@resend.dev> style),
 * PUBLIC_APP_ORIGIN (the link inside the email points at /verify?code=…).
 */
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch { /* only needed in smtp mode */ }

const APP_ORIGIN = process.env.PUBLIC_APP_ORIGIN || 'https://iris-kohl-seven.vercel.app';
const FROM = process.env.EMAIL_FROM || 'IRIS <verify@iris-app.local>';

// Brand palette (mirrors src/styles/iris.css tokens) so the email reads as
// the same product the parent just landed on — no external CSS, no fonts to
// block, table layout, inline styles for maximum client compatibility.
const C = {
  cream: '#FFF9F0', ink: '#2A2118', blue: '#1F67B1', blueDeep: '#1F4E79',
  yellow: '#F5C842', coral: '#D1495B', green: '#4CA772', purple: '#7A5AA6',
  softBlue: '#E7F0FA', softYellow: '#FDF3D7', line: '#EDE3D3',
};

function brandAssets() {
  // Absolute HTTPS so Gmail can fetch them; both shipped under public/images.
  return {
    logo: `${APP_ORIGIN}/images/iris-logo-static.png`,
    mascot: `${APP_ORIGIN}/images/iris-mascot-email.png`,
  };
}

function buildVerificationEmail(code, lang) {
  const { logo, mascot } = brandAssets();
  const link = `${APP_ORIGIN}/verify?code=${code}`;
  const ar = lang !== 'en';
  // Per-language copy — the account holder picked a UI language on the site.
  const T = ar
    ? { hi: 'أهلاً بيك في IRIS 👋', sub: 'عشان نكمل تسجيل طفلنا ويبدأ مغامرته، محتاجين نتأكد من بريدك.', codeLbl: 'رمز التحقق', expires: 'الكود صالح ١٥ دقيقة.', btn: 'تأكيد البريد الإلكتروني', alt: 'أو انسخ الكود ده في شاشة الموقع:', ignore: 'لو مش انت اللي عملت الحساب، تقدر تتجاهل الرسالة بأمان — مفيش حاجة هتتغير.', thanks: 'بكل حب،\nفريق IRIS 🌈' }
    : { hi: 'Welcome to IRIS 👋', sub: 'To finish setting up your child and start their adventure, let’s confirm your email.', codeLbl: 'Your verification code', expires: 'This code expires in 15 minutes.', btn: 'Verify my email', alt: 'Or paste this code on the website screen:', ignore: 'Didn’t create an IRIS account? You can safely ignore this email — nothing will change.', thanks: 'With love,\nThe IRIS team 🌈' };

  // Colourful dot strip — a tiny, playful brand signature that needs no image.
  const dots = [C.blue, C.yellow, C.coral, C.green, C.purple]
    .map((c) => `<td style="padding:0 3px;"><div style="width:9px;height:9px;border-radius:9px;background:${c};"></div></td>`)
    .join('');

  // Big rounded code chips, one per digit — kid-friendly and hard to misread.
  const digits = String(code).split('').map((d) =>
    `<td style="padding:0 4px;"><div style="min-width:44px;padding:12px 6px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:${C.blueDeep};background:${C.softBlue};border:2px solid ${C.blue};border-radius:14px;line-height:1;">${d}</div></td>`
  ).join('');

  return {
    subject: ar ? 'أكّد بريدك في IRIS — الكود جاهز 🌈' : 'Confirm your IRIS email — your code is ready 🌈',
    text: `${T.hi.replace(' 👋', '')}\n\n${T.codeLbl}: ${code}\n${T.expires}\n${link}\n\n${T.ignore}`,
    html: `<!DOCTYPE html>
<html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>IRIS</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${T.codeLbl}: ${code} — ${T.expires}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
    <tr><td align="center" style="padding:26px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">

        <!-- top rainbow hair, like the mascot -->
        <tr><td height="8" bgcolor="${C.blue}" style="border-radius:22px 22px 0 0;line-height:8px;font-size:1px;">&nbsp;</td></tr>

        <!-- card -->
        <tr>
          <td style="background:#FFFFFF;border:1px solid ${C.line};border-top:0;border-radius:0 0 22px 22px;padding:28px 26px 22px;" bgcolor="#FFFFFF">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <!-- logo + mascot -->
              <tr>
                <td align="center" style="padding-bottom:6px;">
                  <img src="${logo}" width="120" height="120" alt="IRIS" style="display:block;width:120px;height:120px;border:0;">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:2px 0 12px;">
                  <img src="${mascot}" width="88" height="88" alt="" style="display:block;width:88px;height:88px;border:0;border-radius:24px;">
                </td>
              </tr>
              <!-- dot strip -->
              <tr><td align="center" style="padding:2px 0 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${dots}</tr></table>
              </td></tr>

              <!-- greeting -->
              <tr><td style="text-align:${ar ? 'right' : 'left'};padding-bottom:6px;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${C.ink};">${T.hi}</h1>
              </td></tr>
              <tr><td style="text-align:${ar ? 'right' : 'left'};padding-bottom:20px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#5A4E3F;">${T.sub}</p>
              </td></tr>

              <!-- code panel -->
              <tr><td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.softYellow};border-radius:18px;padding:18px 16px;" bgcolor="${C.softYellow}">
                  <tr><td align="center" style="padding-bottom:12px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:1px;color:${C.blueDeep};text-transform:uppercase;font-weight:bold;">${T.codeLbl}</span>
                  </td></tr>
                  <tr><td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr"><tr>${digits}</tr></table>
                  </td></tr>
                  <tr><td align="center" style="padding-top:12px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7A6A54;">${T.expires}</span>
                  </td></tr>
                </table>
              </td></tr>

              <!-- verify button -->
              <tr><td align="center" style="padding:22px 0 6px;">
                <a href="${link}" target="_blank" style="display:inline-block;background:${C.blue};color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 34px;border-radius:9999px;box-shadow:0 8px 18px -8px rgba(31,103,177,.6);">${T.btn}</a>
              </td></tr>
              <tr><td align="center" style="padding:6px 0 20px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9A8B76;">${T.alt} <b dir="ltr" style="letter-spacing:2px;color:${C.blueDeep};">${code}</b></span>
              </td></tr>

              <!-- ignore note -->
              <tr><td style="border-top:1px dashed ${C.line};padding-top:14px;text-align:${ar ? 'right' : 'left'};">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9A8B76;">${T.ignore}</p>
              </td></tr>
              <tr><td style="padding-top:14px;text-align:${ar ? 'right' : 'left'};">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${C.ink};white-space:pre-line;">${T.thanks}</p>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- footer wordmark -->
        <tr><td align="center" style="padding:16px 0 4px;">
          <span style="font-family:Georgia,serif;font-size:12px;color:#B7A892;letter-spacing:2px;">IRIS · iris-kohl-seven.vercel.app</span>
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
