import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';
import { servableStrandItems } from '../src/iris/content/phase5Bank.js';
const active = PHASE5_BANK.filter((i) => i.status === undefined || i.status === 'active');
const strands = [...new Set(active.map((i) => i.strand))];
const rows = [];
for (const st of strands) {
  const all = servableStrandItems({ strand: st });
  if (all.length === 0) continue;
  const tpls = {};
  for (const i of all) tpls[i.template_id] = (tpls[i.template_id] || 0) + 1;
  const minTpl = Math.min(...Object.values(tpls));
  rows.push({ st, total: all.length, tpls: Object.entries(tpls).map(([t, c]) => t.replace('TPL-AR_', '') + '=' + c).join(','), minTpl });
}
rows.sort((a, b) => a.total - b.total);
for (const r of rows) console.log(String(r.total).padStart(3), 'minTpl=' + String(r.minTpl).padStart(2), r.st.padEnd(26), r.tpls);
console.log('TOTAL active servable:', rows.reduce((a, b) => a + b.total, 0));
