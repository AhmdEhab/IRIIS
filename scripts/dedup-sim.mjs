import { runCalibration, startProbe, nextProbe, recordProbe, PROBE_PROFILES } from './src/iris/journey.js';
import { servableStrandItems } from './src/iris/content/phase5Bank.js';

function pick(v) {
  const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
  const fb = pool.length ? pool : servableStrandItems({ strand: v.strand });
  const n = Math.max(1, v.item_count || 1);
  const len = fb.length || 1;
  const start = ((((v.visit_offset || 0) % len) * n)) % len;
  return fb.slice(start).concat(fb.slice(0, start)).slice(0, Math.min(n, len)).map((i) => i.item_id);
}

const cal = runCalibration({ ageYears: 5 });
let st = startProbe(cal, PROBE_PROFILES.family);
const all = [];
const visitTpls = [];
let guard = 0;
for (;;) {
  const v = nextProbe(st);
  if (!v) break;
  if (++guard > 60) { console.log('RUNAWAY'); break; }
  visitTpls.push(`${v.strand}@${v.rung}:${v.template || '-'}(o${v.visit_offset})`);
  all.push(...pick(v));
  const res = {
    correct: guard % 3 === 0 ? 0 : 1,
    total: v.item_count,
    supported: 0,
    insufficient: guard % 7 === 0 ? 1 : 0,
  };
  st = recordProbe(st, v, res);
}
const counts = {};
all.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
const dup = Object.entries(counts).filter(([, c]) => c > 1);
console.log('items served:', all.length, '| unique:', Object.keys(counts).length, '| repeated:', dup.length);
console.log('repeated detail:', JSON.stringify(dup));
console.log('visits:', visitTpls.join('\n  '));
