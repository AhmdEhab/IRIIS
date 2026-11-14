import { getCaregiverBlocks, getCaregiverFollowUps } from '../src/iris/caregiver/bank.js';

const B = getCaregiverBlocks();
let base = 0;
let withFu = 0;
let fuCount = 0;
const formats = {};
const feeds = {};
for (const b of B) {
  let blockFu = 0;
  for (const it of b.items) {
    base++;
    formats[it.format] = (formats[it.format] || 0) + 1;
    const n = (it.followUps || []).length;
    if (n) { withFu++; blockFu += n; }
    feeds[it.feeds] = (feeds[it.feeds] || 0) + 1;
  }
  fuCount += blockFu;
  console.log(`${b.id} | ${b.titleAr} | base:${b.items.length} followups:${blockFu}`);
}
console.log('----');
console.log('base items:', base, '| items with follow-ups:', withFu, '| follow-ups:', fuCount, '| total nodes:', base + fuCount);
console.log('formats:', formats);
console.log('feeds:', feeds);

// how does the SCREEN filter by age? look for gate/triplet mechanics
const fus = getCaregiverFollowUps();
console.log('followup trigger shapes (first 20):');
for (const f of fus.slice(0, 20)) {
  console.log('  ', f.itemId || f.parentId || '?', '=>', (f.item?.id || '?'), '| when:', JSON.stringify(f.when || f.condition || f.trigger || null).slice(0, 110));
}
console.log('total followups:', fus.length);
const gates = [];
for (const b of B) for (const it of b.items) if (it.gate) gates.push(it.id);
console.log('gate items:', gates.join(','));
