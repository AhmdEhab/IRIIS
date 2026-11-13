/**
 * Phase 5 — ladder, honesty and scenario checks.
 *
 * Complements tests/iris.phase5.test.js. That file tests behaviour; this one
 * runs the nine end-to-end scenarios the Phase 5 brief names (A–I) and checks
 * the claims the product makes about itself, which is where an assessment
 * engine is most likely to drift: it is very easy to start describing this as
 * validated, normed, or adaptive in the psychometric sense. It is none of
 * those, and every assertion below exists because a specific overclaim would
 * otherwise be easy to make.
 */
import fs from 'node:fs';
import path from 'node:path';

const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const J = await import('./src/iris/journey.js');
const { ALL_STRANDS, STRAND_BY_ID, validateLadders } = await import('./src/iris/ladders/index.js');
const { PHASE5_BANK, bankCoverage, PHASE5_BANK_META } = await import('./src/iris/content/phase5Bank.js');
const { DIALECT_DISTANCE } = await import('./src/iris/ladders/literacy.js');
const { snapshotStrings, containsBannedTerm } = await import('./src/iris/parent/snapshot.js');

const cal = (m) => Object.entries(m).map(([probe_id, is_correct]) => ({ probe_id, is_correct }));
const ALL_CORRECT = cal(Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [`CAL-${String(i + 1).padStart(2, '0')}`, true])
));
const FOUNDATIONAL = cal({
  'CAL-01': true, 'CAL-02': true, 'CAL-03': false, 'CAL-04': false, 'CAL-05': false,
  'CAL-06': false, 'CAL-07': true, 'CAL-08': true, 'CAL-09': false, 'CAL-10': true,
});

const run = (opts) => J.runLadderAssessment({ accommodations: [], ...opts });

// ── 1. the nine scenarios ───────────────────────────────────────────────────
console.log('\n[1] End-to-end scenarios A–I');
{
  // A — age 7, foundational learner
  const A = run({
    ageYears: 7, calibrationResponses: FOUNDATIONAL,
    respond: (v) => (v.rung <= 1 ? { correct: 2, total: 3, modality: v.template } : { correct: 0, total: 3, modality: v.template }),
  });
  const planA = J.planLadderContent({ assessment: A });
  pass('A: age 7 foundational — enters low and gets foundational work',
    A.calibration.entry_rungs['LITERACY:MAIN'].rung <= 1
    && planA.blueprint.activities.length > 0
    && planA.blueprint.activities.every((x) => ['FOUNDATION', 'GUIDED', 'PRACTICE'].includes(x.tier)),
    `entry r${A.calibration.entry_rungs['LITERACY:MAIN'].rung}, tiers ${[...new Set(planA.blueprint.activities.map((x) => x.tier))].join('/')}`);

  // B — age 7, strong learner
  const B = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: () => ({ correct: 3, total: 3 }) });
  pass('B: age 7 strong — climbs well above entry',
    B.stops['LITERACY:MAIN'].rung > B.stops['LITERACY:MAIN'].entry_rung + 2,
    `r${B.stops['LITERACY:MAIN'].entry_rung} → r${B.stops['LITERACY:MAIN'].rung}`);

  // C — struggling child
  const C = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: () => ({ correct: 0, total: 3 }) });
  const planC = J.planLadderContent({ assessment: C });
  pass('C: struggling — descends, stops early, and is given supported work',
    C.stops['LITERACY:MAIN'].rung < C.stops['LITERACY:MAIN'].entry_rung
    && C.items_presented < 60
    && planC.blueprint.activities.every((x) => x.scaffold_flags.length > 0),
    `${C.items_presented} items, all activities scaffolded`);

  // D — strong performance explores the next skill
  const D = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: () => ({ correct: 3, total: 3 }) });
  const rungsSeen = new Set(D.probe.results.filter((r) => r.ladder === 'NUMERACY').map((r) => r.rung));
  pass('D: strong — explores successive numeracy rungs', rungsSeen.size >= 4, `rungs ${[...rungsSeen].sort().join(',')}`);

  // E — inconsistent performance
  const E = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: (v) => ({ correct: 1, total: 3, modality: v.template }) });
  const gathered = E.probe.results.some((r) => ['SHIFT_MODALITY', 'RESAMPLE_AT_BASE'].includes(r.move));
  const noHighConfidence = Object.values(E.indicators).every((i) => i.confidence !== 'HIGH');
  pass('E: inconsistent — gathers more evidence and stays cautious', gathered && noHighConfidence);

  // F / G — the same trace under two diagnoses
  const trace = (v) => ({ correct: v.rung <= 2 ? 3 : v.rung <= 4 ? 2 : 0, total: 3, modality: v.template });
  const F = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: trace, accommodations: J.accommodationDefaults('DOWN_SYNDROME').accommodations });
  const G = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: trace, accommodations: J.accommodationDefaults('WILLIAMS_SYNDROME').accommodations });
  const academic = (r) => JSON.stringify({ i: r.indicators, p: r.profile, pr: r.priorities, d: r.domains, l: r.ledger, s: r.stops });
  pass('F/G: Down syndrome and Williams syndrome produce identical academic output',
    academic(F) === academic(G));
  pass('F/G: only the accommodations differ',
    JSON.stringify(F.accommodations_used) !== JSON.stringify(G.accommodations_used),
    `${F.accommodations_used.length} vs ${G.accommodations_used.length} access supports`);
  pass('F/G: the content plan is identical too',
    JSON.stringify(J.planLadderContent({ assessment: F }).blueprint) ===
    JSON.stringify(J.planLadderContent({ assessment: G }).blueprint));

  // H — Arabic learner. Uses the foundational calibration on purpose: the
  // Arabic-specific strands (positional forms, dot contrasts) live at rung 1,
  // and a child who demonstrated rung 2 in calibration is correctly never
  // re-probed there. To show Arabic assessment happening you have to assess a
  // child who is actually at that level.
  const H = run({ ageYears: 7, calibrationResponses: FOUNDATIONAL, respond: (v) => ({ correct: 2, total: 3, modality: v.template }) });
  const planH = J.planLadderContent({ assessment: H });
  const arabicStrands = Object.keys(H.indicators).filter((s) => STRAND_BY_ID[s].arabic_specific);
  pass('H: Arabic-specific strands are actually assessed', arabicStrands.length > 0, arabicStrands.join(', '));
  const items = planH.activities.flatMap((a) => a.items);
  pass('H: served items carry Arabic content, not translated English',
    items.length > 0 && items.every((i) => /[؀-ۿ]/.test(JSON.stringify(i.prompt) + (i.stimulus ?? '') + (i.options ?? []).join(''))));

  // I — independent strands
  const strong = new Set(['NUM.CARDINALITY', 'LIT.SOUND_TO_LETTER']);
  const weak = new Set(['NUM.NUMERAL', 'LIT.LETTER_TO_SOUND']);
  const I = run({
    ageYears: 7, calibrationResponses: ALL_CORRECT,
    respond: (v) => (strong.has(v.strand) ? { correct: 3, total: 3, modality: v.template }
      : weak.has(v.strand) ? { correct: 0, total: 3, modality: v.template }
      : { correct: 2, total: 3, modality: v.template }),
  });
  const ind = I.indicators;
  pass('I: four skills stay independently represented, not collapsed',
    ind['NUM.CARDINALITY']?.indicator > 60 && ind['NUM.NUMERAL']?.floor
    && ind['LIT.SOUND_TO_LETTER']?.indicator > 60 && ind['LIT.LETTER_TO_SOUND']?.floor,
    `cardinality ${ind['NUM.CARDINALITY']?.indicator} / numeral ${ind['NUM.NUMERAL']?.floor ? 'floor' : ind['NUM.NUMERAL']?.indicator}, s→l ${ind['LIT.SOUND_TO_LETTER']?.indicator} / l→s ${ind['LIT.LETTER_TO_SOUND']?.floor ? 'floor' : ind['LIT.LETTER_TO_SOUND']?.indicator}`);
}

// ── 2. ladder and bank integrity ────────────────────────────────────────────
console.log('\n[2] Ladder and bank integrity');
{
  const v = validateLadders();
  pass('ladder structure is valid', v.ok, v.problems.join('; '));

  const cov = bankCoverage();
  const empty = ALL_STRANDS.filter((s) => !cov[s.id] || cov[s.id].items < 3).map((s) => s.id);
  pass('every strand has at least three servable items', empty.length === 0, empty.join(', '));
  pass('the bank is a real size', PHASE5_BANK.length >= 150, `${PHASE5_BANK.length} items`);

  const noKey = PHASE5_BANK.filter((i) => i.correct_index == null && !i.correct_order && i.expected_taps == null);
  pass('every item has an answer key', noKey.length === 0, noKey.map((i) => i.item_id).join(', '));

  const badIdx = PHASE5_BANK.filter((i) => i.correct_index != null && (i.correct_index < 0 || i.correct_index >= (i.options || []).length));
  pass('no answer key points outside its options', badIdx.length === 0);

  const ordered = new Set(['TPL-AR_SEGMENT', 'TPL-AR_LISTEN_INSTRUCTION']);
  const dup = PHASE5_BANK.filter((i) => i.options && !ordered.has(i.template_id) && new Set(i.options).size !== i.options.length);
  pass('no single-select item offers two identical options', dup.length === 0, dup.map((i) => i.item_id).join(', '));
}

// ── 3. Arabic-specific requirements ─────────────────────────────────────────
console.log('\n[3] Arabic, not translated English');
{
  pass('positional letter forms are assessed', PHASE5_BANK.some((i) => i.letter_form));
  pass('dot contrasts have their own error code',
    PHASE5_BANK.filter((i) => i.strand === 'LIT.DOT_CONTRAST').every((i) => i.error_codes?.includes('DOT_CONFUSION')));
  pass('all nine dot-confusion sets are covered',
    new Set(PHASE5_BANK.filter((i) => i.dot_set).map((i) => i.dot_set)).size >= 9);

  const diacritics = /[ً-ْ]/;
  const targets = PHASE5_BANK.filter((i) => i.vowelised);
  pass('literacy target text is vowelised',
    targets.length > 0 && targets.every((i) => diacritics.test(`${i.stimulus ?? ''}${(i.options ?? []).join('')}`)),
    `${targets.length} vowelised items`);

  const phon = PHASE5_BANK.filter((i) => STRAND_BY_ID[i.strand]?.phonological);
  pass('every phonological item carries a dialect tag',
    phon.every((i) => ['MSA_ONLY', 'SHIFTED', 'SHARED', 'UNKNOWN'].includes(i.dialect_distance)),
    `${phon.length} phonological items`);

  pass('Eastern Arabic numerals are used',
    PHASE5_BANK.filter((i) => i.strand === 'NUM.NUMERAL')
      .every((i) => /[٠-٩]/.test(`${i.stimulus ?? ''}${(i.options ?? []).join('')}`)));

  // The dialect tag must never move a number.
  const shared = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: (v) => ({ correct: 2, total: 3, modality: v.template, dialect_distance: 'SHARED' }) });
  const msaOnly = run({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: (v) => ({ correct: 2, total: 3, modality: v.template, dialect_distance: 'MSA_ONLY' }) });
  const same = Object.keys(shared.indicators).every((k) => shared.indicators[k].indicator === msaOnly.indicators[k].indicator);
  pass('the dialect tag annotates but never changes a score', same);
  pass('a dialect caveat is actually raised when it applies',
    Object.values(msaOnly.indicators).some((i) => i.dialect_caveat));
}

// ── 4. honesty about what this is ───────────────────────────────────────────
console.log('\n[4] No overclaiming');
{
  const src = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
  const engineFiles = [
    'src/iris/ladders/literacy.js', 'src/iris/ladders/numeracy.js',
    'src/iris/engines/calibration.js', 'src/iris/engines/adaptiveProbe.js',
    'src/iris/engines/indicators.js', 'src/iris/engines/skillEstimate.js',
    'src/iris/content/blueprint.js', 'src/iris/parent/snapshot.js',
  ];
  const code = engineFiles.map(src).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')       // block comments
    .replace(/^\s*\/\/.*$/gm, '')            // line comments
    // Fields prefixed with `_` are this codebase's documentation convention
    // (_source, _why, _note, _contract). They describe the design in prose and
    // must not be scanned as if they were logic — otherwise a comment saying
    // "this reads no diagnosis" would fail a check for diagnosis handling.
    .replace(/^\s*_[A-Za-z_]+:\s*[\s\S]*?,\s*$/gm, '');

  for (const [label, re] of [
    ['an IQ or intelligence claim', /\b(iq_|intelligence_quotient|computeIQ)\b/i],
    ['a percentile', /\bpercentile\b/i],
    ['an age equivalent', /\bage_equivalent|ageEquivalent\b/i],
    ['a reading age', /\breading_age|readingAge\b/i],
    ['an IRT ability estimate', /\b(theta|abilityEstimate|standard_error|standardError)\b/i],
    ['a diagnosis', /\bdiagnos/i],
    ['a hardcoded syndrome rule', /DOWN_SYNDROME|WILLIAMS_SYNDROME|FRAGILE_X/],
  ]) {
    pass(`the engine contains no ${label}`, !re.test(code));
  }

  pass('the bank does not claim to be validated',
    PHASE5_BANK.every((i) => i.validation_status === 'RESEARCH_INFORMED_PROTOTYPE' && i.specialist_review_status === 'NOT_REVIEWED'));
  pass('the bank metadata says plainly that it is not normed',
    /not validated|not normed/i.test(PHASE5_BANK_META.description_en));
  pass('the dialect list is marked as needing specialist review',
    DIALECT_DISTANCE._validation === 'SPECIALIST_REVIEW_REQUIRED');

  // The parent view is the surface where an overclaim would do most harm.
  const r = run({ ageYears: 7, calibrationResponses: FOUNDATIONAL, respond: (v) => ({ correct: 2, total: 3, modality: v.template }) });
  const snap = J.ladderSnapshot(r, { childName: 'يوسف' });
  const strings = snapshotStrings(snap);
  const banned = strings.flatMap((s) => containsBannedTerm(s).map((t) => `${t} in "${s.slice(0, 30)}"`));
  pass('no banned term reaches a parent', banned.length === 0, banned.join('; '));

  const text = strings.join(' ').toLowerCase();
  // Note "indicator" is deliberately absent: "IRIS Learning Indicator" is the
  // approved public name for these numbers, so it belongs in parent copy.
  for (const term of ['rung', 'strand', 'dps', 'ladder', 'provenance', 'consecutive']) {
    pass(`the parent view does not leak the internal term "${term}"`, !text.includes(term));
  }
  for (const term of ['behind', 'delayed', 'below average', 'should be able', 'متأخر']) {
    pass(`the parent view does not say "${term}"`, !text.includes(term));
  }
  pass('the disclaimer is present', /IRIS learning screening/i.test(snap.disclaimer.en));
  pass('the practice dosage is flagged as an assumption',
    snap.practice._validation === 'ENGINEERING_ASSUMPTION');
}

// ── 5. the loop actually closes ─────────────────────────────────────────────
console.log('\n[5] Assessment → content → practice → updated estimate');
{
  const r = run({ ageYears: 7, calibrationResponses: FOUNDATIONAL, respond: (v) => ({ correct: 1, total: 3, modality: v.template }) });
  const plan = J.planLadderContent({ assessment: r });
  pass('the assessment produces a content plan', plan.blueprint.activities.length > 0);
  pass('the plan resolves to real items', plan.activities.every((a) => a.items.length > 0));

  const target = plan.blueprint.activities[0];
  let ledger = r.ledger;
  const before = ledger.estimates[target.strand]?.rung ?? target.rung;
  for (let i = 0; i < 2; i++) {
    ({ ledger } = J.recordPracticeSession({
      ledger, strand: target.strand, rung: ledger.estimates[target.strand]?.rung ?? target.rung,
      correct: 3, total: 3, modality: `m${i}`,
    }));
  }
  const after = ledger.estimates[target.strand].rung;
  pass('practice advances the skill estimate', after > before, `r${before} → r${after}`);
  pass('the estimate is marked as observed, not assumed',
    ledger.estimates[target.strand].provenance === 'OBSERVED');

  const replan = J.planLadderContent({ assessment: { ...r, ledger } });
  pass('the next plan reflects the new estimate',
    JSON.stringify(replan.blueprint) !== JSON.stringify(plan.blueprint));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
