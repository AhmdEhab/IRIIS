import { getCaregiverBlocks } from '../src/iris/caregiver/bank.js';
const B = getCaregiverBlocks();
const rows = [];
for (const b of B) {
  for (const it of b.items) {
    rows.push({ block: b.id, title: b.titleAr, id: it.id, feeds: it.feeds, format: it.format, gate: !!it.gate, triplet: !!it.triplet, fu: (it.followUps || []).length, ar: (it.ar?.q || it.ar || '').toString().replace(/<[^>]+>/g, '').slice(0, 60) });
  }
}
for (const r of rows) console.log(`${r.block} ${r.id.padEnd(4)} feeds=${(r.feeds||'-').padEnd(8)} fmt=${r.format.padEnd(12)} gate=${r.gate?'Y':'.'} triplet=${r.triplet?'Y':'.'} fu=${r.fu} | ${r.ar}`);
console.log('TOTAL base:', rows.length);
