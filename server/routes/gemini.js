/**
 * Gemini content route — a constrained generation layer, and nothing more.
 *
 * ── WHERE THE LINE IS ─────────────────────────────────────────────────────
 * The IRIS adaptive engine owns: the learner state, the goal, the skill, the
 * difficulty, every adaptation decision, and the progression. None of that is
 * in this file and none of it is ever asked of the model.
 *
 * What the model does: writes one more practice question, at a skill and a
 * difficulty the engine has ALREADY chosen, in a format the engine has ALREADY
 * chosen. It is a content author with a very specific brief.
 *
 * ── WHY THIS IS WORTH HAVING AT ALL ───────────────────────────────────────
 * Not because a model is impressive. Because of a measured gap: 45 of the 70
 * (strand × rung × tier × format) slots in the reviewed bank hold fewer than
 * four items. A child who practises the same rung three times sees the same
 * three questions, and "the pathway adapted" stops meaning much when the
 * content behind it cannot follow. This route fills exactly that shortfall,
 * under the engine's constraints, and the reviewed bank always wins when it
 * has an item to give.
 *
 * ── WHY THE KEY IS HERE AND NOT IN THE BROWSER ────────────────────────────
 * Anything Vite inlines is in the shipped bundle. A GEMINI_API_KEY in a VITE_
 * variable is a published, billable credential. The key is read here, from the
 * server environment, and never appears in a response, a log line, or an error
 * message — see `sanitise()`.
 *
 * ── WHAT HAPPENS WHEN IT IS NOT CONFIGURED ────────────────────────────────
 * Nothing breaks. Every response carries `fallback: true` and an empty item
 * list, and the caller uses the reviewed bank — which is what it would have
 * used anyway. The learning loop has no dependency on this route: no key, no
 * network, no quota, and IRIS still assesses, adapts, records and explains.
 */
const express = require('express');
const {
  buildRequest, validateItem, RESPONSE_SCHEMA, LIMITS,
} = require('./geminiGuard');

const router = express.Router();

/** Overridable so the route can be pointed at a mock in tests. */
const API_ROOT = process.env.GEMINI_API_ROOT || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const apiKey = () => process.env.GEMINI_API_KEY || '';

/** Upstream call budget. A generated item is a nicety; a hung request is not. */
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 8000;

/**
 * A cheap per-process rate limit.
 *
 * Content generation is billable and is triggered by ordinary child
 * interaction, so a loop in the client — or an impatient tester — must not be
 * able to run up a bill. This is a ceiling, not a scheduler: it is
 * deliberately simple, and the failure mode is "use the bank", which is the
 * good failure mode.
 */
const RATE = { windowMs: 60_000, max: Number(process.env.GEMINI_MAX_PER_MIN) || 20 };
let windowStart = Date.now();
let windowCount = 0;
function overRateLimit() {
  const now = Date.now();
  if (now - windowStart > RATE.windowMs) { windowStart = now; windowCount = 0; }
  windowCount += 1;
  return windowCount > RATE.max;
}

/**
 * Strip anything credential-shaped out of text before it is logged or
 * returned. Upstream errors sometimes echo the request, including the key.
 */
function sanitise(text) {
  return String(text ?? '')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[REDACTED_KEY]')
    .replace(/key=[^&\s"']+/gi, 'key=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .slice(0, 300);
}

/**
 * Why the last request did not produce content. Surfaced by /api/ai/status so
 * an operator can tell "no key" from "quota exhausted" from "the model kept
 * failing validation" — three very different problems that all look like
 * "generation is off" from the outside.
 */
let lastError = null;
const noteError = (reason, detail = '') => {
  lastError = { reason, detail: sanitise(detail), at: new Date().toISOString() };
};

/** Counters, for the observability endpoint. No content, no identifiers. */
const stats = { requests: 0, generated: 0, rejected: 0, fallback: 0, byReason: {} };
const countReason = (r) => { stats.byReason[r] = (stats.byReason[r] || 0) + 1; };

/* ── the ladder manifest, loaded once ───────────────────────────────────── */

/**
 * The server validates every request against the REAL ladders and templates.
 *
 * Without this the route would generate a question for any strand and rung a
 * caller cared to name, which would mean the difficulty came from the client
 * rather than from the engine — precisely the property this whole design
 * exists to prevent. The ladders are ESM and this file is CommonJS, so they
 * are pulled in with a dynamic import once at startup.
 */
let manifest = null;
let manifestError = null;
const manifestReady = (async () => {
  try {
    const ladders = await import('../../src/iris/ladders/index.js');
    const bank = await import('../../src/iris/content/phase5Bank.js');
    manifest = {
      strands: ladders.STRAND_BY_ID,
      tiers: new Set(bank.TIERS),
      optionsPerTier: bank.OPTIONS_PER_TIER,
      templates: new Set(bank.PHASE5_BANK.map((i) => i.template_id)),
      rungsOf: ladders.rungsOf,
    };
  } catch (err) {
    manifestError = sanitise(err.message || err);
    console.warn(`[ai] could not load the ladder manifest — generation disabled: ${manifestError}`);
  }
})();

/**
 * Check a request against the ladders. Returns null when it is legitimate, or
 * a reason string when it is not.
 */
function rejectRequest({ strand, rung, tier, template_id: templateId, count }) {
  if (!manifest) return 'MANIFEST_UNAVAILABLE';
  const s = manifest.strands[strand];
  if (!s) return 'UNKNOWN_STRAND';
  if (!Number.isInteger(rung)) return 'RUNG_NOT_AN_INTEGER';
  if (!manifest.rungsOf(s.ladder, s.track).includes(rung)) return 'RUNG_NOT_ON_LADDER';
  if (!manifest.tiers.has(tier)) return 'UNKNOWN_TIER';
  if (templateId && !manifest.templates.has(templateId)) return 'UNKNOWN_TEMPLATE';
  if (!Number.isInteger(count) || count < 1 || count > LIMITS.MAX_ITEMS_PER_REQUEST) return 'BAD_COUNT';
  return null;
}

/* ── the upstream call ──────────────────────────────────────────────────── */

async function callGemini({ system, user }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${API_ROOT}/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          // Header, never a query parameter: a key in the URL ends up in
          // access logs, proxy logs and error strings.
          'x-goog-api-key': apiKey(),
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            // Low but not zero: identical output every call would defeat the
            // point of asking for a variant.
            temperature: 0.7,
            maxOutputTokens: 400,
            candidateCount: 1,
          },
          /**
           * Google's own safety filters, at their strictest setting, on top of
           * this app's guard. Two independent layers: theirs catches general
           * harm, ours catches the things that are specifically wrong in a
           * product for children with intellectual disabilities.
           */
          safetySettings: [
            'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT',
          ].map((category) => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' })),
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, reason: `UPSTREAM_${res.status}`, detail };
    }

    const body = await res.json();
    const blocked = body?.promptFeedback?.blockReason;
    if (blocked) return { ok: false, reason: 'BLOCKED_UPSTREAM', detail: blocked };

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { ok: false, reason: 'EMPTY_RESPONSE', detail: '' };

    try {
      return { ok: true, parsed: JSON.parse(text) };
    } catch {
      return { ok: false, reason: 'NOT_JSON', detail: '' };
    }
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    return { ok: false, reason: aborted ? 'TIMEOUT' : 'UNREACHABLE', detail: err?.message || '' };
  } finally {
    clearTimeout(timer);
  }
}

/* ── routes ─────────────────────────────────────────────────────────────── */

/**
 * Generate practice item VARIANTS for a slot the engine has already chosen.
 *
 * The request names a strand, a rung, a tier and a format. It does not — and
 * cannot — name a child: there is no child field in the body, nothing here
 * reads the session, and `buildRequest()` only assembles whitelisted fields.
 * So a generated item is decoupled from any individual by construction, not
 * by policy.
 *
 * The response ALWAYS has the same shape, whether generation worked, was
 * refused, or is switched off entirely. A caller therefore has one code path.
 */
router.post('/items', async (req, res) => {
  await manifestReady;
  stats.requests += 1;

  const {
    strand, rung, tier, template_id: templateId,
    language = 'ar', count = 1, avoid = [],
  } = req.body || {};

  const bad = rejectRequest({ strand, rung, tier, template_id: templateId, count });
  if (bad) {
    countReason(bad);
    stats.fallback += 1;
    return res.status(bad === 'MANIFEST_UNAVAILABLE' ? 503 : 400)
      .json({ items: [], fallback: true, reason: bad });
  }

  if (!apiKey()) {
    countReason('NOT_CONFIGURED');
    stats.fallback += 1;
    return res.json({ items: [], fallback: true, reason: 'NOT_CONFIGURED' });
  }

  if (overRateLimit()) {
    countReason('RATE_LIMITED');
    stats.fallback += 1;
    noteError('RATE_LIMITED', `more than ${RATE.max} requests in a minute`);
    return res.json({ items: [], fallback: true, reason: 'RATE_LIMITED' });
  }

  const s = manifest.strands[strand];
  const optionCount = manifest.optionsPerTier?.[tier] ?? 2;

  const spec = {
    skill: language === 'ar' ? s.nameAr : s.nameEn,
    skillDetail: language === 'ar' ? s.descAr : s.descEn,
    difficulty: tier,
    format: templateId ?? null,
    language,
    optionCount,
    avoid: Array.isArray(avoid) ? avoid.slice(0, 8).map((a) => String(a).slice(0, 160)) : [],
  };

  const items = [];
  const rejections = [];

  for (let i = 0; i < count; i++) {
    const { system, user } = buildRequest({
      ...spec,
      // Each round also avoids what this same request has already produced,
      // so asking for three variants cannot return the same one three times.
      avoid: [...spec.avoid, ...items.map((x) => x.prompt)],
    });

    const call = await callGemini({ system, user });
    if (!call.ok) {
      noteError(call.reason, call.detail);
      countReason(call.reason);
      rejections.push(call.reason);
      break; // a failing upstream will keep failing; do not burn the quota
    }

    const verdict = validateItem(call.parsed, { ...spec, avoid: [...spec.avoid, ...items.map((x) => x.prompt)] });
    if (!verdict.ok) {
      stats.rejected += 1;
      countReason(verdict.reason);
      rejections.push(verdict.reason);
      // A rejected item is not retried. One more roll of the dice on a model
      // that just produced unsafe or malformed output is not a safety strategy.
      continue;
    }

    items.push({
      ...verdict.item,
      // The engine's own placement, echoed back so a generated item is filed
      // exactly where the engine put it and can never claim a different rung.
      item_id: `GEN-${strand}-R${rung}-${tier}-${Date.now()}-${i}`,
      strand, rung, tier, template_id: templateId ?? null,
    });
  }

  stats.generated += items.length;
  if (items.length === 0) stats.fallback += 1;
  if (items.length > 0) lastError = null;

  res.json({
    items,
    fallback: items.length === 0,
    reason: items.length === 0 ? (rejections[0] ?? 'NO_VALID_ITEM') : null,
    rejected: rejections,
  });
});

/**
 * Is generation available, and if not, why not?
 *
 * Deliberately answers without making an upstream call: a status endpoint that
 * costs money every time it is polled will be polled until it does.
 */
router.get('/status', async (req, res) => {
  await manifestReady;
  res.json({
    configured: !!apiKey(),
    model: MODEL,
    manifest_loaded: !!manifest,
    manifest_error: manifestError,
    /** The learning loop does not depend on this route. Stated, not implied. */
    core_learning_requires_ai: false,
    fallback: 'reviewed content bank',
    limits: LIMITS,
    rate_limit_per_minute: RATE.max,
    stats,
    last_error: lastError,
  });
});

module.exports = router;
