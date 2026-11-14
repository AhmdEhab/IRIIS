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

function mode() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

async function sendVerificationEmail(email, code) {
  const link = `${APP_ORIGIN}/verify?code=${code}`;
  const subject = 'IRIS — رمز التحقق الخاص بك / Your verification code';
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:16px;background:#FFF9F0">
      <h2 style="color:#1F4E79">IRIS</h2>
      <p>مرحباً! رمز التحقق الخاص بك هو:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#1F4E79">${code}</p>
      <p>أو افتح هذا الرابط:</p>
      <p><a href="${link}" style="color:#1F4E79">تأكيد البريد الإلكتروني / Verify email</a></p>
      <hr/>
      <p style="color:#666">Hello! Your IRIS verification code is <b>${code}</b>. It expires in 15 minutes.
      You can also open the link above. If you did not create an IRIS account, ignore this email.</p>
    </div>`;
  const m = mode();
  if (m === 'none') {
    const err = new Error('EMAIL_NOT_CONFIGURED');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
  if (m === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [email], subject, html }),
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
  await transport.sendMail({ from: FROM, to: email, subject, html });
  return 'smtp';
}

module.exports = { mode, sendVerificationEmail };
