/**
 * IRIS av2 — pure child-observation helpers (client-side only).
 *
 * ── WHAT THIS FILE IS ─────────────────────────────────────────────────────
 * The observation layer of the av2 child assessment, kept as PURE functions:
 * outcome decisions per item, the observation record shape (AV2_IMPLEMENTATION_
 * SPEC §1), the visit-validity classifier (§1.6), the sanitized payload
 * builders (§7), and the DONE-screen domain one-liners (§6). No React, no
 * fetch, no engine imports, no localStorage — so it can be reasoned about,
 * and so the UI lanes and the engine lane can share one definition of what an
 * observation means without either owning the other's file.
 *
 * ── WHAT IT NEVER DOES ────────────────────────────────────────────────────
 * It never scores. `latency_ms` is data quality only; `outcome` describes
 * what the child DID during this task, not what the child IS. `insufficient`
 * is never mapped onto failure, and `no_opportunity` is never counted in any
 * accuracy — the opportunity ≠ inability rule (directive PART 1 §5, spec §0).
 */

/** The six av2 outcomes. Enums frozen — spec §1. */
export const OUTCOME = Object.freeze({
  INDEPENDENT: 'demonstrated_independent',
  SUPPORTED: 'demonstrated_with_support',
  NOT_DEMONSTRATED: 'not_demonstrated',
  INSUFFICIENT: 'insufficient',
  NO_OPPORTUNITY: 'no_opportunity',
  INVALID: 'invalid_administration',
});
export const OUTCOMES = Object.freeze([
  OUTCOME.INDEPENDENT, OUTCOME.SUPPORTED, OUTCOME.NOT_DEMONSTRATED,
  OUTCOME.INSUFFICIENT, OUTCOME.NO_OPPORTUNITY, OUTCOME.INVALID,
]);

/** Visit-validity classes, spec §1.6 / §7. */
export const VISIT_VALIDITY = Object.freeze({
  VALID: 'valid',
  LOW: 'low_performance',
  INVALID: 'invalid_administration',
});

const isInt = (v) => Number.isFinite(v) && Number.isInteger(v);
const clampInt = (v, max = 1_000_000) => (isInt(v) ? Math.max(-1, Math.min(max, v)) : 0);

/** Which of the four av2 response modes this item presents (spec §1 `mode`). */
export function responseModeOf(item) {
  const options = Array.isArray(item?.options) ? item.options : [];
  const isTapEach = item?.expected_taps != null && options.length === 0;
  const isOrdered = Array.isArray(item?.correct_order) && options.length > 0;
  if (isTapEach) return 'tap_each';
  if (isOrdered) return 'ordered';
  const audio = typeof item?.audio_ar === 'string' && item.audio_ar.trim();
  if (audio && options.length > 0) return 'listen_select';
  return 'single';
}

/**
 * Sanitize a response payload: indices, counts, and fixed codes ONLY.
 * Free text can never enter a child observation — the response object is
 * what the child PRODUCED (which tile, which order, how many taps), never
 * anything they might TYPE. Unknown shapes collapse to an empty payload.
 */
export function sanitizeResponse(payload) {
  if (payload == null) return {};
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    // Legacy callers report a bare index; that is a legal `index` payload.
    return isInt(payload) ? { index: clampInt(payload) } : {};
  }
  const out = {};
  if (isInt(payload.index)) out.index = clampInt(payload.index);
  if (isInt(payload.count)) out.count = clampInt(payload.count);
  if (Array.isArray(payload.taps)) {
    out.taps = payload.taps.slice(0, 64).filter(isInt).map((v) => clampInt(v, 4096));
    if (out.count == null) out.count = out.taps.length;
  }
  if (Array.isArray(payload.order)) {
    out.order = payload.order.slice(0, 32).filter(isInt).map((v) => clampInt(v, 4096));
  }
  if (payload.confirmed === true) out.confirmed = true;
  // `reason` is a frozen client code, never child text.
  if (payload.reason === 'helper_confirm' || payload.reason === 'no_response') out.reason = payload.reason;
  return out;
}

/**
 * The per-item outcome decision (spec §1 + §6), made once from what the card
 * observed. The card reports a `decision` kind; this maps it onto the frozen
 * outcome enum, the prompt level, the completed flag, and the correctness
 * bit the pre-av2 `onAnswer(correct)` channel still carries.
 *
 *  decision            outcome                      prompt_level  completed
 *  ------------------- ---------------------------- ------------- ----------
 *  first-correct       demonstrated_independent          0         true
 *  retry-correct       demonstrated_with_support         1         true
 *  helper-confirm      demonstrated_with_support         2         true
 *  second-miss         not_demonstrated                  ≤1→1      true
 *  no-response         insufficient                      0        false
 */
export function decideOutcome(kind, { hintUsed = false } = {}) {
  switch (kind) {
    case 'first-correct':
      return { outcome: OUTCOME.INDEPENDENT, prompt_level: 0, completed: true, correct: true };
    case 'retry-correct':
      return { outcome: OUTCOME.SUPPORTED, prompt_level: 1, completed: true, correct: true };
    case 'helper-confirm':
      return { outcome: OUTCOME.SUPPORTED, prompt_level: 2, completed: true, correct: true };
    case 'second-miss':
      return { outcome: OUTCOME.NOT_DEMONSTRATED, prompt_level: hintUsed ? 1 : 0, completed: true, correct: false };
    case 'no-response':
      return { outcome: OUTCOME.INSUFFICIENT, prompt_level: 0, completed: false, correct: false };
    default:
      return null;
  }
}

/** Legacy fallback decision when a caller only reports boolean correctness. */
export function decideOutcomeFromCorrect(isCorrect) {
  return decideOutcome(isCorrect ? 'first-correct' : 'second-miss');
}

/**
 * Build the §1 observation record. Every field comes from what the UI
 * actually saw; nothing is guessed. Unknown metadata (e.g. `target_skill`,
 * which the av2 bank lane stamps onto templates) degrades to null rather
 * than inventing an id.
 */
export function buildObservation({
  item, decision, mode = null, response = null, accommodation = null,
  latencyMs = null, at = null, strand = null, rung = null, templateId = null,
}) {
  const d = decision ?? decideOutcomeFromCorrect(response?.correct === true);
  return {
    item_id: item?.item_id ?? null,
    strand: strand ?? item?.strand ?? null,
    rung: rung ?? item?.rung ?? null,
    template_id: templateId ?? item?.template_id ?? null,
    // Engine bank lane adds `target_skill`; until it lands this is null, and
    // the DONE summary degrades to strand-based grouping (never guessed).
    target_skill: item?.target_skill ?? null,
    mode: mode ?? responseModeOf(item),
    response: sanitizeResponse(response),
    outcome: d.outcome,
    prompt_level: d.prompt_level,
    accommodation: {
      audio_auto: accommodation?.audio_auto === true,
      target_size: accommodation?.target_size ?? 'standard',
      wait_ms: Number.isFinite(accommodation?.wait_ms) ? Math.max(0, Math.round(accommodation.wait_ms)) : null,
      helper_present: accommodation?.helper_present === true,
      response_mode: accommodation?.response_mode ?? (mode ?? responseModeOf(item)),
    },
    completed: d.completed,
    // DATA QUALITY ONLY — spec §1; the engine never reads it for scoring.
    latency_ms: Number.isFinite(latencyMs) ? Math.max(0, Math.round(latencyMs)) : null,
    at: at ?? new Date().toISOString(),
  };
}

/**
 * Classify one visit (spec §1.6). Rules, in order:
 *  - fewer than 50% of the visit's items have completed:true  → invalid_administration
 *    (never scores; the child sees the retry-with-supports message)
 *  - completed but NOTHING demonstrated (independent or with support) → low_performance
 *    (thin signal, honestly flagged; it still scores, because 0-of-3 IS evidence)
 *  - otherwise → valid
 * `no_opportunity` rows are never part of a visit and are excluded here.
 */
export function classifyVisitValidity(visitObservations) {
  const obs = (Array.isArray(visitObservations) ? visitObservations : [])
    .filter((o) => o && o.outcome !== OUTCOME.NO_OPPORTUNITY);
  if (obs.length === 0) return VISIT_VALIDITY.INVALID;
  const done = obs.filter((o) => o.completed === true).length;
  if (done / obs.length < 0.5) return VISIT_VALIDITY.INVALID;
  const demonstrated = obs.filter(
    (o) => o.outcome === OUTCOME.INDEPENDENT || o.outcome === OUTCOME.SUPPORTED,
  ).length;
  if (demonstrated === 0) return VISIT_VALIDITY.LOW;
  return VISIT_VALIDITY.VALID;
}

/**
 * Turn a visit's observation rows into the engine's per-visit result counts.
 *  - correct   = independent + with-support (both DID demonstrate the skill)
 *  - supported = with-support ONLY (the real count av2 finally supplies, §1)
 *  - total     = items that produced information: `insufficient` is EXCLUDED —
 *    it must count toward "needs more information", never dilute accuracy.
 */
export function visitCounts(visitObservations) {
  const obs = (Array.isArray(visitObservations) ? visitObservations : [])
    .filter((o) => o && o.outcome !== OUTCOME.NO_OPPORTUNITY);
  let independent = 0; let supported = 0; let missed = 0; let insufficient = 0;
  for (const o of obs) {
    if (o.outcome === OUTCOME.INDEPENDENT) independent += 1;
    else if (o.outcome === OUTCOME.SUPPORTED) supported += 1;
    else if (o.outcome === OUTCOME.NOT_DEMONSTRATED) missed += 1;
    else if (o.outcome === OUTCOME.INSUFFICIENT) insufficient += 1;
  }
  const total = independent + supported + missed;
  return {
    correct: independent + supported, supported, missed, insufficient,
    total, presented: obs.length,
  };
}

/**
 * Domain-level `no_opportunity` rows for pre-closed tracks (spec §3). These
 * are logged so the transparency record can SAY why a domain is silent, and
 * they are excluded from every accuracy/difficulty count by construction
 * (classifyVisitValidity and visitCounts filter them; the engine never
 * receives them as evidence rows).
 */
export function gatingObservations(gates, { at = null } = {}) {
  const rows = [];
  const stamp = at ?? new Date().toISOString();
  const closed = (k) => gates?.[k] === 'not_yet' && gates?.[`optIn${k}`] !== true;
  if (closed('LITERACY')) {
    rows.push({
      item_id: null, strand: 'LITERACY:MAIN', rung: null, template_id: null,
      target_skill: null, mode: null, response: { reason: 'opportunity_gate' },
      outcome: OUTCOME.NO_OPPORTUNITY, prompt_level: 0,
      accommodation: { audio_auto: false, target_size: 'standard', wait_ms: null, helper_present: false, response_mode: null },
      completed: false, latency_ms: null, at: stamp,
    });
  }
  if (closed('NUMERACY')) {
    rows.push({
      item_id: null, strand: 'NUMERACY:MAIN', rung: null, template_id: null,
      target_skill: null, mode: null, response: { reason: 'opportunity_gate' },
      outcome: OUTCOME.NO_OPPORTUNITY, prompt_level: 0,
      accommodation: { audio_auto: false, target_size: 'standard', wait_ms: null, helper_present: false, response_mode: null },
      completed: false, latency_ms: null, at: stamp,
    });
  }
  return rows;
}

/* ══ DONE screen — per-domain one-liners (spec §6, directive PART 1 §2) ════ */

/**
 * av2 domain home for a strand. Written to the spec §2 table:
 *  A COMMUNICATION — COMM ladder + LISTENING track (receptive)
 *  B EARLY_LIT    — LIT readiness/letters/sounds rungs
 *  C READING      — LIT decoding/word/comp/functional rungs
 *  D NUMERACY     — NUM ladder
 *  E VSP          — VSP ladder
 *  F MEM          — MEM ladder
 * Unknown strands (the new ladders land in parallel) fall back to the
 * strand prefix, so a COMM.* item is COMMUNICATION even before the ladder
 * index knows COMM exists.
 */
const EARLY_LIT_STRANDS = ['LIT.READINESS', 'LIT.LETTER_AWARE', 'LIT.LETTER_NAME', 'LIT.LETTER_FORMS', 'LIT.SOUND_TO_LETTER', 'LIT.PHON_SYLLABLE', 'LIT.LETTER_WRITE'];
export function domainForObservation(o) {
  const strand = String(o?.strand ?? '');
  if (strand.startsWith('COMM.') || strand === 'LITERACY:LISTENING') return 'COMMUNICATION';
  if (strand.startsWith('VSP.')) return 'VSP';
  if (strand.startsWith('MEM.') || strand.startsWith('ATT.')) return 'MEMORY';
  if (strand.startsWith('NUM.')) return 'NUMERACY';
  if (strand.startsWith('LIT.')) return EARLY_LIT_STRANDS.includes(strand) ? 'EARLY_LIT' : 'READING';
  if (strand === 'LITERACY:MAIN') return 'EARLY_LIT';
  if (strand === 'NUMERACY:MAIN') return 'NUMERACY';
  return null;
}

/** The six domains in display order, with the child-friendly Arabic name. */
export const DOMAIN_ORDER = [
  { key: 'COMMUNICATION', ar: 'التواصل', en: 'Communication' },
  { key: 'EARLY_LIT', ar: 'الحروف', en: 'Letters' },
  { key: 'READING', ar: 'القراية', en: 'Reading' },
  { key: 'NUMERACY', ar: 'الحساب', en: 'Numbers' },
  { key: 'VSP', ar: 'الأشكال', en: 'Shapes' },
  { key: 'MEMORY', ar: 'التذكر', en: 'Remembering' },
];

/* Tone copy. One line per domain, NO numbers anywhere (spec §6): the word
 * carries the confidence, the phrase carries the observation. Egyptian-
 * friendly Arabic primary, English mirror. Not_demonstrated and
 * insufficient lines never blame the child; the no-opportunity line never
 * reads as failure (directive: opportunity ≠ inability). */
const DOMAIN_TONES = {
  COMMUNICATION: {
    independent: ['بيوصّل اللي عايزه لوحده — واضح', 'He gets his message across on his own — clear'],
    supported: ['بيوصّل أحسن لما حد يسهّلله الطريق', 'He communicates best when someone opens the way for him'],
    lookagain: ['لسه بنتعرّف على طريقته — مفيش مشكلة', 'We are still learning his way of it — no problem at all'],
    anotherlook: ['مش قادرين نقول حاجة النهارده — هنرجعلها', 'Nothing to say today — we will come back to it'],
    noopp: ['دايماً مفتوح — مفيش حاجة مقفولة هنا', 'Always open — nothing is closed off here'],
  },
  EARLY_LIT: {
    independent: ['عارف الحروف من غير مساعدة', 'He knows the letters with no help at all'],
    supported: ['بيعرفها معانا شوية شوية — كده تمام', 'He knows them with us, step by step — that is good'],
    lookagain: ['لسه محتاجة نظرة تانية — مفيش مشكلة', 'It still needs another look — no problem'],
    anotherlook: ['لحد دلوقتي معندناش معلومة كفاية — هنرجعلها', 'We do not have enough yet — we will come back to it'],
    noopp: ['لسه ماخدش فرصة يتمرّن عليها — ده مش نقص فيه', 'He has not had the chance to practise this — that is not a shortcoming'],
  },
  READING: {
    independent: ['قرأ وفهم لوحده — واضح', 'He read and understood on his own — clear'],
    supported: ['قرأ وفهم بمساعدة بسيطة', 'He read and understood with a little help'],
    lookagain: ['لسه محتاجة نظرة تانية — مفيش مشكلة', 'It still needs another look — no problem'],
    anotherlook: ['مش قادرين نقول حاجة النهارده — هنرجعلها', 'Nothing to say today — we will come back to it'],
    noopp: ['لسه ماخدش فرصة يقرأ — هنرجعلها لما يحبو', 'He has not had the chance to read yet — we will return whenever you like'],
  },
  NUMERACY: {
    independent: ['فاهم الأرقام والكميات لوحده', 'He understands numbers and amounts on his own'],
    supported: ['بيفهمها أحسن مع مساعدة بسيطة', 'He understands them best with a little help'],
    lookagain: ['لسه بنتطمن عليها — مفيش مشكلة', 'We are still checking in on this — no problem'],
    anotherlook: ['معندناش معلومة كفاية لسه — هنرجعلها', 'Not enough information yet — we will come back to it'],
    noopp: ['لسه ماخدش فرصة يتمرّن على الأرقام — ده مش نقص فيه', 'He has not had the chance to practise numbers — that is not a shortcoming'],
  },
  VSP: {
    independent: ['عرّف المتشابه من غير مساعدة', 'He matched the like ones with no help'],
    supported: ['طابق وفرّق معانا — كده تمام', 'He matched and told apart with us — that is good'],
    lookagain: ['لسه محتاجة لعبة تانية — مفيش مشكلة', 'It still wants one more game — no problem'],
    anotherlook: ['مش قادرين نقول حاجة النهارده — هنرجعلها', 'Nothing to say today — we will come back to it'],
    noopp: ['دايماً مفتوح — مفيش حاجة مقفولة هنا', 'Always open — nothing is closed off here'],
  },
  MEMORY: {
    independent: ['فاكر اللي شافه لوحده — حلو قوي', 'He remembered what he saw all by himself — lovely'],
    supported: ['فاكر مع تذكيرة بسيطة', 'He remembered with a small reminder'],
    lookagain: ['لسه بنجرب ألعاب تنويع — مفيش مشكلة', 'We are still trying different games — no problem'],
    anotherlook: ['محتاج معلومات أكتر — هنرجعلها', 'It needs more information — we will come back to it'],
    noopp: ['دايماً مفتوح — مفيش حاجة مقفولة هنا', 'Always open — nothing is closed off here'],
  },
};

/**
 * Pick a tone per domain from the observation mix. Deliberately ORDINAL,
 * never arithmetic — no percentage is computed or shown; the words below
 * are what the counts add up to. The optional `indicators` map (engine
 * output, keyed by strand) can only soften toward honesty: LOW confidence
 * on an otherwise independent domain still says "واضح" about what was
 * seen, because what was seen IS what was seen.
 */
export function domainToneOf(counts) {
  const { independent = 0, supported = 0, missed = 0, anotherlook = 0 } = counts;
  const demonstrated = independent + supported;
  if (demonstrated === 0 && missed === 0 && anotherlook > 0) return 'anotherlook';
  if (anotherlook > demonstrated + missed) return 'anotherlook';
  if (demonstrated === 0 && missed > 0) return 'lookagain';
  if (independent > 0 && independent >= supported && independent >= missed) return 'independent';
  if (supported > 0 && supported >= missed) return 'supported';
  return 'lookagain';
}

/**
 * Build the DONE-screen lines. Only domains that were actually seen (or
 * explicitly pre-closed) get a line — silence is not summarized, and an
 * unvisited track produces no claim at all. Returns [{key, nameAr, nameEn,
 * ar, en, tone}] in DOMAIN_ORDER.
 */
export function buildDomainLines(observations, { gates = null } = {}) {
  const byDomain = {};
  for (const o of (Array.isArray(observations) ? observations : [])) {
    const d = domainForObservation(o);
    if (!d) continue;
    const row = (byDomain[d] ??= { independent: 0, supported: 0, missed: 0, anotherlook: 0, noopp: 0 });
    if (o.outcome === OUTCOME.INDEPENDENT) row.independent += 1;
    else if (o.outcome === OUTCOME.SUPPORTED) row.supported += 1;
    else if (o.outcome === OUTCOME.NOT_DEMONSTRATED) row.missed += 1;
    else if (o.outcome === OUTCOME.INSUFFICIENT) row.anotherlook += 1;
    else if (o.outcome === OUTCOME.NO_OPPORTUNITY) row.noopp += 1;
  }
  // A pre-closed academic track earns its honest no-opportunity line even
  // when it produced zero observations (it was never presented).
  if (gates?.LITERACY === 'not_yet' && gates?.optInLITERACY !== true) {
    byDomain.EARLY_LIT ??= { independent: 0, supported: 0, missed: 0, anotherlook: 0, noopp: 1 };
    byDomain.READING ??= { independent: 0, supported: 0, missed: 0, anotherlook: 0, noopp: 1 };
  }
  if (gates?.NUMERACY === 'not_yet' && gates?.optInNUMERACY !== true) {
    byDomain.NUMERACY ??= { independent: 0, supported: 0, missed: 0, anotherlook: 0, noopp: 1 };
  }

  const lines = [];
  for (const { key, ar, en } of DOMAIN_ORDER) {
    const row = byDomain[key];
    if (!row) continue;
    const gatedOnly = row.noopp > 0 && (row.independent + row.supported + row.missed + row.anotherlook) === 0;
    const tone = gatedOnly ? 'noopp' : domainToneOf(row);
    const copy = DOMAIN_TONES[key]?.[tone];
    if (!copy) continue;
    lines.push({ key, nameAr: ar, nameEn: en, ar: copy[0], en: copy[1], tone });
  }
  return lines;
}
