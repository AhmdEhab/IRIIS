/**
 * The guard around generated content.
 *
 * ── WHAT THIS FILE IS FOR ─────────────────────────────────────────────────
 * IRIS uses Gemini as a CONSTRAINED GENERATION LAYER and nothing else. The
 * adaptive engine owns the learner state, the goal, the difficulty, the
 * adaptation and the progression; the model's entire job is to write one more
 * practice item at a difficulty that has already been decided for it. This
 * file is where that constraint is actually enforced, on both sides:
 *
 *   INBOUND   `buildRequest()` decides what the model is allowed to be told.
 *             It is a whitelist, not a filter: only the fields listed here
 *             are ever assembled into a prompt. A child's name, age,
 *             diagnosis, accuracy, session history and identifiers cannot
 *             reach the model, because there is no code path that puts them
 *             in the request.
 *
 *   OUTBOUND  `validateItem()` decides what may reach a child. A model
 *             response is untrusted input. It is parsed, shape-checked,
 *             range-checked, length-capped and scanned for banned language
 *             before anything is returned, and a single failure discards the
 *             whole item rather than repairing it — a "mostly valid" question
 *             in front of a child with an intellectual disability is not an
 *             acceptable degradation.
 *
 * Everything here is pure and synchronous, so it is unit-tested without a
 * network, an API key, or a running server. That matters: the safety layer is
 * the part that must be provably correct, and a safety layer that can only be
 * exercised by making a billable call is a safety layer nobody exercises.
 */

/* ── the safety vocabulary ──────────────────────────────────────────────── */

/**
 * Kept in sync with src/iris/spec.js BANNED_TERMS by
 * tests/iris.gemini.test.js, which fails if the two lists diverge. Duplicated
 * rather than imported because the server is CommonJS and the spec is ESM, and
 * a dynamic import in the hot path of a content request is not worth it.
 */
const BANNED_TERMS = [
  'deficit', 'impairment', 'disorder', 'abnormal', 'retarded',
  'low-functioning', 'suffers from', 'victim', 'handicapped',
  'normal children', 'slow learner',
  'iq', 'percentile', 'age equivalent', 'age-equivalent',
];

/**
 * Things a generated item must never do, over and above the banned terms.
 *
 * These are the failure modes that matter for THIS product: a model asked for
 * a letter-matching question that instead offers an opinion about the child,
 * a diagnosis, a medical instruction, or a comparison to other children. Each
 * pattern is deliberately broad — a false positive costs one bank item, a
 * false negative reaches a child.
 */
const UNSAFE_PATTERNS = [
  /**
   * NOTE the trailing `\w*` on the stems. Written as `\b(diagnos|autis)\b`
   * these matched nothing real — "autism" and "diagnosis" both continue past
   * the stem, so the word boundary never landed and "Which picture shows a
   * child with autism?" passed the guard. Stems match the whole word family.
   */
  // clinical / diagnostic
  /\b(diagnos\w*|autis\w*|adhd|down syndrome|cerebral palsy|fragile x|syndrome\w*|disabilit\w*|disabled)\b/i,
  /\b(therap\w*|medication\w*|medicine\w*|dosage|treatment\w*|clinical\w*|patient\w*)\b/i,
  /\b(intelligence|cognitive\w*|mental age|developmental age)\b/i,
  // comparison and judgement
  /\b(compared to other|than other children|typical child\w*|normal child\w*|behind the|delayed)\b/i,
  /\b(smart|stupid|clever|slow|bad at|good at) (child|kid|children)\b/i,
  // instructions aimed at anyone but the learner
  /\b(as an ai|language model|i cannot|i'm sorry|as a large)\b/i,
  // Arabic equivalents
  /(تشخيص|توحّد|توحد|متلازمة|إعاقة|علاج طبيعي|دواء|ذكاء|عمر عقلي|متأخر عن)/,
  // anything resembling contact details or a link
  /(https?:\/\/|www\.|@[\w.-]+\.\w{2,})/i,
];

/** Hard caps. A question a child reads must be short; a runaway is a bug. */
const LIMITS = {
  PROMPT_CHARS: 120,
  OPTION_CHARS: 40,
  HINT_CHARS: 90,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 4,
  MAX_ITEMS_PER_REQUEST: 4,
};

/* ── inbound: what the model may be told ────────────────────────────────── */

/**
 * The ONLY fields that may be sent to the model, and where each comes from.
 *
 * Read this list as the privacy contract. There is no child identifier here,
 * no diagnosis, no age, no accuracy, no history, no free text from a parent.
 * The model is told what skill and what difficulty to write for — nothing
 * about who will answer it.
 */
const ALLOWED_CONTEXT_FIELDS = [
  'skill',        // human-readable name of the strand, e.g. "Letter names"
  'skillDetail',  // the strand's own description from the ladder
  'difficulty',   // the tier label the engine chose: FOUNDATION … CHALLENGE
  'format',       // the template id the engine chose
  'language',     // 'ar' | 'en'
  'optionCount',  // how many choices, decided by the tier, not the model
  'avoid',        // prompts already used, so a variant is actually a variant
];

/**
 * Assemble the request the model will receive.
 *
 * @param {object} spec fields as named in ALLOWED_CONTEXT_FIELDS
 * @returns {{ system: string, user: string, context: object }}
 *
 * `context` is returned separately so a caller — and a test — can assert
 * exactly what was about to be transmitted, without reading it out of a
 * formatted prompt string.
 */
function buildRequest(spec = {}) {
  const context = {};
  for (const key of ALLOWED_CONTEXT_FIELDS) {
    if (spec[key] !== undefined && spec[key] !== null) context[key] = spec[key];
  }

  const ar = context.language === 'ar';

  /**
   * The system instruction is a hard boundary, restated in the negative.
   * It never asks the model to judge, decide, assess, or adapt — those words
   * are absent on purpose, because a model told it is "helping assess a
   * child's ability" will start volunteering assessments.
   */
  const system = [
    'You write ONE practice question for a children\'s learning app.',
    'You are a content writer. You are NOT an assessor, a teacher, a clinician or an advisor.',
    '',
    'The difficulty, the skill and the format have ALREADY been decided by the application.',
    'Write only at the difficulty given. Do not make the question easier or harder.',
    '',
    'You must NEVER:',
    '- diagnose anything, or mention any condition, syndrome, disability or diagnosis',
    '- refer to intelligence, IQ, mental age, developmental age, percentiles or age equivalents',
    '- compare the learner to other children or to what is "normal" or "typical"',
    '- give medical, therapeutic or psychological advice',
    '- comment on the learner, their progress, their ability or their history',
    '- invent facts about any learner — you are given none, and there are none to infer',
    '- include links, contact details, names of real people, or any personal data',
    '- produce frightening, violent, sexual, religious or politically charged content',
    '',
    'Write in simple, warm, concrete language for a child who may read slowly.',
    ar
      ? 'Write in Egyptian Arabic, in Arabic script. Short words. No diacritics unless the item is about letter sounds.'
      : 'Write in simple English. Short words.',
    '',
    'Return JSON only, matching the schema. Exactly one wrong answer must be plausible;',
    'the rest must be clearly different. Never mark more than one option correct.',
  ].join('\n');

  const avoid = Array.isArray(context.avoid) && context.avoid.length
    ? `\nDo not repeat any of these existing questions:\n${context.avoid.slice(0, 8).map((a) => `- ${a}`).join('\n')}`
    : '';

  const user = [
    `Skill: ${context.skill ?? 'unspecified'}`,
    context.skillDetail ? `What the skill involves: ${context.skillDetail}` : null,
    `Difficulty (already decided, do not change): ${context.difficulty ?? 'PRACTICE'}`,
    `Question format (already decided): ${context.format ?? 'multiple choice'}`,
    `Number of answer options: ${context.optionCount ?? 2}`,
    `Language: ${ar ? 'Egyptian Arabic' : 'English'}`,
    avoid,
  ].filter(Boolean).join('\n');

  return { system, user, context };
}

/**
 * The response schema handed to Gemini's structured-output mode.
 *
 * Structured output is a convenience, not a guarantee: `validateItem()` still
 * checks everything below, because a schema constrains shape and says nothing
 * about content.
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    prompt: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    correct_index: { type: 'integer' },
    hint: { type: 'string' },
  },
  required: ['prompt', 'options', 'correct_index'],
};

/* ── outbound: what may reach a child ───────────────────────────────────── */

/** True when the text contains a banned term as a whole word. */
function hasBannedTerm(text) {
  const s = String(text).toLowerCase();
  return BANNED_TERMS.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(s);
  });
}

/** True when the text trips any of the unsafe-content patterns. */
function isUnsafe(text) {
  const s = String(text);
  return UNSAFE_PATTERNS.some((re) => re.test(s));
}

/**
 * Validate one generated item against everything the app requires of it.
 *
 * Returns `{ ok: true, item }` or `{ ok: false, reason }`. There is no
 * "repaired" branch: a caller that gets `ok: false` uses a bank item. Silently
 * fixing model output would mean the thing shown to a child was assembled by
 * neither the model nor the bank, and could not be reproduced or reviewed.
 *
 * @param {*} raw            parsed JSON from the model (or anything at all)
 * @param {object} expected  what the ENGINE asked for; the item is checked
 *                           against this, never against what the model claims
 */
function validateItem(raw, expected = {}) {
  const fail = (reason) => ({ ok: false, reason });

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('NOT_AN_OBJECT');

  const { prompt, options, correct_index: correctIndex, hint } = raw;

  /* shape */
  if (typeof prompt !== 'string' || !prompt.trim()) return fail('PROMPT_MISSING');
  if (!Array.isArray(options)) return fail('OPTIONS_NOT_ARRAY');
  if (!options.every((o) => typeof o === 'string' && o.trim())) return fail('OPTION_NOT_A_STRING');
  if (!Number.isInteger(correctIndex)) return fail('CORRECT_INDEX_NOT_AN_INTEGER');
  if (hint !== undefined && typeof hint !== 'string') return fail('HINT_NOT_A_STRING');

  /* counts — the ENGINE decides how many options; the model does not */
  const wanted = expected.optionCount;
  if (Number.isInteger(wanted) && options.length !== wanted) return fail('WRONG_OPTION_COUNT');
  if (options.length < LIMITS.MIN_OPTIONS) return fail('TOO_FEW_OPTIONS');
  if (options.length > LIMITS.MAX_OPTIONS) return fail('TOO_MANY_OPTIONS');

  /* ranges */
  if (correctIndex < 0 || correctIndex >= options.length) return fail('CORRECT_INDEX_OUT_OF_RANGE');

  /* an item with two identical options has no single right answer */
  const normalised = options.map((o) => o.trim());
  if (new Set(normalised).size !== normalised.length) return fail('DUPLICATE_OPTIONS');

  /* lengths */
  if (prompt.length > LIMITS.PROMPT_CHARS) return fail('PROMPT_TOO_LONG');
  if (normalised.some((o) => o.length > LIMITS.OPTION_CHARS)) return fail('OPTION_TOO_LONG');
  if (hint && hint.length > LIMITS.HINT_CHARS) return fail('HINT_TOO_LONG');

  /* content safety, across every field that a child or parent could see */
  const all = [prompt, ...normalised, hint ?? ''].join(' \n ');
  if (hasBannedTerm(all)) return fail('BANNED_TERM');
  if (isUnsafe(all)) return fail('UNSAFE_CONTENT');

  /* language: an Arabic request that comes back in Latin script is unusable */
  if (expected.language === 'ar') {
    const arabic = /[؀-ۿ]/;
    if (!arabic.test(prompt)) return fail('NOT_ARABIC_SCRIPT');
  }
  if (expected.language === 'en') {
    // Some items are legitimately Arabic letters rendered inside an English
    // interface (letter-name work), so only the PROMPT is required to be Latin.
    if (!/[A-Za-z]/.test(prompt)) return fail('NOT_LATIN_SCRIPT');
  }

  /* a variant must actually differ from what the child has already seen */
  const avoid = (expected.avoid ?? []).map((a) => String(a).trim());
  if (avoid.includes(prompt.trim())) return fail('DUPLICATE_OF_EXISTING_ITEM');

  return {
    ok: true,
    item: {
      prompt: prompt.trim(),
      options: normalised,
      correct_index: correctIndex,
      hint: hint ? hint.trim() : null,
      /**
       * Provenance travels with the item for the rest of its life. Generated
       * content is never silently equivalent to reviewed bank content: it is
       * marked here, stored marked, and shown marked wherever that matters.
       */
      source: 'GENERATED',
      generated_at: new Date().toISOString(),
      validation_status: 'GENERATED_UNREVIEWED',
      specialist_review_status: 'NOT_REVIEWED',
    },
  };
}

module.exports = {
  BANNED_TERMS,
  UNSAFE_PATTERNS,
  LIMITS,
  ALLOWED_CONTEXT_FIELDS,
  RESPONSE_SCHEMA,
  buildRequest,
  validateItem,
  hasBannedTerm,
  isUnsafe,
};
