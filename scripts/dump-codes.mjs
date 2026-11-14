import { getCaregiverItems } from '../src/iris/caregiver/bank.js';
const items = getCaregiverItems();
const ids = ['P6', 'P7', 'P7a', 'H3', 'H5', 'H6', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'M4a', 'X2', 'X2a', 'X2b', 'X2c', 'X5', 'X6', 'L6', 'C4', 'C8', 'C9', 'M5', 'S3', 'S5', 'S6', 'H7', 'L4', 'H1', 'H2', 'P2', 'P4', 'P5'];
for (const id of ids) {
  const it = items[id];
  if (!it) { console.log(id, 'MISSING'); continue; }
  const opts = (it.ar && it.ar.opts) || [];
  console.log(id, it.format, '::', opts.map(o => o.v + '(' + o.label + ')').join(' ').slice(0, 230));
}
