// P68 — machine-check every answer key that CAN be checked from stored fields.
// For semantic families (rhyme/reading/story) a human passes exist; here we
// assert structural validity so a wrong index can never ship silently again.
import { PHASE5_BANK } from '../src/iris/content/phase5Bank.js';
import { taskKeyOf } from '../src/iris/content/visitPicker.js';

const problems = [];
const items = PHASE5_BANK.filter((i) => !i.status || i.status === 'active');

const has = (i) => Array.isArray(i.options) && i.options.length > 0;

for (const i of items) {
  const t = i.template_id;
  // structural: options non-empty; tiles unique EXCEPT where repetition is
  // part of the task (odd-one-out rows repeat the base tile by design, and
  // segment items show the letters of a word, which can repeat).
  const repeat_ok = i.display === 'TILE_ROW' || i.correct_order !== undefined;
  if (has(i)) {
    if (!repeat_ok && new Set(i.options).size !== i.options.length) problems.push([i.item_id, 'duplicate option tiles']);
    if (i.options.some((o) => o == null || String(o).trim() === '')) problems.push([i.item_id, 'empty option']);
  }
  // tap-each / choice boards: no key allowed
  if (i.accepts_any_output && t !== 'TPL-AR_COMM_LABEL' && t !== 'TPL-AR_COMM_LABEL_POINT') {
    if (i.correct_index !== undefined || i.correct_order !== undefined) problems.push([i.item_id, 'key on an any-output item']);
    continue;
  }
  if (i.template_id === 'TPL-AR_COMM_CHOICE') { if (i.correct_index !== undefined) problems.push([i.item_id, 'key on choice board']); continue; }

  switch (t) {
    case 'TPL-AR_VSP_MATCH':
    case 'TPL-AR_VSP_MATCH_LISTEN': {
      if (!has(i) || i.options[i.correct_index] !== i.stimulus) problems.push([i.item_id, 'match key != stimulus']);
      break;
    }
    case 'TPL-AR_MEM_DISAPPEARED':
    case 'TPL-AR_MEM_DISAPPEARED_LISTEN': {
      if (!has(i) || i.options[i.correct_index] !== i.disappeared) problems.push([i.item_id, 'memv key != disappeared']);
      if (i.tiles_shown && !i.tiles_shown.includes(i.disappeared)) problems.push([i.item_id, 'disappeared not in shown set']);
      break;
    }
    case 'TPL-AR_MEM_MEDIAL_FIRST':
    case 'TPL-AR_MEM_MEDIAL_LAST': {
      const answer = i.temporal_term === 'FIRST' ? i.sequence_shown[0] : i.sequence_shown[1];
      if (!has(i) || i.options[i.correct_index] !== answer) problems.push([i.item_id, 'medial key != temporal answer']);
      break;
    }
    case 'TPL-AR_VSP_SORT':
    case 'TPL-AR_VSP_SORT_COLOR': {
      // the keyed group must literally contain the stimulus tile
      const group = i.options[i.correct_index];
      if (!group || !group.split(' ').includes(i.stimulus)) problems.push([i.item_id, 'sort key group lacks stimulus']);
      // other groups must NOT contain it (a unique answer)
      for (let k = 0; k < i.options.length; k++) {
        if (k !== i.correct_index && i.options[k].split(' ').includes(i.stimulus)) problems.push([i.item_id, `sort tile also in group ${k}`]);
      }
      break;
    }
    default: {
      if (i.correct_index !== undefined) {
        if (!Number.isInteger(i.correct_index) || i.correct_index < 0 || i.correct_index >= (i.options?.length ?? 0)) {
          problems.push([i.item_id, 'correct_index out of range']);
        }
      }
      if (i.correct_order) {
        if (!Array.isArray(i.correct_order)) problems.push([i.item_id, 'bad correct_order']);
        else for (const o of i.correct_order) if (!i.options.includes(o)) problems.push([i.item_id, 'correct_order tile missing from options']);
      }
    }
  }
}

// cross-bank R2 clones: the SAME perceived question must live in exactly one
// item inside a template. The same stimulus+options pair ACROSS templates is
// allowed — it is a different task (number→quantity vs counting selection) —
// and the visit picker already prevents both from being served together.
const seen = new Map();
const cloneInfo = [];
for (const i of items) {
  const k = JSON.stringify([i.template_id, taskKeyOf(i)]);
  const xk = taskKeyOf(i);
  if (seen.has(k)) problems.push([i.item_id, `same-template clone of ${seen.get(k)}`]);
  else seen.set(k, i.item_id);
  const cross = items.find((o) => o.item_id !== i.item_id && o.template_id !== i.template_id && taskKeyOf(o) === xk && xk[0] !== null);
  if (cross && i.item_id < cross.item_id) cloneInfo.push(`${i.item_id} ~ ${cross.item_id} (different templates — picker keeps them apart)`);
}
for (const l of cloneInfo) console.log('INFO', l);

if (problems.length) {
  for (const [id, why] of problems) console.log('BAD', id, '—', why);
  console.log(`FAIL ${problems.length} key problems`);
  process.exit(1);
}
console.log(`OK — ${items.length} items, all checkable keys valid, no duplicate tasks`);
