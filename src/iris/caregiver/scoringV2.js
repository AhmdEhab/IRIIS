/* ══════════════════════════════════════════════════════════════════════════
 * cv2 scorer — an adapter, not a new engine.
 *
 * The approved design (PARENT_ASSESSMENT_CV2_FINAL_DRAFT §7) keeps the cv1
 * scoring engine as the single source of truth for states, confidence,
 * intensities and access settings. Every cv2 answer is emitted as the set of
 * legacy cv1 item codes it stands for, the cv1 engine scores them, and we
 * re-stamp the result as cv2 with honest completeness and the care flags.
 * Nothing here creates or displays a child score, a level, or an IQ.
 * ════════════════════════════════════════════════════════════════════════ */
import { scoreCaregiverProfile } from './scoring.js';

const A = (v, t) => (t ? { v, t } : { v });
const M = (list) => ({ v: list });
const NOTE = (t) => ({ note: t });

/* severity shared by VQ5 with the chosen daily parts */
const S_V = { middle: 'little_help', hands_on: 'hands_on', not_yet: 'does_not_yet' };
const T_HELP = { himself: 'none', mama_baba: 'supervise', other_person: 'partial_physical', hand_help: 'full_physical' };

/* cv2 code → { cv1 itemId: legacy answer }. Empty maps are fine (a cv2
 * answer may legitimately carry no extra legacy signal). */
const EMIT = {
  VQ1: {
    words: { C2: A('independent'), C3: A('independent'), C7: A('independent') },
    sentences: { C2: A('independent'), C3: A('independent'), C7: A('independent') },
    gesture: { C2: A('little_help'), C3: A('little_help'), C7: A('little_help'), C5: A('unsure'), C6: A('unsure') },
    aac: { C2: A('little_help'), C3: A('little_help'), C7: A('hands_on'), C9: A('yes_happens'), C5: A('unsure'), C6: A('unsure') },
    hard_to_read: { C2: A('hands_on'), C3: A('little_help'), C7: A('hands_on'), C5: A('unsure'), C6: A('unsure') },
    not_yet: { C2: A('does_not_yet'), C3: A('does_not_yet'), C7: A('does_not_yet'), C5: A('unsure'), C6: A('unsure') },
  },
  VQ1v: {
    sentences_plus: { C5: A('independent'), C6: A('independent') },
    many_words: { C5: A('independent'), C6: A('little_help') },
    few_words: { C5: A('little_help'), C6: A('does_not_yet') },
    sounds: { C5: A('hands_on'), C6: A('does_not_yet') },
  },
  VQ2: {
    independent: { C1: A('independent'), C8: A('much_more') },
    little_help: { C1: A('little_help'), C8: A('much_more') },
    hands_on: { C1: A('hands_on'), C8: A('a_bit_more') },
    routine_only: { C1: A('hands_on'), C8: A('unsure') },
    not_yet: { C1: A('does_not_yet') },
  },
  VQ3: {
    /* M5 proxy: table sitting follows activity participation. L2 (two-step)
     and L3 (sorting) keep their triplet signal so 'how much help' is asked
     exactly once in the merged VQ3 wording. */
    independent: { L2: A('independent'), L3: A('independent'), M5: A('independent') },
    little_help: { L2: A('little_help', 'supervise'), L3: A('little_help', 'supervise'), M5: A('little_help') },
    hands_on: { L2: A('hands_on', 'partial_physical'), L3: A('hands_on', 'partial_physical'), M5: A('hands_on') },
    not_yet: { L2: A('not_yet_chance'), L3: A('not_yet_chance'), M5: A('does_not_yet') },
  },
  VQ3f: {
    suggest: { L4: A('sometimes') },
    skip: {},
  },
  VQ4: {
    independent: { L5: A('independent'), L1: A('independent') },
    little_help: { L5: A('little_help'), L1: A('little_help') },
    hands_on: { L5: A('hands_on'), L1: A('hands_on') },
    not_yet: { L5: A('not_yet_chance'), L1: A('not_yet_chance') },
  },
  VQ5: {
    independent: { S1: A('independent'), S2: A('independent'), S3: A('independent'), S4: A('independent'), S5: A('independent') },
    middle: { S1: A('little_help'), S2: A('little_help'), S3: A('little_help'), S4: A('little_help'), S5: A('little_help') },
    hands_on: { S1: A('hands_on'), S2: A('hands_on'), S3: A('hands_on'), S4: A('hands_on'), S5: A('hands_on') },
    not_yet: { S1: A('not_yet_chance'), S2: A('not_yet_chance'), S3: A('not_yet_chance'), S4: A('not_yet_chance'), S5: A('not_yet_chance') },
  },
  /* VQ5f/VQ5h are folded into legacy answers below (they override VQ5's
     blanket severity for the chosen parts and attach the helper type). */
  VQ6: {
    free: { M1: A('independent'), M2: A('independent') },
    support: { M1: A('little_help'), M2: A('little_help') },
    device: { M1: A('hands_on'), M2: A('little_help') },
    not_yet: { M1: A('not_yet_chance'), M2: A('not_yet_chance') },
  },
  VQ6m: {
    hands_ok: { M3: A('independent'), M4: A('independent') },
    fine_hard: { M3: A('hands_on'), M4: A('little_help') },
    points_only: { M3: A('hands_on'), M4: A('little_help'), M4a: M(['one_choice', 'big_targets']) },
    own_way: { M3: A('hands_on'), M4: A('little_help'), M4a: M(['big_targets', 'switch_button']) },
  },
  VQ6s: {
    nothing: { H1: A('independent'), H2: A('independent') },
    vision: { H1: A('little_help') },
    hearing: { H2: A('little_help') },
    both: { H1: A('hands_on'), H2: A('hands_on') },
    unsure: { H7: A('none') },
  },
  VQ7: {
    with_kids: { P1: A('independent'), P2: A('most_times'), P3: A('independent'), P5: A('independent') },
    near_kids: { P1: A('little_help'), P2: A('sometimes'), P3: A('little_help'), P5: A('little_help') },
    alone_pref: { P1: A('hands_on'), P2: A('rarely'), P3: A('hands_on'), P5: A('hands_on') },
    avoids: { P1: A('does_not_yet'), P2: A('never'), P3: A('does_not_yet'), P5: A('does_not_yet') },
  },
  VQ13: {
    practiced: { L7: A('yes_happens') },
    home_only: { L7: A('yes_happens') },
    not_yet: { L7: A('not_yet_chance') },
  },
  VQ11: {
    morning: { G4: A('morning') },
    after_school: { G4: A('after_noon') },
    evening: { G4: A('evening') },
    varies: { G4: A('varies') },
  },
  VQ12: {
    home: { X2: A('home_only') },
    kg: { X2: A('kindergarten') },
    school: { X2: A('school_full') },
    school_therapy: { X2: A('school_part') },
  },
  VPREF: {
    text: { X5: A('text') },
    audio: { X5: A('audio') },
    both: { X5: A('both') },
  },
};

/* VQ8 chips → legacy multi responses. Codes verified against cv1's option
 * lists (P7 self/tantrums, H3 hard_to_settle, H6 avoids_loud, H5 none…). */
const VQ8_EMIT = {
  fuss: [['P7', 'tantrums'], ['L6', '@fussy']],
  fear_sensory: [['H6', 'avoids_loud'], ['P7', 'frozen']],
  self_care: [['P7', 'self']],
  sleep: [['H3', 'hard_to_settle']],
  health: [],
  none: [['P7', 'none'], ['L6', '@fine']],
};

/* VQ9 chips → G2 soothing chips (+ doneSignal when nothing works yet). */
const VQ9_EMIT = {
  hug: [['G2', 'hug']],
  quiet_space: [['G2', 'quiet_corner']],
  music: [['G2', 'music_play']],
  object: [['G2', 'favourite_object']],
  food: [['G2', 'food_treat']],
  unknown: [['G3', 'no_signal']],
};
const VQ9F_EMIT = {
  before_noise: 'before_noise', before_change: 'before_change', before_demand: 'before_demand',
  before_tired: 'before_tired', before_unexplained: 'before_unexplained',
};

function mergeInto(legacy, entries) {
  for (const [id, answer] of Object.entries(entries || {})) {
    const cur = legacy[id];
    if (!cur) { legacy[id] = { ...answer }; continue; }
    if (Array.isArray(answer.v)) cur.v = [...new Set([...(cur.v || []), ...answer.v])];
    else Object.assign(cur, answer);
  }
}

export function scoreCaregiverV2({ responses = {}, meta = {} } = {}) {
  const legacy = {};
  const asV = (r) => (r && typeof r === 'object' ? (Array.isArray(r.v) ? r.v : r.v ? [r.v] : []) : []);

  for (const [id, ans] of Object.entries(responses)) {
    if (id === 'VQ8' || id === 'VQ9') continue; // handled as multis below
    if (id === 'VQ5f' || id === 'VQ5h' || id === 'VQ10b') continue; // folded
    if (id === 'VQ10') {
      const codes = asV(ans).filter((c) => c !== 'other');
      legacy.G1 = { v: [...codes] };
      if (typeof ans.note === 'string' && ans.note.trim()) legacy.G1.v.push('other');
      if (typeof ans.note === 'string' && ans.note.trim()) legacy.G1.note = ans.note.trim();
      continue;
    }
    if (id === 'VQ9f') {
      const c = asV(ans)[0];
      if (c && VQ9F_EMIT[c]) legacy.P7a = { v: [VQ9F_EMIT[c]] };
      continue;
    }
    const table = EMIT[id];
    if (!table) continue;
    for (const code of asV(ans)) mergeInto(legacy, table[code]);
  }

  /* VQ5 severity + VQ5f chosen parts + VQ5h helper → precise S answers */
  const v5 = asV(responses.VQ5)[0];
  if (v5) {
    const blanket = EMIT.VQ5[v5] || {};
    const parts = asV(responses.VQ5f);
    const helper = asV(responses.VQ5h)[0];
    const partMap = { eat: 'S1', dress: 'S2', wash: 'S4', toilet: 'S3', choose: 'S5' };
    if (v5 === 'independent' || parts.length === 0) {
      mergeInto(legacy, blanket);
    } else {
      /* start from blanket, then upgrade the un-chosen parts to independent-
       * ish only when severity was middle; chosen parts carry the severity */
      const chosenLegacy = parts.map((p) => partMap[p]).filter(Boolean);
      const sev = S_V[v5] || 'hands_on';
      for (const [sid, ans] of Object.entries(blanket)) legacy[sid] = { ...ans };
      for (const sid of ['S1', 'S2', 'S3', 'S4', 'S5']) {
        if (!legacy[sid]) continue;
        if (chosenLegacy.includes(sid)) legacy[sid] = { v: sev };
        else if (v5 === 'middle') legacy[sid] = { v: 'independent' };
      }
      const t = helper && T_HELP[helper];
      if (t) for (const sid of chosenLegacy) if (legacy[sid]) legacy[sid].t = t;
    }
  }

  /* VQ8 / VQ9 multis */
  for (const code of asV(responses.VQ8)) {
    for (const [id, c] of VQ8_EMIT[code] || []) {
      if (c.startsWith('@')) { /* single-choice override for L6 etc. */
        if (!legacy[id]) legacy[id] = { v: c.slice(1) };
        continue;
      }
      if (!legacy[id]) legacy[id] = { v: [] };
      if (!legacy[id].v.includes(c)) legacy[id].v.push(c);
    }
    if (code === 'health') legacy.H5 = legacy.H5 || { v: [] };
  }
  for (const code of asV(responses.VQ9)) {
    for (const [id, c] of VQ9_EMIT[code] || []) {
      if (!legacy[id]) legacy[id] = { v: [] };
      if (id === 'G3') legacy[id] = { v: c };
      else if (!legacy[id].v.includes(c)) legacy[id].v.push(c);
    }
  }
  /* cv2 asks hands/mobility on 1–2 screens only: when the probes were not
     shown, say 'unsure' rather than nothing — coverage stays honest, rows
     skip unknown bands. Senses: same. */
  if (responses.VQ6 && !responses.VQ6m) {
    legacy.M3 = legacy.M3 || { v: 'unsure' };
    legacy.M4 = legacy.M4 || { v: 'unsure' };
  }
  if (responses.VQ2 && !responses.VQ6s) {
    legacy.H1 = legacy.H1 || { v: 'unsure' };
    legacy.H2 = legacy.H2 || { v: 'unsure' };
  }
  /* strength text feeds goals (cv1 G6) */
  const strength = responses.VQ10b && (responses.VQ10b.note || responses.VQ10b.v);
  if (typeof strength === 'string' && strength.trim()) legacy.G6 = NOTE(strength.trim());

  const scored = scoreCaregiverProfile({ responses: legacy, meta: { ...meta, completed: true } });

  /* re-stamp as cv2 — honest completeness measured on the cv2 flow itself */
  const v2Ids = ['VQ1', 'VQ1v', 'VQ2', 'VQ6s', 'VQ3', 'VQ3f', 'VQ4', 'VQ5', 'VQ5f', 'VQ6', 'VQ6m', 'VQ13', 'VQ7', 'VQ8', 'VQ9', 'VQ9f', 'VQ10', 'VQ10b', 'VQ11', 'VQ12', 'VPREF'];
  const probeIds = ['VQ1v', 'VQ6s', 'VQ3f', 'VQ5f', 'VQ5h', 'VQ6m', 'VQ9f']; /* never counted against core totals */
  const months = typeof meta.childAgeMonths === 'number' ? meta.childAgeMonths : null;
  const totalCore = 13 + (months !== null && months >= 60 ? 1 : 0) + 1; /* 13 always-on + letters if 5y + VPREF */
  const answered = v2Ids.filter((id) => !probeIds.includes(id)).filter((id) => {
    const r = responses[id];
    if (!r) return false;
    if (typeof r === 'string') return r.trim().length > 0;
    return (Array.isArray(r.v) ? r.v.length > 0 : r.v != null && r.v !== '') || (typeof r.note === 'string' && r.note.trim());
  }).length;
  for (const cap of ['S', 'M']) {
    if (scored.domainStates[cap] && scored.domainStates[cap].confidence === 'HIGH') scored.domainStates[cap].confidence = 'MEDIUM';
  }
  scored.bankVersion = 'cv2';
  const probesAnswered = probeIds.filter((id) => {
    const r = responses[id];
    if (!r) return false;
    return (Array.isArray(r.v) ? r.v.length > 0 : r.v != null && r.v !== '') || (typeof r.note === 'string' && r.note.trim());
  }).length;
  scored.completeness = { answered, total: totalCore, probesAnswered, perBlock: scored.completeness ? scored.completeness.perBlock : {} };
  scored.careFlags = asV(responses.VQ8).includes('self_care') ? ['self_care'] : [];
  if (scored.careFlags.length) {
    scored.guidanceNotes = [
      'شكراً إنك شاركتينا النقطة دي. اللي حصل ده ماحدش غلطان فيه، وIRIS مايشخّصش وماينصحش بعلاج — لو الحاجة بتتكرر أو قوية، الدكتور اللي متابع معاكم هو أنسب حد للكلمة. وإحنا ناخدين الموضوع ده في حسابنا في ترتيب الأنشطة والجلسات.',
    ].concat(scored.guidanceNotes || []);
  }
  scored.rawV2 = responses; /* kept for fidelity; legacy consumers ignore it */
  if (meta && meta.metrics) scored.metrics = meta.metrics; /* duration/probes — cv2 §5 timing evidence, no PII */
  return scored;
}
