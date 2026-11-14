/**
 * IRIS backend — MVP.
 *
 * ── SECURITY FIXES APPLIED (from IRIS_IMPLEMENTATION_AUDIT.md §14) ────────
 *  B3.1  Passwords are bcrypt-hashed on write and compared with bcrypt.compare.
 *        Plaintext comparison is gone.
 *  B3.2  `GET /api/users` (unauthenticated full dump including passwords) is
 *        REMOVED. It now returns 410 with an explanation.
 *  B3.3  Every user route requires a bearer token AND checks that the token's
 *        owner matches the record being read or written (no more IDOR).
 *  B3.4  `password` is stripped from every response by a single serializer.
 *  B4    Consent gate: every mutating route requires consent_mvp_use = true,
 *        except registration itself (doc 20 §intro).
 *  §7.6  `sync({ alter: true })` is gated behind an explicit env flag.
 *
 * NOTE ON TOKENS: this MVP uses signed, expiring, in-memory session tokens.
 * That is adequate for a local demo and materially better than what it
 * replaced. It is NOT a production auth system — a real deployment needs
 * JWT with a rotated secret, refresh tokens, and persistent revocation.
 * This limitation is stated in the handover rather than hidden.
 * ──────────────────────────────────────────────────────────────────────────
 */
// Load server/.env BEFORE anything reads process.env. Resolved relative to this
// file, so it works whatever directory the server was started from, and on any
// Node version. See loadEnv.js for why the --env-file flag was not enough.
require('./loadEnv').loadEnv();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const sequelize = require('./config/database');
const User = require('./models/User');
const Post = require('./models/Post');
const Booking = require('./models/Booking');
const Child = require('./models/Child');
const AssessmentRecord = require('./models/AssessmentRecord');
const ActivitySession = require('./models/ActivitySession');
const Session = require('./models/Session');
const VerificationCode = require('./models/VerificationCode');
const { mode: emailMode, sendVerificationEmail } = require('./lib/email');
const blobsync = require('./lib/blobsync');

const app = express();

/* ── durable snapshots on ephemeral hosts (docs/AUTH_FLOW_REPORT.md §9) ──
 * Mutating /api calls schedule a snapshot of the SQLite file into Vercel
 * Blob; every request first awaits any pending snapshot. */
/**
 * Serverless boot gate. On Vercel the function handler can be invoked the
 * moment this module finishes loading, WHILE the restore -> sequelize.sync
 * chain below is still running. Without parking, early requests race the
 * boot: the driver opens a fresh EMPTY /tmp file, restore then overwrites it
 * under the open handle, and the first logins hit half-initialized tables
 * (LOGIN_FAILED on a database that actually exists in the snapshot).
 * Every /api request waits for boot to finish (restore + sync + migrate)
 * before touching the database.
 */
let bootReady = Promise.resolve();
app.use('/api', (req, res, next) => {
  bootReady.then(() => next(), () => res.status(503).json({ error: 'BOOT_FAILED' }));
});

app.use(blobsync.middleware);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

// Narration voice. Isolated in routes/tts.js; holds the ElevenLabs key so it
// never reaches the browser bundle. Degrades to browser speech if unconfigured.
app.use('/api/tts', require('./routes/tts'));



// ── auth ──────────────────────────────────────────────────────────────────
/**
 * Sessions are stored in SQLite (models/Session.js), NOT in memory.
 *
 * They previously lived in a module-level Map, which meant every restart threw
 * away every token while the user rows survived. The browser kept its token,
 * the next request 401'd, and the account looked like it had vanished. See the
 * comment block in models/Session.js for the full story.
 */
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

/** Tokens are stored hashed, so a stolen database file yields no usable token. */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** Normalise an email the same way everywhere: trimmed and lower-cased.
 *  Register used to store the raw value while login trimmed it, and SQLite
 *  compares TEXT case-sensitively — so registering as "Ali@Example.com" and
 *  logging in as "ali@example.com" silently failed to find the row. */
const normaliseEmail = (value) => String(value || '').trim().toLowerCase();

async function issueToken(email) {
  const token = crypto.randomBytes(32).toString('hex');
  await Session.create({
    token_hash: hashToken(token),
    email,
    expires_at: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' });

    const session = await Session.findOne({ where: { token_hash: hashToken(token) } });
    if (!session) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (Number(session.expires_at) < Date.now()) {
      await session.destroy();
      return res.status(401).json({ error: 'SESSION_EXPIRED' });
    }
    req.userEmail = session.email;
    req.sessionRow = session;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
}

/** Ownership check — the caller may only touch their own record. */
function requireSelf(req, res, next) {
  if (req.params.email && req.params.email !== req.userEmail) {
    return res.status(403).json({ error: 'FORBIDDEN', detail: 'You may only access your own record.' });
  }
  next();
}

/** doc 20 — consent gate on mutating routes. */
async function requireConsent(req, res, next) {
  const user = await User.findOne({ where: { email: req.userEmail } });
  if (!user || !user.consent_mvp_use) {
    return res.status(403).json({ error: 'CONSENT_REQUIRED' });
  }
  next();
}

/**
 * App-usage gate (auth spec §3/§8): activity logging — i.e. actually using
 * the child-facing app — requires a verified email. Reading one's own
 * profile, children and assessment records stays open, because the
 * registration → assessment → verification order deliberately puts the
 * assessment BEFORE verification.
 */
async function requireVerified(req, res, next) {
  try {
    const user = await User.findOne({ where: { email: req.userEmail } });
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED' });
    }
    req.userRow = user;
    next();
  } catch {
    return res.status(500).json({ error: 'VERIFY_CHECK_FAILED' });
  }
}
/**
 * Ownership gate (auth spec §5): a child row — and everything hanging off
 * it (assessments, activity sessions, pathway decisions) — belongs to one
 * parent. Routes take child ids from URLs/bodies, so every one of them must
 * resolve the child and compare parentId with the authenticated user first.
 * A foreign id answers 404, never 403, so ids cannot be probed.
 */
async function childBelongsToUser(childId, userEmail) {
  const child = await Child.findByPk(Number(childId));
  if (!child) return false;
  const user = await User.findOne({ where: { email: userEmail } });
  return !!user && child.parentId === user.id;
}
/** Single serializer — password never leaves the server. */
const parseSafely = (v, fallback) => {
  try { return typeof v === 'string' ? JSON.parse(v) : (v ?? fallback); }
  catch { return fallback; }
};

function serializeUser(user) {
  const u = user.toJSON();
  delete u.password;
  u.moduleProgress = parseSafely(u.moduleProgress, {});
  u.earnedBadges = parseSafely(u.earnedBadges, []);
  u.activities = parseSafely(u.activities, []);
  u.dailyTimeSpent = parseSafely(u.dailyTimeSpent, {});
  // assessmentResult is legacy and may contain a stale iqScore from the old
  // build; it is stripped so no IQ-like value can reach a client.
  const legacy = parseSafely(u.assessmentResult, null);
  if (legacy && typeof legacy === 'object') { delete legacy.iqScore; delete legacy.iq_score; }
  u.assessmentResult = legacy;
  return u;
}

// ── health ────────────────────────────────────────────────────────────────
/**
 * Gemini content generation. Isolated in routes/gemini.js for the same reason
 * as narration: it holds a billable key that must never reach the browser
 * bundle. It is a CONTENT layer only — the adaptive engine owns every
 * decision, and the learning loop works with this route switched off.
 *
 * ── WHY IT IS BEHIND requireAuth ──────────────────────────────────────────
 * Generation costs money per call. An unauthenticated endpoint that spends
 * money is an open invitation, and the rate limit inside the route caps the
 * damage rather than preventing it. `/status` is deliberately left open: it
 * makes no upstream call, returns no content and no credential, and an
 * operator checking whether generation is configured should not need to log
 * in first.
 */
app.use('/api/ai', (req, res, next) => (
  req.path === '/status' ? next() : requireAuth(req, res, next)
), require('./routes/gemini'));

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'ok', blobsync: blobsync.diagnostics(), restored: global.__blobsyncRestore || null });
  } catch (e) {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

// ── auth routes ───────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { password, name, consent_mvp_use } = req.body || {};
    // Same normalisation as /api/login, so an account can always be found again.
    const email = normaliseEmail((req.body || {}).email);
    if (!email || !password) return res.status(400).json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'EMAIL_INVALID', detail: 'Please enter a valid email address.' });
    }
    if (String(password).length < 8) return res.status(400).json({ error: 'PASSWORD_TOO_SHORT', detail: 'Minimum 8 characters.' });
    if (consent_mvp_use !== true) return res.status(403).json({ error: 'CONSENT_REQUIRED' });

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_REGISTERED',
        detail: 'An account already exists for this email. Please log in instead.',
      });
    }

    const hash = await bcrypt.hash(String(password), 12);
    // TEXT columns (moduleProgress/earnedBadges/activities/dailyTimeSpent)
    // are stored as JSON strings — see serializeUser(), which parses them
    // back on the way out. The client sends real objects/arrays; Sequelize
    // rejects those for a STRING/TEXT column, so they are stringified here.
    const body = { ...req.body };
    for (const field of ['moduleProgress', 'earnedBadges', 'activities', 'dailyTimeSpent', 'assessmentResult']) {
      if (body[field] !== undefined && typeof body[field] !== 'string') {
        body[field] = JSON.stringify(body[field]);
      }
    }
    const user = await User.create({
      ...body,
      email, // the normalised form, never the raw client value
      name: name || 'Parent',
      password: hash,
      consent_mvp_use: true,
      consent_at: new Date().toISOString(),
      // Auth spec §3: a brand-new account is NOT verified until a code is
      // confirmed. (The column defaults to true for legacy rows only.)
      emailVerified: false,
    });
    // Auth spec §1/§2: the child profile is saved with the account, not
    // lazily on the next app boot — closing the tab right after registering
    // can no longer orphan the registration data. If the child row fails,
    // the user row is rolled back by hand (destroy), so a partial account
    // never exists. This mirrors exactly what the app boot effect used to
    // create, so hydration finds the same displayName and skips creating a
    // duplicate.
    let child = null;
    try {
      child = await Child.create({
        parentId: user.id,
        displayName: body.name || 'Child',
        ageYears: Number.isFinite(Number(body.age)) ? Number(body.age) : null,
        condition: body.condition ?? null,
        accommodations: JSON.stringify(body.accommodations ?? []),
      });
    } catch (childError) {
      await user.destroy().catch(() => {});
      return res.status(500).json({
        error: 'REGISTRATION_INCOMPLETE',
        detail: 'The account could not be prepared with a child profile. Please try again.',
        cause: String(childError.message).slice(0, 160),
      });
    }
    const token = await issueToken(user.email);
    // Spec: OTP is NOT optional — the very first code is generated and
    // emailed as part of registration itself. Failure to deliver does not
    // undo the account (the code is stored either way and /verify offers
    // resend); the response says honestly whether the email went out.
    const v = await issueVerificationCode(user, req.body && req.body.lang);
    const dev = process.env.VERIFY_DEV_CODES === 'true' ? { devCode: v.code } : {};
    // Serverless cannot trust post-response timers: the account + its first
    // OTP must be durable BEFORE the 201 leaves.
    await blobsync.flushNow();
    res.status(201).json({
      token,
      user: serializeUser(user),
      child,
      verification: { sent: v.sent, via: v.via || null, ...dev },
    });
  } catch (error) {
    // Sequelize's own unique/validation failures are reported in the same
    // shape as the explicit checks above, so the client can show one clear
    // message instead of a raw ORM string.
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_REGISTERED',
        detail: 'An account already exists for this email. Please log in instead.',
      });
    }
    if (error?.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'INVALID_REGISTRATION',
        detail: error.errors?.map((e) => e.message).join(' ') || 'Some details were not valid.',
      });
    }
    res.status(400).json({ error: 'REGISTRATION_FAILED', detail: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const email = normaliseEmail((req.body || {}).email);
    const password = String((req.body || {}).password || '');
    const user = await User.findOne({ where: { email } });

    // Uniform failure response — do not reveal whether the email exists.
    // `detail` is deliberately generic for the same reason, but it is a
    // complete, human sentence so the UI can show something clearer than a
    // bare code when someone mistypes their password.
    const fail = () =>
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        detail: 'That email and password do not match an account.',
      });
    if (!user) { await bcrypt.hash('timing-equaliser', 12); return fail(); }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return fail();

    const token = await issueToken(user.email);
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

app.post('/api/logout', requireAuth, async (req, res) => {
  // requireAuth already resolved and attached the row, so the token is
  // destroyed in the database — it stays invalid across a restart too.
  try {
    if (req.sessionRow) await req.sessionRow.destroy();
  } catch { /* already gone — logout is still a success from the client's view */ }
  res.json({ ok: true });
});

/**
 * ── Email verification (auth spec §3) ──────────────────────────────────────
 * Flow: after the child assessment finishes, the app POSTs /api/verify/send.
 * A 6-digit code is generated (crypto-grade), hashed, stored for 15 minutes,
 * and mailed through Resend or SMTP when configured (see lib/email.js).
 * /api/verify/confirm checks the hash, marks the account verified, and the
 * app then enters IRIS proper. /api/verify/status is the single source of
 * truth on every boot so a refresh can never "forget" verification state.
 * If no email service is configured the send is HONEST: sent:false with a
 * reason — never a fake success. Outside production builds the response also
 * carries devCode so the flow stays testable without an email provider.
 */
const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_CODE_ATTEMPTS = 5;
/**
 * Generate + store + DELIVER one OTP. Shared by /api/register (mandatory
 * first send) and /api/verify/send (resend) so the two paths can never
 * drift. Returns { code, sent, via, error } — `sent` only true when the
 * provider actually accepted the message, or in dev mode where the code
 * is echoed instead (VERIFY_DEV_CODES is a local flag, never set on
 * Vercel, and emailMode()==='none' keeps the echo honest by only ever
 * existing alongside sent:false).
 */
async function issueVerificationCode(user, lang) {
  const code = String(require('crypto').randomInt(100000, 1000000));
  await VerificationCode.destroy({ where: { userId: user.id, used_at: null } });
  await VerificationCode.create({
    userId: user.id,
    code_hash: hashToken(code),
    expires_at: Date.now() + CODE_TTL_MS,
  });
  console.log(`[verify] code issued for ${user.email}`);
  if (emailMode() === 'none') return { code, sent: false, via: null, error: 'EMAIL_NOT_CONFIGURED' };
  if (process.env.VERIFY_DEV_CODES === 'true') return { code, sent: true, via: 'dev' };
  try {
    const via = await sendVerificationEmail(user.email, code, lang, CODE_TTL_MS / 60000);
    return { code, sent: true, via };
  } catch (e) {
    return { code, sent: false, via: null, error: String(e.code || e.message).slice(0, 120) };
  }
}
app.post('/api/verify/send', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.userEmail } });
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true });
    const pending = await VerificationCode.findOne({
      where: { userId: user.id, used_at: null },
      order: [['createdAt', 'DESC']],
    });
    if (pending && Date.now() - new Date(pending.createdAt).getTime() < RESEND_COOLDOWN_MS) {
      const retryAfterMs = RESEND_COOLDOWN_MS - (Date.now() - new Date(pending.createdAt).getTime());
      return res.status(429).json({ error: 'RESEND_COOLDOWN', retryAfterMs });
    }
    const r = await issueVerificationCode(user, req.body && req.body.lang);
    // devCode stays an opt-in LOCAL convenience (VERIFY_DEV_CODES=true is
    // never set on Vercel), so the QA battery keeps working while
    // production codes travel only inside the email.
    const dev = process.env.VERIFY_DEV_CODES === 'true' ? { devCode: r.code } : {};
    if (r.error === 'EMAIL_NOT_CONFIGURED') {
      return res.json({ ok: true, sent: false, reason: 'EMAIL_NOT_CONFIGURED', ...dev });
    }
    if (!r.sent) {
      // The code is stored and valid; the parent can press resend.
      return res.status(502).json({
        error: 'EMAIL_SEND_FAILED',
        detail: 'The verification email could not be delivered. Please try again.',
        cause: r.error,
        ...dev,
      });
    }
    res.json({ ok: true, sent: true, via: r.via, ...dev });
  } catch (error) {
    res.status(500).json({ error: 'VERIFY_SEND_FAILED' });
  }
});
app.post('/api/verify/confirm', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.userEmail } });
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (user.emailVerified) return res.json({ ok: true, emailVerified: true });
    const code = String((req.body || {}).code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'CODE_INVALID', detail: 'Enter the 6 digits from the email.' });
    }
    const row = await VerificationCode.findOne({
      where: { userId: user.id, used_at: null },
      order: [['createdAt', 'DESC']],
    });
    if (!row) return res.status(400).json({ error: 'NO_PENDING_CODE', detail: 'Request a new code.' });
    if (Number(row.expires_at) < Date.now()) {
      await row.destroy();
      return res.status(400).json({ error: 'CODE_EXPIRED', detail: 'That code expired. Request a new one.' });
    }
    if (row.attempts >= MAX_CODE_ATTEMPTS) {
      await row.destroy();
      return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', detail: 'Too many tries. A fresh code was requested for you.' });
    }
    row.attempts = row.attempts + 1;
    await row.save();
    // Constant-time compare of the hashes — never a raw string equality.
    const candidate = hashToken(code);
    const a = Buffer.from(candidate);
    const b = Buffer.from(row.code_hash);
    const ok = a.length === b.length && require('crypto').timingSafeEqual(a, b);
    if (!ok) {
      if (row.attempts >= MAX_CODE_ATTEMPTS) await row.destroy();
      return res.status(400).json({ error: 'CODE_WRONG', detail: 'That code is not correct.' });
    }
    row.used_at = Date.now();
    await row.save();
    user.emailVerified = true;
    // same durability reasoning as /api/register — a verified flag that
    // dies with the instance forces the parent to redo the whole flow.
    await blobsync.flushNow();
    await user.save();
    await VerificationCode.destroy({ where: { userId: user.id, used_at: null } });
    res.json({ ok: true, emailVerified: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'VERIFY_CONFIRM_FAILED' });
  }
});
app.get('/api/verify/status', requireAuth, async (req, res) => {
  const user = await User.findOne({ where: { email: req.userEmail } });
  if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
  res.json({ emailVerified: !!user.emailVerified });
});
// ── user routes (authenticated + ownership-checked) ───────────────────────
app.get('/api/users/:email', requireAuth, requireSelf, async (req, res) => {
  const user = await User.findOne({ where: { email: req.params.email } });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(serializeUser(user));
});

app.put('/api/users/:email', requireAuth, requireSelf, requireConsent, async (req, res) => {
  try {
    const data = { ...req.body };
    // Fields a client may never set directly.
    delete data.password; delete data.email; delete data.id;
    delete data.consent_mvp_use; delete data.consent_at;

    for (const k of ['moduleProgress', 'earnedBadges', 'assessmentResult', 'activities', 'dailyTimeSpent']) {
      if (data[k] !== undefined) data[k] = JSON.stringify(data[k]);
    }
    const [updated] = await User.update(data, { where: { email: req.params.email } });
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
    const user = await User.findOne({ where: { email: req.params.email } });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** REMOVED — this route previously dumped every user, including passwords. */
app.get('/api/users', (req, res) => {
  res.status(410).json({
    error: 'ENDPOINT_REMOVED',
    detail: 'This endpoint returned every user record, including credentials, without authentication. It was removed as a P0 security fix (IRIS_IMPLEMENTATION_AUDIT.md §14.3).',
  });
});

// ── IRIS domain routes ────────────────────────────────────────────────────
app.post('/api/children', requireAuth, requireConsent, async (req, res) => {
  try {
    const parent = await User.findOne({ where: { email: req.userEmail } });
    const child = await Child.create({
      parentId: parent.id,
      displayName: req.body.displayName,
      ageYears: req.body.ageYears ?? null,
      condition: req.body.condition ?? null,
      accommodations: JSON.stringify(req.body.accommodations ?? []),
      is_synthetic: req.body.is_synthetic === true,
    });
    res.status(201).json(child);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/children', requireAuth, async (req, res) => {
  const parent = await User.findOne({ where: { email: req.userEmail } });
  const children = await Child.findAll({ where: { parentId: parent.id } });
  res.json(children);
});

/** Persist a completed assessment. Scoring happens client-side in the engines. */
app.post('/api/assessments', requireAuth, requireConsent, async (req, res) => {
  try {
    // The record must belong to a child of THIS parent — never a raw id
    // from the wire (auth spec §5: no cross-user writes).
    if (!(await childBelongsToUser(req.body?.childId, req.userEmail))) {
      return res.status(404).json({ error: 'CHILD_NOT_FOUND', detail: 'No child with that id belongs to this account.' });
    }
    const rec = await AssessmentRecord.create({
      childId: req.body.childId,
      domain_scores: JSON.stringify(req.body.domain_scores ?? {}),
      data_quality_flags: JSON.stringify(req.body.data_quality_flags ?? []),
      accommodations_used: JSON.stringify(req.body.accommodations_used ?? []),
      item_results: JSON.stringify(req.body.item_results ?? {}),
      interruption_count: req.body.interruption_count ?? 0,
      // Phase 5 — additive. Absent on a sub-measure assessment, which keeps
      // its defaults and behaves exactly as before.
      skill_estimates: JSON.stringify(req.body.skill_estimates ?? {}),
      learning_priorities: JSON.stringify(req.body.learning_priorities ?? []),
      confidence: JSON.stringify(req.body.confidence ?? {}),
      assessment_kind: req.body.assessment_kind === 'LADDER' ? 'LADDER' : 'SUB_MEASURE',
      rule_pack_version: req.body.rule_pack_version ?? 'mvp-1.0.0',
      is_synthetic: req.body.is_synthetic === true,
    });
    res.status(201).json(rec);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/**
 * Read a child's assessments back, newest first.
 *
 * Phase 5 needs this: an assessment that cannot be reloaded is a results page,
 * not a record, and Parent Mode has to be able to show progress over time.
 * JSON columns are parsed here so the client never has to know they are TEXT.
 */
app.get('/api/assessments/:childId', requireAuth, async (req, res) => {
  try {
    if (!(await childBelongsToUser(req.params.childId, req.userEmail))) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    const rows = await AssessmentRecord.findAll({
      where: { childId: req.params.childId },
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(req.query.limit) || 20, 100),
    });
    const parse = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
    res.json(rows.map((r) => ({
      id: r.id,
      childId: r.childId,
      status: r.status,
      assessment_kind: r.assessment_kind,
      domain_scores: parse(r.domain_scores, {}),
      data_quality_flags: parse(r.data_quality_flags, []),
      accommodations_used: parse(r.accommodations_used, []),
      item_results: parse(r.item_results, {}),
      skill_estimates: parse(r.skill_estimates, {}),
      learning_priorities: parse(r.learning_priorities, []),
      confidence: parse(r.confidence, {}),
      interruption_count: r.interruption_count,
      rule_pack_version: r.rule_pack_version,
      createdAt: r.createdAt,
    })));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/** Persist a session AND its pathway decision — no silent adaptation. */
app.post('/api/sessions', requireAuth, requireVerified, requireConsent, async (req, res) => {
  try {
    const d = req.body.decision || {};
    const s = await ActivitySession.create({
      childId: req.body.childId,
      goal_id: req.body.goal_id,
      level: req.body.level,
      template_id: req.body.template_id,
      accuracy: req.body.accuracy,
      independence: req.body.independence,
      band: req.body.band,
      completion_status: req.body.completion_status ?? 'COMPLETE',
      engagement_flag: req.body.engagement_flag === true,
      total_hints: req.body.total_hints ?? 0,
      item_results: JSON.stringify(req.body.item_results ?? []),
      decision_rule_id: d.rule_id ?? null,
      decision_reason_code: d.reason_code ?? null,
      decision_payload: JSON.stringify(d),
      rule_pack_version: d.rule_pack_version ?? 'mvp-1.0.0',
      is_synthetic: req.body.is_synthetic === true,
    });
    res.status(201).json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/sessions/:childId', requireAuth, async (req, res) => {
  if (!(await childBelongsToUser(req.params.childId, req.userEmail))) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const parent = await User.findOne({ where: { email: req.userEmail } });
  const child = await Child.findByPk(req.params.childId);
  if (!child || child.parentId !== parent.id) return res.status(403).json({ error: 'FORBIDDEN' });
  const rows = await ActivitySession.findAll({ where: { childId: child.id }, order: [['createdAt', 'ASC']] });
  res.json(rows);
});

/** Decision audit trail (doc 20 §7). */
app.get('/api/decisions/:childId', requireAuth, async (req, res) => {
  if (!(await childBelongsToUser(req.params.childId, req.userEmail))) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  const parent = await User.findOne({ where: { email: req.userEmail } });
  const child = await Child.findByPk(req.params.childId);
  if (!child || child.parentId !== parent.id) return res.status(403).json({ error: 'FORBIDDEN' });
  const rows = await ActivitySession.findAll({ where: { childId: child.id }, order: [['createdAt', 'ASC']] });
  res.json(rows.map((r) => ({
    at: r.createdAt, goal_id: r.goal_id, level: r.level,
    rule_id: r.decision_rule_id, reason_code: r.decision_reason_code,
    rule_pack_version: r.rule_pack_version, is_synthetic: r.is_synthetic,
    decision: parseSafely(r.decision_payload, {}),
  })));
});

// ── community (out of MVP scope, kept working, now authenticated) ─────────
app.get('/api/posts', requireAuth, async (req, res) => {
  const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
  res.json(posts);
});
app.post('/api/posts', requireAuth, requireConsent, async (req, res) => {
  try { res.status(201).json(await Post.create({ ...req.body, authorEmail: req.userEmail })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/posts/:id/like', requireAuth, requireConsent, async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ error: 'NOT_FOUND' });
  post.likes += 1; await post.save(); res.json(post);
});
app.post('/api/bookings', requireAuth, requireConsent, async (req, res) => {
  try { res.status(201).json(await Booking.create({ ...req.body, parentEmail: req.userEmail })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/api/bookings/:email', requireAuth, requireSelf, async (req, res) => {
  res.json(await Booking.findAll({ where: { parentEmail: req.params.email }, order: [['createdAt', 'DESC']] }));
});

// ── boot ──────────────────────────────────────────────────────────────────
// `alter: true` silently mutates live tables and can drop columns. It is now
// opt-in via env, so it cannot run by accident against real data.
const syncOptions = process.env.DB_ALTER === 'true' ? { alter: true } : {};

/** Drop sessions whose TTL has passed. Runs at boot and hourly after that, so
 *  the table cannot grow without bound on a long-running instance. Expiry is
 *  ALSO enforced per-request in requireAuth — this is housekeeping, not the
 *  security boundary. */
async function purgeExpiredSessions() {
  try {
    const removed = await Session.destroy({ where: { expires_at: { [Op.lt]: Date.now() } } });
    if (removed) console.log(`Purged ${removed} expired session(s)`);
  } catch (e) {
    console.error('SESSION_PURGE_ERROR:', e.message);
  }
}

/**
 * Additive-only migration for the Phase 5 assessment columns.
 *
 * `sequelize.sync()` creates missing TABLES but never adds columns to an
 * existing one, so a database created before Phase 5 would reject every
 * ladder assessment with "no column named skill_estimates".
 *
 * `sync({ alter: true })` would fix it — and is deliberately gated behind
 * DB_ALTER because it can silently DROP columns. That gate is not weakened
 * here. Instead this adds the specific missing columns and nothing else:
 * it only ever runs ADD COLUMN, only for names it does not find, and each
 * carries a default so existing rows stay valid.
 */
async function addPhase5Columns() {
  const wanted = [
    ['skill_estimates', "TEXT DEFAULT '{}'"],
    ['learning_priorities', "TEXT DEFAULT '[]'"],
    ['confidence', "TEXT DEFAULT '{}'"],
    ['assessment_kind', "VARCHAR(255) DEFAULT 'SUB_MEASURE'"],
  ];
  try {
    const [cols] = await sequelize.query('PRAGMA table_info(AssessmentRecords);');
    if (!cols || cols.length === 0) return; // table does not exist yet; sync will create it complete
    const existing = new Set(cols.map((c) => c.name));
    for (const [name, ddl] of wanted) {
      if (existing.has(name)) continue;
      await sequelize.query(`ALTER TABLE AssessmentRecords ADD COLUMN ${name} ${ddl};`);
      console.log(`[migrate] added AssessmentRecords.${name}`);
    }
  } catch (e) {
    // Non-fatal and loud: the ladder assessment will fail to save and say so,
    // which is better than the server refusing to boot for existing users.
    console.error('PHASE5_MIGRATION_WARNING:', e.message);
  }
}


/* ── Static frontend (single-origin deploy) ────────────────────────────────
   `npm run build` drops a hashed SPA bundle in ../dist. Serving it from the
   SAME process as /api means one URL, one systemd unit, no CORS, and deep
   links (/login, /register, /parent) resolve to index.html like any SPA.
   Set SERVE_STATIC=0 to run API-only (e.g. alongside a separate CDN). */
if (process.env.SERVE_STATIC !== '0') {
  const DIST = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(DIST)) {
    app.use(express.static(DIST, { index: 'index.html' }));
    app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')));
    console.log('[static] serving', DIST);
  } else {
    console.log('[static] ../dist missing — run `npm run build` for single-origin serving');
  }
}

async function addAuthSpecColumns() {
  const wanted = [['Users', 'emailVerified', 'BOOLEAN NOT NULL DEFAULT 1']];
  try {
    for (const [table, name, ddl] of wanted) {
      const [cols] = await sequelize.query(`PRAGMA table_info(${table});`);
      if (!cols || cols.length === 0) continue; // sync will create it complete
      if (cols.some((c) => c.name === name)) continue;
      await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${ddl};`);
      console.log(`[migrate] added ${table}.${name}`);
    }
  } catch (e) {
    console.error('AUTHSPEC_MIGRATION_WARNING:', e.message);
  }
}
bootReady = (blobsync.active
  ? blobsync.restore(String(sequelize.__storageResolved || sequelize.config.storage)).then((r) => {
      global.__blobsyncRestore = r;
      console.log(`[blobsync] boot restore: ${r}`);
    })
  : Promise.resolve()
).then(() => sequelize.sync(syncOptions)).then(async () => {
  console.log(`Database synced${process.env.DB_ALTER === 'true' ? ' (ALTER MODE)' : ''}`);
  await addPhase5Columns();
  await addAuthSpecColumns();
  await purgeExpiredSessions();
  setInterval(purgeExpiredSessions, 1000 * 60 * 60).unref();
  if (require.main === module) {
    app.listen(PORT, () => console.log(`IRIS server on port ${PORT}`));
  }
}).catch((err) => {
  console.error('DATABASE_SYNC_ERROR:', err);
  process.exit(1);
});

module.exports = app;

/** Importable by a serverless entry (api/index.js) without binding a port. */
module.exports = app;
