// P64b: prove the child RESULTS REPORT (a) adapts to the child's answers,
// (b) never smuggles in scores/diagnosis/IQ/mental-age language, and
// (c) survives the empty-data path. Pure engine level — the browser suites
// (qa-family-flow) already prove the rendering and navigation.
import { runCalibration, startProbe, nextProbe, recordProbe, PROBE_PROFILES, finaliseLadderAssessment } from '../src/iris/journey.js';
import { buildGettingToKnowResult } from '../src/iris/journey/results.js';

function playSession(policy) {
  const cal = runCalibration({ ageYears: 5 });
  let st = startProbe(cal, PROBE_PROFILES.family);
  let step = 0;
  for (;;) {
    const v = nextProbe(st);
    if (!v) break;
    if (++step > 60) throw new Error('runaway');
    const total = Math.max(1, v.item_count || 1);
    let correct;
    if (policy === 'pass') correct = total;
    else if (policy === 'fail') correct = 0;
    else correct = step % 3 === 0 ? 0 : Math.max(1, total - 1);
    st = recordProbe(st, v, { correct, total, supported: policy === 'fail' ? 1 : 0, insufficient: 0 });
  }
  return { cal, st };
}

const BANNED = ['درجة', 'علامة', 'تشخيص', 'عمر عقلي', 'معدل ذكاء', 'نسبة ذكاء', 'IQ', 'mental age', 'diagnosis', 'diagnostic', 'score', 'percentile'];
const stripNonAr = (t) => t.replace(/scoreless/gi, ''); // engine-internal word, not child-facing

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log('ok   -', name, detail ? `(${detail})` : '');
  else { failures++; console.log('FAIL -', name, detail); }
};

const statesByPolicy = {};
for (const policy of ['pass', 'fail', 'mixed']) {
  const { cal, st } = playSession(policy);
  const assessment = finaliseLadderAssessment({ calibration: cal, probe: { ...st, finished: true }, accommodations: [] });
  const res = buildGettingToKnowResult({ ladderResult: assessment, caregiverProfile: null, childName: 'يوسف', lang: 'ar' });
  statesByPolicy[policy] = res.skills.map((s) => `${s.nameAr}:${s.state}`).sort().join(',');
  check(`${policy}: report has skills`, res.skills.length >= 3, `${res.skills.length} skills`);
  check(`${policy}: headline + honest line present`, !!res.headline && !!res.honestLine);
  const blob = stripNonAr(JSON.stringify(res));
  const hit = BANNED.filter((w) => blob.includes(w));
  check(`${policy}: no banned clinical/psychometric vocabulary`, hit.length === 0, hit.join('|'));
  const strengths = res.strengths ?? [];
  const next = res.nextSteps ?? [];
  console.log(`     ${policy} → states: ${res.skills.map((s) => s.stateAr).join(' / ')}`);
  console.log(`     ${policy} → strengths=${strengths.length} [${strengths.map((x)=>x.ar??x).join(' | ').slice(0,90)}] next=${next.length}`);
}

check('report adapts: all-pass differs from all-fail', statesByPolicy.pass !== statesByPolicy.fail);
check('report adapts: mixed differs from both', statesByPolicy.mixed !== statesByPolicy.pass && statesByPolicy.mixed !== statesByPolicy.fail);

// empty-data path (the screen's caregiver-only variant must not crash)
const empty = buildGettingToKnowResult({ ladderResult: null, caregiverProfile: null, childName: 'يوسف', lang: 'ar' });
check('empty ladder → hasChildEvidence false, no crash', empty.hasChildEvidence === false && empty.skills.length === 0);

// state vocabulary is restricted to the descriptive band set (no numerics)
const STATES = new Set(['solo', 'help', 'emerging', 'more_info']);
const anyBad = Object.values(statesByPolicy).flatMap((j) => j.split(',')).filter((p) => p && !STATES.has(p.split(':')[1]));
check('every skill state is a descriptive band (no numbers)', anyBad.length === 0, anyBad.join('|'));

console.log(failures ? `RESULT: ${failures} FAILURES` : 'RESULT: adaptivity checks all green');
process.exit(failures ? 1 : 0);
