import { PHASE5_BANK, PHASE5_ITEM_BY_ID as BY } from '../src/iris/content/phase5Bank.js';

const norm = (t) => (t || '').replace(/[^\p{L}\p{N}\s§]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const P = (it) => norm(it.prompt?.ar);

// 1) TRUE duplicate tasks: identical prompt + stimulus + options + answer
const task = new Map();
for (const it of PHASE5_BANK) {
  const k = [P(it), norm(it.stimulus), (it.options || []).map(norm).join('§'), it.correct_index, it.strand].join('||');
  if (task.has(k) === false) task.set(k, []);
  task.get(k).push(it.item_id);
}
const dups = [...task.values()].filter((v) => v.length > 1);
console.log('true duplicate TASKS:', dups.length);
for (const v of dups.slice(0, 12)) console.log('  DUP:', v.join(' + '));

// 2) same target_skill + same stimulus across items (double-service risk for one task)
const skillStim = new Map();
for (const it of PHASE5_BANK) {
  const k = (it.target_skill || '?') + '::' + norm(it.stimulus);
  if (skillStim.has(k) === false) skillStim.set(k, []);
  skillStim.get(k).push(it.item_id);
}
const ss = [...skillStim.entries()].filter(([, v]) => v.length > 1);
console.log('same skill+stimulus groups:', ss.length);
for (const [k, v] of ss.slice(0, 12)) console.log('  ', k.slice(0, 60), '->', v.join(' + '));

// 3) letter-name vs dot-position wording split
const nameW = PHASE5_BANK.filter((i) => /اسم الحرف/.test(P(i)));
const dotW = PHASE5_BANK.filter((i) => /فين حرف/.test(P(i)));
console.log('letter-NAME prompts ("اسم الحرف"):', nameW.length, '| dot prompts ("فين حرف"):', dotW.length);
console.log('  name ids:', nameW.slice(0, 14).map((x) => x.item_id).join(','));
if (dotW.length) console.log('  sample dot:', dotW[0].item_id, '|', dotW[0].prompt.ar, '| skill:', dotW[0].target_skill);

// 4) retired + ghosts
console.log('retired gone:', ['AR-BLDP-101','AR-BLDP-108','AR-CRD-192','AR-CRD-193'].every((i) => BY[i] === undefined));
console.log('ghost picture-led prompts:', PHASE5_BANK.filter((i) => /الصورة دي أصواتها/.test(P(i))).length);

// 5) per-strand pool size (engine needs enough depth for the rules)
const per = new Map();
for (const it of PHASE5_BANK) per.set(it.strand, (per.get(it.strand) || 0) + 1);
const small = [...per.entries()].filter(([, n]) => n < 4).sort((a, b) => a[1] - b[1]);
console.log('strands total:', per.size, '| strands with <4 items:', small.length);
for (const [s, n] of small.slice(0, 10)) console.log('  THIN:', s, n);
