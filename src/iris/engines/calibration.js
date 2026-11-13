/**
 * IRIS — Stage 1: foundational calibration (Phase 5).
 *
 * ── PURPOSE ───────────────────────────────────────────────────────────────
 * Find out where to start. Not to score the child.
 *
 * Calibration results are marked `calibration: true` and are EXCLUDED from
 * attainment scoring, so a child is never penalised for the probe that found
 * their level.
 *
 * ── WHY THIS EXISTS AT ALL ────────────────────────────────────────────────
 * It is the mechanism that makes BLIND PLACEMENT work. The alternative to a
 * syndrome-derived prior is not "no information" — it is two minutes of
 * watching the child, which is a better estimator than any prior the
 * literature supports. Matrix E1, D10, D6 and E2 all point the same way: the
 * group-level priors are too noisy and too contested to beat direct
 * observation. Two minutes is also a normal probe length (F5).
 *
 * ── PROBE ORDER ───────────────────────────────────────────────────────────
 * Ordered by predictive yield per minute of a child's attention. NELP (A1)
 * found alphabet knowledge and phonological awareness among the strongest
 * predictors of later literacy, ahead of vocabulary — so letters come before
 * words, which is the reverse of the intuitive order.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No function here takes `condition`. Note also what `entryRungsFrom()` does
 * NOT take: age. Age can only filter which probes are OFFERED; it can never
 * touch the rung computed from the answers. That is what makes the
 * downward-safety guarantee structural rather than a promise in a comment.
 */
import { VALIDATION } from '../spec.js';
import { baseRungOf, rungsOf, STRAND_BY_ID } from '../ladders/index.js';

/**
 * The calibration probe set — 10 items, ~2–4 minutes.
 *
 * `rung` is the rung this probe demonstrates if answered correctly.
 * `strand` is what it demonstrates it about.
 */
export const CALIBRATION_PROBES = [
  { id: 'CAL-01', strand: 'LIT.READINESS', ladder: 'LITERACY', track: 'MAIN', rung: 0, template: 'TPL-AR_MATCH_IDENTICAL', labelAr: 'مطابقة صورتين متطابقتين', labelEn: 'Match two identical pictures' },
  { id: 'CAL-02', strand: 'LIT.LETTER_AWARE', ladder: 'LITERACY', track: 'MAIN', rung: 1, template: 'TPL-AR_LETTER_MATCH', labelAr: 'حرف ولا مش حرف؟', labelEn: 'Letter or not a letter?' },
  { id: 'CAL-03', strand: 'LIT.LETTER_AWARE', ladder: 'LITERACY', track: 'MAIN', rung: 1, template: 'TPL-AR_LETTER_MATCH', labelAr: 'مطابقة حرفين متطابقين', labelEn: 'Match two identical letters' },
  // A4: names and sounds are parallel. Both are probed; neither gates the other.
  { id: 'CAL-04', strand: 'LIT.LETTER_NAME', ladder: 'LITERACY', track: 'MAIN', rung: 2, template: 'TPL-AR_LETTER_NAME', labelAr: 'فين حرف الباء؟', labelEn: 'Which one is baa?' },
  { id: 'CAL-05', strand: 'LIT.SOUND_TO_LETTER', ladder: 'LITERACY', track: 'MAIN', rung: 2, template: 'TPL-AR_SOUND_TO_LETTER', labelAr: 'الصوت /ب/ — فين حرفه؟', labelEn: 'The sound /b/ — which letter?' },
  { id: 'CAL-06', strand: 'LIT.PHON_SYLLABLE', ladder: 'LITERACY', track: 'MAIN', rung: 3, template: 'TPL-AR_SYLLABLE', labelAr: 'كام مقطع في «كِتَاب»؟', labelEn: 'How many syllables in kitaab?' },
  { id: 'CAL-07', strand: 'NUM.QUANTITY', ladder: 'NUMERACY', track: 'MAIN', rung: 0, template: 'TPL-AR_SUBITIZE', labelAr: 'كام واحدة من غير عدّ؟', labelEn: 'How many, without counting?' },
  // C1/D10: cardinality is probed even when counting is weak. This is the
  // probe a counting-gated design would never have reached.
  { id: 'CAL-08', strand: 'NUM.CARDINALITY', ladder: 'NUMERACY', track: 'MAIN', rung: 1, template: 'TPL-AR_GIVE_N', labelAr: 'هاتلي تلاتة', labelEn: 'Give me three' },
  { id: 'CAL-09', strand: 'NUM.NUMERAL', ladder: 'NUMERACY', track: 'MAIN', rung: 2, template: 'TPL-AR_NUMERAL', labelAr: 'فين رقم ٤؟', labelEn: 'Which one is 4?' },
  // A7: listening comprehension is probed at calibration, not left to the top
  // of the ladder, because for many children in this population it is where
  // the signal is.
  { id: 'CAL-10', strand: 'LIT.LISTEN_SENTENCE', ladder: 'LITERACY', track: 'LISTENING', rung: 1, template: 'TPL-AR_LISTEN_SENTENCE', labelAr: 'الولد بيشرب لبن — فين الصورة؟', labelEn: 'The boy is drinking milk — which picture?' },
];

/**
 * Age bands used to cap which calibration probes are offered.
 *
 * ENGINEERING_ASSUMPTION. No retrieved source supplies age-appropriate probe
 * ceilings for this population. These exist only to spare a very young child
 * items they have no realistic chance at — never to assert what an older child
 * should know.
 */
export const AGE_HINT_BANDS = [
  { max_age: 3, caps: { LITERACY: 1, NUMERACY: 1 } },
  { max_age: 4, caps: { LITERACY: 2, NUMERACY: 2 } },
  // 5 and over: no band matches, so no cap. Age stops having any effect.
];

export const AGE_HINT_CONFIG = {
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'no source in ASSESSMENT_RESEARCH_MATRIX.md supplies age-appropriate probe ceilings',
  NO_CAP_FROM_AGE: 5,
};

/**
 * The age hint. DOWNWARD-SAFE BY CONSTRUCTION.
 *
 * Returns caps on which calibration probes are worth OFFERING. It returns no
 * rung, no level and no expectation. There is deliberately no code path by
 * which this function can raise anything:
 *
 *   - Its only output is a per-ladder maximum probe rung.
 *   - `capProbes()` uses it to FILTER a list; a filter cannot add.
 *   - `entryRungsFrom()` never receives it.
 *
 * So "age 7 must not route to advanced content" is not enforced by a check
 * somewhere; it is enforced by age having no channel through which to do it.
 */
export function entryHint(ageYears) {
  const age = Number.isFinite(ageYears) ? ageYears : null;

  if (age == null || age >= AGE_HINT_CONFIG.NO_CAP_FROM_AGE) {
    return {
      caps: {},
      applied: false,
      can_raise: false,
      rationale_en: age == null
        ? 'No age on file — no probes skipped.'
        : 'Age 5 or over — no probes skipped. Age has no further effect.',
      rationale_ar: age == null
        ? 'السن مش مسجّل — مفيش أي أسئلة اتشالت.'
        : 'السن ٥ سنين أو أكتر — مفيش أي أسئلة اتشالت.',
    };
  }

  const band = AGE_HINT_BANDS.find((b) => age <= b.max_age) ?? AGE_HINT_BANDS[AGE_HINT_BANDS.length - 1];
  return {
    caps: { ...band.caps },
    applied: true,
    can_raise: false,
    rationale_en: `Age ${age} — the hardest calibration probes are skipped. This can only shorten the probe set; it cannot place the child higher.`,
    rationale_ar: `السن ${age} — الأسئلة الأصعب في التمهيد اتشالت. ده بيقصّر الأسئلة بس، ومش بيرفع مستوى الطفل.`,
  };
}

/**
 * Filter the probe set by an age hint. A filter, never a map — it cannot add
 * a probe and cannot change a probe's rung.
 */
export function capProbes(probes, hint) {
  if (!hint?.applied) return [...probes];
  return probes.filter((p) => {
    const cap = hint.caps[p.ladder];
    return cap == null || p.rung <= cap;
  });
}

/** The probe set for a child. The only place age is consulted. */
export function calibrationProbesFor({ ageYears = null } = {}) {
  const hint = entryHint(ageYears);
  return { probes: capProbes(CALIBRATION_PROBES, hint), hint };
}

/**
 * ENTRY RULE — highest rung answered correctly, minus one, floored at the base.
 *
 * Minus one because a single correct response is thin evidence. Starting one
 * rung low costs the child one easy item; starting one rung high risks a floor
 * experience, and a floor experience is how a ceiling never gets discovered.
 *
 * ⚠ THIS FUNCTION TAKES NO AGE AND NO DIAGNOSIS. Its entire input is what the
 * child did. That is the blind-placement guarantee, in one signature.
 *
 * @param {Array<{probe_id:string, is_correct:boolean}>} responses
 * @returns {Object<string, {ladder, track, rung, evidence}>} keyed `LADDER:TRACK`
 */
export function entryRungsFrom(responses = []) {
  const byId = Object.fromEntries(CALIBRATION_PROBES.map((p) => [p.id, p]));
  const best = {};

  for (const r of responses) {
    const probe = byId[r.probe_id];
    if (!probe || !r.is_correct) continue;
    const key = `${probe.ladder}:${probe.track}`;
    if (!best[key] || probe.rung > best[key].rung) {
      best[key] = { ladder: probe.ladder, track: probe.track, rung: probe.rung, probe_id: probe.id };
    }
  }

  const out = {};
  const tracks = new Set([
    ...CALIBRATION_PROBES.map((p) => `${p.ladder}:${p.track}`),
  ]);

  for (const key of tracks) {
    const [ladder, track] = key.split(':');
    const base = baseRungOf(ladder, track);
    const legal = rungsOf(ladder, track);
    const hit = best[key];

    if (!hit) {
      // Nothing correct on this track — start at the base. Not a judgement,
      // just the only defensible place to begin looking.
      out[key] = { ladder, track, rung: base, evidence: 'NO_CORRECT_PROBE', from_probe: null };
      continue;
    }

    const belowHit = legal.filter((r) => r < hit.rung);
    const rung = belowHit.length ? belowHit[belowHit.length - 1] : base;
    out[key] = { ladder, track, rung, evidence: 'HIGHEST_CORRECT_MINUS_ONE', from_probe: hit.probe_id };
  }

  return out;
}

/**
 * Which strands are worth probing at the entry rung, per track.
 * Parallel strands at the same rung all come back — none gates another.
 */
export function openingStrands(entryRungs) {
  const out = [];
  for (const key of Object.keys(entryRungs)) {
    const { ladder, track, rung } = entryRungs[key];
    for (const s of Object.values(STRAND_BY_ID)) {
      if (s.ladder === ladder && s.track === track && s.rung === rung) out.push(s.id);
    }
  }
  return out.sort();
}

/**
 * Run calibration end to end.
 *
 * @param {object} input
 * @param {number|null} [input.ageYears] used ONLY to cap the offered probe set
 * @param {Array} input.responses
 */
export function runCalibration({ ageYears = null, responses = [] }) {
  const { probes, hint } = calibrationProbesFor({ ageYears });
  const offered = new Set(probes.map((p) => p.id));

  // Responses to probes that were not offered are ignored rather than trusted:
  // if a probe was capped out, a response to it is a caller bug, not evidence.
  const usable = responses.filter((r) => offered.has(r.probe_id));

  const entry_rungs = entryRungsFrom(usable);

  /**
   * Strands the child actually answered CORRECTLY.
   *
   * Distinct from `opening_strands`, which is only "what to probe first". The
   * adaptive probe uses this list to avoid closing a track over a strand the
   * child has already demonstrated — see the rescue rule in adaptiveProbe.js.
   * Conflating the two would resurrect strands the child is currently failing,
   * which is the opposite of what the rescue is for.
   */
  const byId = Object.fromEntries(CALIBRATION_PROBES.map((p) => [p.id, p]));
  const correct_strands = [
    ...new Set(usable.filter((r) => r.is_correct).map((r) => byId[r.probe_id]?.strand).filter(Boolean)),
  ].sort();

  return {
    probes_offered: probes.map((p) => p.id),
    age_hint: hint,
    responses_used: usable.length,
    responses_ignored: responses.length - usable.length,
    entry_rungs,
    opening_strands: openingStrands(entry_rungs),
    correct_strands,
    is_calibration: true,
    rule_ids: ['R-CAL-001', 'R-CAL-002'],
  };
}
