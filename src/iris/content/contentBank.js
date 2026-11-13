/**
 * IRIS — Content Bank (doc 15 §4)
 *
 * ── VALIDATION STATUS — READ THIS BEFORE QUOTING ANYTHING FROM THIS FILE ──
 * Every item here is:
 *     validation_status        = "RESEARCH_INFORMED_PROTOTYPE"
 *     specialist_review_status = "NOT_REVIEWED"
 *
 * That means: designed against the current evidence framework
 * (IRIS_CONTENT_FRAMEWORK_v1.md), NOT clinically or educationally validated,
 * and NOT reviewed by any specialist. No item here may be described as
 * "validated". `reviewed_by` and `reviewed_at` are null and MUST NOT be
 * populated with an invented name.
 *
 * The `evidence_tier` on each item is the tier of the DESIGN DECISION behind
 * its goal, carried over from IRIS_CONTENT_FRAMEWORK_v1.md — it is not a claim
 * that this specific item was tested.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Content is DATA. No pedagogical branching lives in this file.
 */
import { REVIEW_STATUS, VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

const proto = {
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  reviewed_by: null,
  reviewed_at: null,
  specialist_notes: null,
  review_status: REVIEW_STATUS.APPROVED, // internal draft-approval so the demo can serve it
};

/** Helper: build an item with the shared prototype metadata. */
const item = (o) => ({ ...proto, ...o });

// ── G-LANG-VOCAB — Receptive Vocabulary ───────────────────────────────────
// Evidence: H13 (concrete vs relational vocabulary), STRONG for the content
// distinction; the level ladder is an ENGINEERING ASSUMPTION.
const VOCAB = [
  item({ item_id: 'VOC-L1-01', goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', difficulty_step: 1, theme: 'animals',
    prompt: { ar: 'اضغط على القطة', en: 'Tap the cat' }, options: ['🐈', '🚗'], correct_index: 0,
    hint: { ar: 'القطة تقول: مياو', en: 'The cat says: meow' } }),
  item({ item_id: 'VOC-L1-02', goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', difficulty_step: 1, theme: 'daily',
    prompt: { ar: 'اضغط على الكرة', en: 'Tap the ball' }, options: ['⚽', '👟'], correct_index: 0,
    hint: { ar: 'الكرة مستديرة ونلعب بها', en: 'The ball is round and we play with it' } }),
  item({ item_id: 'VOC-L1-03', goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', difficulty_step: 1, theme: 'animals',
    prompt: { ar: 'اضغط على الطائر', en: 'Tap the bird' }, options: ['🐦', '🏠'], correct_index: 0,
    hint: { ar: 'الطائر يطير في السماء', en: 'The bird flies in the sky' } }),

  item({ item_id: 'VOC-L2-01', goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE', difficulty_step: 2, theme: 'food',
    prompt: { ar: 'أين الموزة؟', en: 'Where is the banana?' }, options: ['🍌', '🍎', '👞'], correct_index: 0,
    hint: { ar: 'الموزة صفراء وطويلة', en: 'The banana is yellow and long' } }),
  item({ item_id: 'VOC-L2-02', goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE', difficulty_step: 2, theme: 'daily',
    prompt: { ar: 'أين الكوب؟', en: 'Where is the cup?' }, options: ['🥤', '📚', '🪑'], correct_index: 0,
    hint: { ar: 'نشرب منه الماء', en: 'We drink water from it' } }),
  item({ item_id: 'VOC-L2-03', goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE', difficulty_step: 2, theme: 'animals',
    prompt: { ar: 'أين الفيل؟', en: 'Where is the elephant?' }, options: ['🐘', '🐭', '🌳'], correct_index: 0,
    hint: { ar: 'الفيل كبير وله خرطوم', en: 'The elephant is big and has a trunk' } }),

  item({ item_id: 'VOC-L3-01', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-PICK_PICTURE', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'ماذا نستخدم لنشرب الماء؟', en: 'What do we use to drink water?' }, options: ['🥤', '📚', '👟'], correct_index: 0,
    hint: { ar: 'فكّر: ماذا تمسك بيدك عندما تشرب؟', en: 'Think: what do you hold when you drink?' } }),
  item({ item_id: 'VOC-L3-02', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-PICK_PICTURE', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'ماذا نلبس في أقدامنا؟', en: 'What do we wear on our feet?' }, options: ['👟', '🧢', '🧤'], correct_index: 0,
    hint: { ar: 'انظر إلى قدميك', en: 'Look at your feet' } }),
  item({ item_id: 'VOC-L3-03', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-PICK_PICTURE', difficulty_step: 3, theme: 'animals',
    prompt: { ar: 'أي حيوان يعيش في الماء؟', en: 'Which animal lives in water?' }, options: ['🐟', '🐕', '🐦'], correct_index: 0,
    hint: { ar: 'هذا الحيوان يسبح', en: 'This animal swims' } }),

  // TPL-FOLLOW_INSTRUCTION also declares G-LANG-VOCAB L3 (doc 15 §3), so the
  // bank must supply items for it — otherwise a modality/template choice would
  // resolve to an empty activity.
  item({ item_id: 'VOCF-L3-01', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-FOLLOW_INSTRUCTION', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'المس الكوب ثم الكتاب', en: 'Touch the cup then the book' }, options: ['🥤', '📚', '👟'],
    correct_sequence: [0, 1],
    hint: { ar: 'استمع مرة أخرى: الكوب أولًا', en: 'Listen again: the cup first' } }),
  item({ item_id: 'VOCF-L3-02', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-FOLLOW_INSTRUCTION', difficulty_step: 3, theme: 'animals',
    prompt: { ar: 'المس القطة ثم الطائر', en: 'Touch the cat then the bird' }, options: ['🐈', '🐦', '🐕'],
    correct_sequence: [0, 1],
    hint: { ar: 'استمع مرة أخرى: القطة أولًا', en: 'Listen again: the cat first' } }),
  item({ item_id: 'VOCF-L3-03', goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-FOLLOW_INSTRUCTION', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'المس الكرة ثم البيت', en: 'Touch the ball then the house' }, options: ['⚽', '🏠', '🍎'],
    correct_sequence: [0, 1],
    hint: { ar: 'استمع مرة أخرى: الكرة أولًا', en: 'Listen again: the ball first' } }),

  item({ item_id: 'VOC-L4-01', goal_id: 'G-LANG-VOCAB', level: 4, template_id: 'TPL-PICK_WORD', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'الطفل يشرب الـ...', en: 'The child drinks the...' }, options: [{ ar: 'ماء', en: 'water' }, { ar: 'كتاب', en: 'book' }], correct_index: 0,
    hint: { ar: 'ما الذي نشربه؟', en: 'What do we drink?' } }),
  item({ item_id: 'VOC-L4-02', goal_id: 'G-LANG-VOCAB', level: 4, template_id: 'TPL-PICK_WORD', difficulty_step: 3, theme: 'daily',
    prompt: { ar: 'الطفل يقرأ الـ...', en: 'The child reads the...' }, options: [{ ar: 'كتاب', en: 'book' }, { ar: 'حذاء', en: 'shoe' }], correct_index: 0,
    hint: { ar: 'ما الذي فيه كلمات وصور؟', en: 'What has words and pictures?' } }),
  item({ item_id: 'VOC-L4-03', goal_id: 'G-LANG-VOCAB', level: 4, template_id: 'TPL-PICK_WORD', difficulty_step: 3, theme: 'animals',
    prompt: { ar: 'القطة تشرب الـ...', en: 'The cat drinks the...' }, options: [{ ar: 'حليب', en: 'milk' }, { ar: 'باب', en: 'door' }], correct_index: 0,
    hint: { ar: 'ماذا تحب القطط أن تشرب؟', en: 'What do cats like to drink?' } }),
];

// ── G-LANG-PHON — Phonological Awareness ──────────────────────────────────
// Evidence: H14, STRONG as an ASSOCIATION. Boundaries carried on every item:
// not causal, not tested in DS, source population age 9, NOT tested in Arabic.
const PHON_NOTE = 'H14 association (not causal); untested in DS; source age 9; Arabic orthography untested — see IRIS_CONTENT_FRAMEWORK_v1 §2.2';
const PHON = [
  item({ item_id: 'PHON-L1-01', goal_id: 'G-LANG-PHON', level: 1, template_id: 'TPL-SOUND_MATCH', difficulty_step: 1, theme: 'animals', evidence_note: PHON_NOTE,
    prompt: { ar: 'أي كلمة تبدأ بنفس صوت «سمك»؟', en: 'Which word starts like "sun"?' }, options: ['🚗', '☀️'], correct_index: 1,
    hint: { ar: 'استمع للصوت الأول: سسس', en: 'Listen to the first sound: sss' } }),
  item({ item_id: 'PHON-L1-02', goal_id: 'G-LANG-PHON', level: 1, template_id: 'TPL-SOUND_MATCH', difficulty_step: 1, theme: 'daily', evidence_note: PHON_NOTE,
    prompt: { ar: 'أي كلمة تبدأ بنفس صوت «موز»؟', en: 'Which word starts like "moon"?' }, options: ['🌙', '🐕'], correct_index: 0,
    hint: { ar: 'استمع للصوت الأول: ممم', en: 'Listen to the first sound: mmm' } }),
  item({ item_id: 'PHON-L1-03', goal_id: 'G-LANG-PHON', level: 1, template_id: 'TPL-SOUND_MATCH', difficulty_step: 1, theme: 'animals', evidence_note: PHON_NOTE,
    prompt: { ar: 'أي كلمة تبدأ بنفس صوت «باب»؟', en: 'Which word starts like "ball"?' }, options: ['🐦', '⚽'], correct_index: 1,
    hint: { ar: 'استمع للصوت الأول: بـبـبـ', en: 'Listen to the first sound: b-b-b' } }),

  item({ item_id: 'PHON-L2-01', goal_id: 'G-LANG-PHON', level: 2, template_id: 'TPL-SOUND_MATCH', difficulty_step: 2, theme: 'daily', evidence_note: PHON_NOTE,
    scaffold_required: ['REAL_LETTERS'],
    prompt: { ar: 'بأي حرف تبدأ كلمة «توت»؟', en: 'Which letter starts "toy"?' }, options: ['ت', 'م', 'ك'], correct_index: 0,
    hint: { ar: 'الصوت الأول هو: تـ', en: 'The first sound is: t' } }),
  item({ item_id: 'PHON-L2-02', goal_id: 'G-LANG-PHON', level: 2, template_id: 'TPL-SOUND_MATCH', difficulty_step: 2, theme: 'daily', evidence_note: PHON_NOTE,
    scaffold_required: ['REAL_LETTERS'],
    prompt: { ar: 'بأي حرف تبدأ كلمة «سمك»؟', en: 'Which letter starts "sun"?' }, options: ['س', 'ر', 'د'], correct_index: 0,
    hint: { ar: 'الصوت الأول هو: سـ', en: 'The first sound is: s' } }),
  item({ item_id: 'PHON-L2-03', goal_id: 'G-LANG-PHON', level: 2, template_id: 'TPL-SOUND_MATCH', difficulty_step: 2, theme: 'animals', evidence_note: PHON_NOTE,
    scaffold_required: ['REAL_LETTERS'],
    prompt: { ar: 'بأي حرف تبدأ كلمة «قطة»؟', en: 'Which letter starts "cat"?' }, options: ['ق', 'ن', 'ل'], correct_index: 0,
    hint: { ar: 'الصوت الأول هو: قـ', en: 'The first sound is: c' } }),

  item({ item_id: 'PHON-L3-01', goal_id: 'G-LANG-PHON', level: 3, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'daily', evidence_note: PHON_NOTE,
    prompt: { ar: 'ادمج الصوتين: بـ + يت — اختر الصورة', en: 'Blend: b + at — choose the picture' }, options: ['🏠', '🚗'], correct_index: 0,
    hint: { ar: 'قل الصوتين بسرعة معًا', en: 'Say the two sounds quickly together' } }),
  item({ item_id: 'PHON-L3-02', goal_id: 'G-LANG-PHON', level: 3, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'animals', evidence_note: PHON_NOTE,
    prompt: { ar: 'ادمج الصوتين: قـ + ط — اختر الصورة', en: 'Blend: c + at — choose the picture' }, options: ['🐈', '🐕'], correct_index: 0,
    hint: { ar: 'قل الصوتين بسرعة معًا', en: 'Say the two sounds quickly together' } }),
  item({ item_id: 'PHON-L3-03', goal_id: 'G-LANG-PHON', level: 3, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'daily', evidence_note: PHON_NOTE,
    prompt: { ar: 'ادمج الصوتين: شـ + مس — اختر الصورة', en: 'Blend: s + un — choose the picture' }, options: ['☀️', '🌙'], correct_index: 0,
    hint: { ar: 'قل الصوتين بسرعة معًا', en: 'Say the two sounds quickly together' } }),

  item({ item_id: 'PHON-L4-01', goal_id: 'G-LANG-PHON', level: 4, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'animals', evidence_note: PHON_NOTE,
    prompt: { ar: 'كم صوتًا في كلمة «قط»؟', en: 'How many sounds in "cat"?' }, options: ['2', '3', '4'], correct_index: 0,
    hint: { ar: 'عُدّ الأصوات ببطء: قـ ... ط', en: 'Count slowly: c ... a ... t' } }),
  item({ item_id: 'PHON-L4-02', goal_id: 'G-LANG-PHON', level: 4, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'daily', evidence_note: PHON_NOTE,
    prompt: { ar: 'ما الصوت الأخير في كلمة «باب»؟', en: 'What is the last sound in "ball"?' }, options: ['ب', 'م', 'س'], correct_index: 0,
    hint: { ar: 'قل الكلمة ببطء واستمع لآخرها', en: 'Say the word slowly and listen to the end' } }),
  item({ item_id: 'PHON-L4-03', goal_id: 'G-LANG-PHON', level: 4, template_id: 'TPL-SOUND_MATCH', difficulty_step: 3, theme: 'daily', evidence_note: PHON_NOTE,
    prompt: { ar: 'ما الصوت الأول في كلمة «شمس»؟', en: 'What is the first sound in "sun"?' }, options: ['ش', 'ك', 'ت'], correct_index: 0,
    hint: { ar: 'قل الكلمة ببطء واستمع لبدايتها', en: 'Say the word slowly and listen to the start' } }),
];

// ── G-MEM-VERBAL — Verbal STM ─────────────────────────────────────────────
// CONSTRAINT (H16/I10): in-task SUPPORT only. Never framed as memory training.
const MEMV_NOTE = 'H9 (DS verbal STM deficit, STRONG). Framed as in-task support, NOT memory training — WM training does not transfer (H16/I10).';
const seqItem = (id, level, step, seq, anchors, scaffolds) => item({
  item_id: id, goal_id: 'G-MEM-VERBAL', level, template_id: 'TPL-SEQ_VERBAL', difficulty_step: step,
  theme: 'daily', evidence_note: MEMV_NOTE,
  prompt: { ar: 'استمع ثم كرّر بنفس الترتيب', en: 'Listen then tap back in the same order' },
  sequence: seq, options: anchors, correct_sequence: seq.map((s) => anchors.indexOf(s)),
  scaffold_required: scaffolds,
  hint: { ar: 'استمع مرة أخرى للتسلسل', en: 'Listen to the sequence again' },
});
const MEM_VERBAL = [
  seqItem('MEMV-L1-01', 1, 1, ['🐈', '⚽'], ['🐈', '⚽', '🍌'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L1-02', 1, 1, ['☀️', '🏠'], ['☀️', '🏠', '🐦'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L1-03', 1, 1, ['🍎', '🐕'], ['🍎', '🐕', '🚗'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L2-01', 2, 2, ['🐈', '⚽', '🍌'], ['🐈', '⚽', '🍌', '🏠'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L2-02', 2, 2, ['☀️', '🏠', '🐦'], ['☀️', '🏠', '🐦', '🍎'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L2-03', 2, 2, ['🍎', '🚗', '🐕'], ['🍎', '🚗', '🐕', '⚽'], ['ANCHOR_VISIBLE']),
  seqItem('MEMV-L3-01', 3, 2, ['🐈', '🍌', '⚽'], ['🐈', '🍌', '⚽', '🏠'], []),
  seqItem('MEMV-L3-02', 3, 2, ['🌙', '🐦', '🍎'], ['🌙', '🐦', '🍎', '🚗'], []),
  seqItem('MEMV-L3-03', 3, 2, ['🏠', '☀️', '🐕'], ['🏠', '☀️', '🐕', '⚽'], []),
  seqItem('MEMV-L4-01', 4, 3, ['🐈', '⚽', '🍌', '🏠'], ['🐈', '⚽', '🍌', '🏠'], []),
  seqItem('MEMV-L4-02', 4, 3, ['☀️', '🐦', '🍎', '🚗'], ['☀️', '🐦', '🍎', '🚗'], []),
  seqItem('MEMV-L4-03', 4, 3, ['🌙', '🐕', '⚽', '🏠'], ['🌙', '🐕', '⚽', '🏠'], []),
];

// ── G-MEM-VISUAL — Visual STM ─────────────────────────────────────────────
// Evidence tier LIMITED/CONTESTED for DS (I1). Recognition-based by design.
const MEMB_NOTE = 'DS visuospatial "strength" is CONTESTED (I1). WS side rests on construction-vs-recognition (H12), inferred for this paradigm.';
const visItem = (id, level, step, seq, options, delayMs, scaffolds) => item({
  item_id: id, goal_id: 'G-MEM-VISUAL', level, template_id: 'TPL-SEQ_VISUAL', difficulty_step: step,
  theme: 'shapes', evidence_note: MEMB_NOTE,
  prompt: { ar: 'شاهد ثم اضغط بنفس الترتيب', en: 'Watch then tap in the same order' },
  sequence: seq, options, correct_sequence: seq.map((s) => options.indexOf(s)),
  delay_ms: delayMs, scaffold_required: scaffolds,
  hint: { ar: 'شاهد التسلسل مرة أخرى', en: 'Watch the sequence again' },
});
const MEM_VISUAL = [
  visItem('MEMB-L1-01', 1, 1, ['🟦', '🔴'], ['🟦', '🔴', '🟨'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L1-02', 1, 1, ['⭐', '🔺'], ['⭐', '🔺', '🟩'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L1-03', 1, 1, ['🟨', '🟩'], ['🟨', '🟩', '🔴'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L2-01', 2, 2, ['🟦', '🔴', '🟨'], ['🟦', '🔴', '🟨', '🟩'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L2-02', 2, 2, ['⭐', '🔺', '🟩'], ['⭐', '🔺', '🟩', '🟦'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L2-03', 2, 2, ['🔴', '🟩', '⭐'], ['🔴', '🟩', '⭐', '🟨'], 0, ['ANCHOR_VISIBLE']),
  visItem('MEMB-L3-01', 3, 2, ['🟦', '🟨', '🔴'], ['🟦', '🟨', '🔴', '🟩'], 3000, []),
  visItem('MEMB-L3-02', 3, 2, ['🔺', '⭐', '🟩'], ['🔺', '⭐', '🟩', '🟦'], 3000, []),
  visItem('MEMB-L3-03', 3, 2, ['🟩', '🔴', '🟨'], ['🟩', '🔴', '🟨', '⭐'], 3000, []),
  visItem('MEMB-L4-01', 4, 3, ['🟦', '🔴', '🟨', '🟩'], ['🟦', '🔴', '🟨', '🟩'], 3000, []),
  visItem('MEMB-L4-02', 4, 3, ['⭐', '🔺', '🟦', '🔴'], ['⭐', '🔺', '🟦', '🔴'], 3000, []),
  visItem('MEMB-L4-03', 4, 3, ['🟨', '🟩', '⭐', '🔺'], ['🟨', '🟩', '⭐', '🔺'], 3000, []),
];

// ── G-ATT-SUSTAIN — Sustained Attention ───────────────────────────────────
// RESEARCH GAP: no source supplies any duration or distractor level (doc 29 §F).
const ATT_NOTE = 'RESEARCH GAP — no source in the corpus supplies an attention duration or distractor level for either syndrome at any age (doc 29 §F). Durations are engineering assumptions.';
const attItem = (id, level, step, target, distractors, seconds) => item({
  item_id: id, goal_id: 'G-ATT-SUSTAIN', level, template_id: 'TPL-TARGET_DETECT', difficulty_step: step,
  theme: 'shapes', evidence_note: ATT_NOTE,
  prompt: { ar: `اضغط على ${target} كلما ظهر`, en: `Tap ${target} every time it appears` },
  target, distractors, duration_seconds: seconds, options: [target],
  hint: { ar: 'ابحث عن الشكل المطلوب فقط', en: 'Look only for the target shape' },
});
const ATTENTION = [
  attItem('ATT-L1-01', 1, 1, '⭐', [], 30),
  attItem('ATT-L1-02', 1, 1, '☀️', [], 30),
  attItem('ATT-L1-03', 1, 1, '🔴', [], 30),
  attItem('ATT-L2-01', 2, 1, '⭐', [], 60),
  attItem('ATT-L2-02', 2, 1, '🟦', [], 60),
  attItem('ATT-L2-03', 2, 1, '☀️', [], 60),
  attItem('ATT-L3-01', 3, 2, '⭐', ['🔴', '🟦'], 60),
  attItem('ATT-L3-02', 3, 2, '☀️', ['🌙', '🟨'], 60),
  attItem('ATT-L3-03', 3, 2, '🟩', ['🟦', '🔺'], 60),
  attItem('ATT-L4-01', 4, 3, '⭐', ['🔴', '🟦', '🟨'], 90),
  attItem('ATT-L4-02', 4, 3, '☀️', ['🌙', '🟨', '🔺'], 90),
  attItem('ATT-L4-03', 4, 3, '🟩', ['🟦', '🔺', '🔴'], 90),
];

// ── G-VSP-MATCH — Visual-Spatial Matching ─────────────────────────────────
// Evidence: H12 — best design-to-evidence mapping. Selection, never construction.
const VSP_NOTE = 'H12 (STRONG for WS): avoids visuospatial CONSTRUCTION, uses selection; nonverbal reasoning is a relative WS strength. DS side must be individually measured (I1).';
const VSP = [
  item({ item_id: 'VSP-L1-01', goal_id: 'G-VSP-MATCH', level: 1, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 1, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المطابق لـ 🟦', en: 'Choose the shape matching 🟦' }, options: ['🟦', '🔴'], correct_index: 0,
    hint: { ar: 'انظر إلى اللون والشكل', en: 'Look at the colour and the shape' } }),
  item({ item_id: 'VSP-L1-02', goal_id: 'G-VSP-MATCH', level: 1, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 1, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المطابق لـ ⭐', en: 'Choose the shape matching ⭐' }, options: ['🔺', '⭐'], correct_index: 1,
    hint: { ar: 'انظر إلى الشكل بعناية', en: 'Look carefully at the shape' } }),
  item({ item_id: 'VSP-L1-03', goal_id: 'G-VSP-MATCH', level: 1, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 1, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المطابق لـ 🟩', en: 'Choose the shape matching 🟩' }, options: ['🟨', '🟩'], correct_index: 1,
    hint: { ar: 'انظر إلى اللون', en: 'Look at the colour' } }),

  item({ item_id: 'VSP-L2-01', goal_id: 'G-VSP-MATCH', level: 2, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المختلف في اللون', en: 'Choose the shape with a different colour' }, options: ['🟦', '🟦', '🔴'], correct_index: 2,
    hint: { ar: 'شكلان لهما نفس اللون وواحد مختلف', en: 'Two share a colour and one is different' } }),
  item({ item_id: 'VSP-L2-02', goal_id: 'G-VSP-MATCH', level: 2, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المختلف', en: 'Choose the different shape' }, options: ['⭐', '⭐', '🔺'], correct_index: 2,
    hint: { ar: 'انظر إلى شكل كل واحد', en: "Look at each one's shape" } }),
  item({ item_id: 'VSP-L2-03', goal_id: 'G-VSP-MATCH', level: 2, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'MATCH', prompt: { ar: 'اختر الشكل المختلف في اللون', en: 'Choose the shape with a different colour' }, options: ['🟩', '🟨', '🟩'], correct_index: 1,
    hint: { ar: 'شكلان لهما نفس اللون وواحد مختلف', en: 'Two share a colour and one is different' } }),

  item({ item_id: 'VSP-L3-01', goal_id: 'G-VSP-MATCH', level: 3, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['🔴', '🟦', '🔴', '🟦'], prompt: { ar: 'أكمل النمط: 🔴 🟦 🔴 🟦 ؟', en: 'Complete: 🔴 🟦 🔴 🟦 ?' }, options: ['🔴', '🟨'], correct_index: 0,
    hint: { ar: 'انظر أي شكل يتكرّر بعد الآخر', en: 'See which shape follows which' } }),
  item({ item_id: 'VSP-L3-02', goal_id: 'G-VSP-MATCH', level: 3, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['⭐', '🔺', '⭐', '🔺'], prompt: { ar: 'أكمل النمط: ⭐ 🔺 ⭐ 🔺 ؟', en: 'Complete: ⭐ 🔺 ⭐ 🔺 ?' }, options: ['🟩', '⭐'], correct_index: 1,
    hint: { ar: 'النمط يتكرّر كل شكلين', en: 'The pattern repeats every two shapes' } }),
  item({ item_id: 'VSP-L3-03', goal_id: 'G-VSP-MATCH', level: 3, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 2, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['🟨', '🟩', '🟨', '🟩'], prompt: { ar: 'أكمل النمط: 🟨 🟩 🟨 🟩 ؟', en: 'Complete: 🟨 🟩 🟨 🟩 ?' }, options: ['🟨', '🔴'], correct_index: 0,
    hint: { ar: 'النمط يتكرّر كل شكلين', en: 'The pattern repeats every two shapes' } }),

  item({ item_id: 'VSP-L4-01', goal_id: 'G-VSP-MATCH', level: 4, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 3, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['🔺', '🔴', '🟦', '🔺', '🔴', '🟦'], prompt: { ar: 'أكمل النمط: 🔺 🔴 🟦 🔺 🔴 🟦 ؟', en: 'Complete: 🔺 🔴 🟦 🔺 🔴 🟦 ?' }, options: ['🔺', '🟨', '🟩'], correct_index: 0,
    hint: { ar: 'النمط يتكرّر كل ثلاثة أشكال', en: 'The pattern repeats every three shapes' } }),
  item({ item_id: 'VSP-L4-02', goal_id: 'G-VSP-MATCH', level: 4, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 3, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['⭐', '🟩', '🟨', '⭐', '🟩', '🟨'], prompt: { ar: 'أكمل النمط: ⭐ 🟩 🟨 ⭐ 🟩 🟨 ؟', en: 'Complete: ⭐ 🟩 🟨 ⭐ 🟩 🟨 ?' }, options: ['🔴', '⭐', '🔺'], correct_index: 1,
    hint: { ar: 'النمط يتكرّر كل ثلاثة أشكال', en: 'The pattern repeats every three shapes' } }),
  item({ item_id: 'VSP-L4-03', goal_id: 'G-VSP-MATCH', level: 4, template_id: 'TPL-PATTERN_COMPLETE', difficulty_step: 3, theme: 'shapes', evidence_note: VSP_NOTE,
    mode: 'PATTERN', pattern: ['🟦', '🟨', '🔺', '🟦', '🟨', '🔺'], prompt: { ar: 'أكمل النمط: 🟦 🟨 🔺 🟦 🟨 🔺 ؟', en: 'Complete: 🟦 🟨 🔺 🟦 🟨 🔺 ?' }, options: ['🟦', '🟩', '🔴'], correct_index: 0,
    hint: { ar: 'النمط يتكرّر كل ثلاثة أشكال', en: 'The pattern repeats every three shapes' } }),
];

/** Picture-led phonics variant items — the declared modality partner. */
const PHON_PICTURE_LED = PHON.map((it) =>
  item({
    ...it,
    item_id: it.item_id.replace('PHON-', 'PHONP-'),
    template_id: 'TPL-SOUND_MATCH_PICTURE_LED',
    prompt: {
      ar: it.prompt.ar.replace('استمع', 'انظر'),
      en: it.prompt.en,
    },
  })
);

export const CONTENT_BANK = [
  ...VOCAB, ...PHON, ...PHON_PICTURE_LED,
  ...MEM_VERBAL, ...MEM_VISUAL, ...ATTENTION, ...VSP,
];

export const ITEM_BY_ID = Object.fromEntries(CONTENT_BANK.map((i) => [i.item_id, i]));

/** Only APPROVED items may be served to a child (doc 15 §5). */
export function servableItems({ goal_id, level, template_id }) {
  return CONTENT_BANK.filter(
    (i) =>
      i.goal_id === goal_id &&
      i.level === level &&
      i.template_id === template_id &&
      i.review_status === 'APPROVED'
  );
}

export const CONTENT_BANK_META = {
  total_items: CONTENT_BANK.length,
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  description_en: 'Research-informed prototype content based on the current evidence framework. Not clinically or educationally validated. No specialist has reviewed any item.',
  description_ar: 'محتوى أوّلي مبني على إطار الأدلة الحالي. لم تتم مراجعته أو اعتماده إكلينيكيًا أو تربويًا من أي مختص.',
};
