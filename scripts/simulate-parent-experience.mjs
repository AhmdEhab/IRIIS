/* Audit §1: how many questions does a parent ACTUALLY answer?
 * Replicates buildSteps() visibility/gate/follow-up logic against the real
 * bank, across age groups and answer profiles. */
import { getCaregiverBlocks } from '../src/iris/caregiver/bank.js';

const GATE_NO = 'not_yet_chance';
const TRIPLET_TRIGGERS = ['little_help', 'hands_on'];
const blocks = getCaregiverBlocks();

const vis = (it, m) => !(typeof it.ageMinMonths === 'number' && m < it.ageMinMonths) && !(typeof it.ageMaxMonths === 'number' && m > it.ageMaxMonths);
const isGate = (it) => it.format === 'gate_ability' && it.gate;

/* profile: 'min' everything absent/opportunity-missed, 'typ' mixed, 'max' everything supported */
function pick(it, profile) {
  if (isGate(it)) return profile === 'min' ? GATE_NO : 'it_happens';
  const codes = (it.ar?.opts || []).map((o) => o.v);
  if (codes.includes('does_not_yet')) return profile === 'min' ? 'does_not_yet' : profile === 'max' ? 'hands_on' : 'independent';
  if (codes.includes('never')) return profile === 'min' ? 'never' : profile === 'max' ? 'most_day' : 'sometimes';
  return codes[profile === 'max' ? codes.length - 1 : 0];
}

function run(months, profile) {
  let gates = 0, abilities = 0, followups = 0, triplets = 0, skippedByAge = 0, hiddenByGate = 0;
  const answers = {};
  for (const b of blocks) {
    for (const it of b.items) {
      if (!vis(it, months)) { skippedByAge++; continue; }
      if (isGate(it)) {
        gates++;
        answers[it.id] = { v: pick(it, profile) };
        if (answers[it.id].v === GATE_NO) { hiddenByGate++; continue; }
        abilities++;
        answers[`${it.id}_ab`] = { v: 'x' };
      } else {
        abilities++;
        answers[it.id] = { v: pick(it, profile) };
      }
      if (profile !== 'min' && (it.triplet || TRIPLET_TRIGGERS.includes((answers[it.id]?.v)))) triplets++;
      for (const fu of it.followUps || []) {
        if (!fu.item || !vis(fu.item, months)) continue;
        const whenCodes = fu.when?.answers || [];
        const parentAns = answers[fu.when?.itemId]?.v;
        const fires = profile === 'min' ? false : profile === 'max' ? true : whenCodes.includes(parentAns) || whenCodes.length === 0;
        if (fires) followups++;
      }
    }
  }
  return { gates, abilities, followups, triplets, skippedByAge, hiddenByGate, questions: gates + abilities + followups };
}

const AGES = [['2 ي (24ش)', 24], ['3 ي (36ش)', 36], ['4 ي (48ش)', 48], ['6 ي (72ش)', 72], ['9 ي (108ش)', 108], ['14 ي (168ش)', 168]];
for (const [label, m] of AGES) {
  const min = run(m, 'min'), typ = run(m, 'typ'), max = run(m, 'max');
  console.log(`${label.padEnd(12)} | min ${String(min.questions).padStart(2)} (gate ${min.gates}+ab ${min.abilities}, ${min.skippedByAge} hidden by age) | typ ${String(typ.questions).padStart(2)} (+fu ${typ.followups}, triplet rows ${typ.triplets}) | max ${String(max.questions).padStart(2)} (+fu ${max.followups}, triplet rows ${max.triplets})`);
}
// time model: read+decide+tap ≈ 7s/question, triplet +8s on the item screen, intro cards +4s/block, review 15s, intro/outro 20s
for (const [label, m] of AGES) {
  const t = run(m, 'typ');
  const secs = t.questions * 7 + t.triplets * 8 + 8 * 4 + 15 + 20;
  console.log(`${label}: typical ≈ ${Math.round(secs / 60)} min`);
}
