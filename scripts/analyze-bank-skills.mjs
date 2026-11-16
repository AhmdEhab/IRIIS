/* P63 analysis: child-bank skill inventory + duplicate/overlap report. */
import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';
import { STRAND_BY_ID } from '../src/iris/ladders/index.js';

const bySkill = new Map();
for (const it of PHASE5_BANK) {
  const k = (it.target_skill || 'UNDECLARED').toLowerCase();
  if (!bySkill.has(k)) bySkill.set(k, []);
  bySkill.get(k).push(it);
}
const byPrompt = new Map();
for (const it of PHASE5_BANK) {
  const k = (it.prompt?.ar || '').trim();
  if (!byPrompt.has(k)) byPrompt.set(k, []);
  byPrompt.get(k).push(it);
}

console.log('== strands in bank ==');
const strandCount = {};
for (const it of PHASE5_BANK) strandCount[it.strand] = (strandCount[it.strand] ?? 0) + 1;
for (const [s, n] of Object.entries(strandCount)) {
  const st = STRAND_BY_ID[s];
  console.log(`${s}: ${n} items | label: ${st?.label?.ar ?? st?.label ?? '?'} | what: ${String(st?.measures?.ar ?? st?.measures ?? '').slice(0, 60)}`);
}

console.log('\n== skills spanning MORE THAN ONE strand (cross-ladder overlap) ==');
for (const [skill, items] of bySkill) {
  const strands = new Set(items.map((i) => i.strand));
  if (strands.size > 1) {
    console.log(`${skill}: ${items.length} items across ${[...strands].join(', ')}`);
    console.log('   ids:', items.map((i) => i.item_id).join(', '));
  }
}

console.log('\n== identical Arabic prompt text used by >1 item ==');
for (const [p, items] of byPrompt) {
  if (items.length > 1 && p) {
    const sameSkill = new Set(items.map((i) => i.target_skill)).size === 1;
    console.log(`[${sameSkill ? 'same skill' : 'DIFFERENT skills'}] "${p.slice(0, 48)}" x${items.length}: ${items.map((i) => i.item_id).join(', ')}`);
  }
}

console.log('\n== skill count distribution ==');
const dist = {};
for (const [skill, items] of bySkill) { const n = items.length; dist[n] = (dist[n] ?? 0) + 1; }
console.log(Object.entries(dist).sort((a, b) => b[0] - a[0]).map(([n, k]) => `${k} skills x${n}`).join(', '));

console.log('\n== skills with 6+ items (over-sampled → repetition feel) ==');
for (const [skill, items] of [...bySkill.entries()].sort((a, b) => b[1].length - a[1].length)) {
  if (items.length < 6) break;
  console.log(`${skill}: ${items.length} | rungs: ${[...new Set(items.map((i) => i.rung))].sort().join(',')} | ids: ${items.map((i) => i.item_id).slice(0, 12).join(', ')}${items.length > 12 ? '…' : ''}`);
}

console.log('\n== near-synonym skill names (same leading token) ==');
const skills = [...bySkill.keys()].sort();
for (let i = 1; i < skills.length; i++) {
  const a = skills[i - 1], b = skills[i];
  const ta = a.split(/[-_]/), tb = b.split(/[-_]/);
  const shared = ta.filter((w) => w.length > 3 && tb.includes(w));
  if (shared.length >= 2 && a !== b) console.log(`~ ${a}  <>  ${b}  (shared: ${shared.join(',')})`);
}
