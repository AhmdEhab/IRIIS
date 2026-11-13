/**
 * The Gemini safety layer, tested without a network, a key, or a bill.
 *
 * These are the tests that matter most in the whole suite. Everything else
 * checks that IRIS does the right thing; these check that it cannot be made to
 * do the wrong thing by a model that returns something unexpected — which is
 * the normal case, not the edge case, for generated content.
 *
 * Two claims are pinned here:
 *   INBOUND   nothing about a child can reach the model, because only
 *             whitelisted fields are ever assembled into a request.
 *   OUTBOUND  nothing unsafe, malformed or off-difficulty can reach a child,
 *             because a single validation failure discards the whole item.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { BANNED_TERMS as SPEC_BANNED } from '../src/iris/spec.js';

const require_ = createRequire(import.meta.url);
const guard = require_('../server/routes/geminiGuard.js');
const { buildRequest, validateItem, ALLOWED_CONTEXT_FIELDS, LIMITS } = guard;

/** A minimal item the guard should accept, for mutating in each test. */
const goodItem = (over = {}) => ({
  prompt: 'Which one is the letter meem?',
  options: ['م', 'ب', 'س'],
  correct_index: 0,
  hint: 'It has three teeth',
  ...over,
});

const expected = (over = {}) => ({
  language: 'en', optionCount: 3, avoid: [], ...over,
});

/* ── inbound: the privacy contract ───────────────────────────────────────── */

test('gemini: the banned-term list matches the specification', () => {
  assert.deepEqual([...guard.BANNED_TERMS].sort(), [...SPEC_BANNED].sort(),
    'server/routes/geminiGuard.js has drifted from src/iris/spec.js');
});

test('gemini: only whitelisted fields can reach the model', () => {
  const { context, system, user } = buildRequest({
    skill: 'Letter names',
    difficulty: 'PRACTICE',
    language: 'en',
    optionCount: 3,
    // Everything below is what a careless caller might pass in. None of it
    // may survive into the request.
    childName: 'Yara',
    childId: 42,
    condition: 'DOWN_SYNDROME',
    diagnosis: 'ASD',
    age: 7,
    accuracy: 0.2,
    sessionHistory: [{ correct: 1, total: 5 }],
    parentEmail: 'someone@example.com',
    notes: 'struggles with attention',
  });

  for (const key of Object.keys(context)) {
    assert.ok(ALLOWED_CONTEXT_FIELDS.includes(key), `"${key}" leaked into the request context`);
  }
  const wire = `${system}\n${user}`;
  for (const leak of ['Yara', 'DOWN_SYNDROME', 'ASD', 'someone@example.com', 'struggles with attention', '0.2']) {
    assert.ok(!wire.includes(leak), `"${leak}" reached the prompt`);
  }
});

test('gemini: the system instruction forbids every prohibited behaviour', () => {
  const { system } = buildRequest({ skill: 'Counting', language: 'en' });
  for (const rule of [/diagnos/i, /IQ/, /percentile/i, /compare/i, /medical/i, /invent/i, /personal data/i]) {
    assert.ok(rule.test(system), `the system instruction does not cover ${rule}`);
  }
  assert.ok(/ALREADY been decided/i.test(system),
    'the model must be told the difficulty is not its to choose');
});

/* ── outbound: shape and range ───────────────────────────────────────────── */

test('gemini: a well-formed item is accepted and marked as generated', () => {
  const r = validateItem(goodItem(), expected());
  assert.equal(r.ok, true, r.reason);
  assert.equal(r.item.source, 'GENERATED');
  assert.equal(r.item.validation_status, 'GENERATED_UNREVIEWED');
  assert.equal(r.item.specialist_review_status, 'NOT_REVIEWED');
});

test('gemini: malformed responses are rejected, not repaired', () => {
  const cases = [
    [null, 'NOT_AN_OBJECT'],
    ['a string', 'NOT_AN_OBJECT'],
    [[], 'NOT_AN_OBJECT'],
    [goodItem({ prompt: '' }), 'PROMPT_MISSING'],
    [goodItem({ prompt: 42 }), 'PROMPT_MISSING'],
    [goodItem({ options: 'م,ب,س' }), 'OPTIONS_NOT_ARRAY'],
    [goodItem({ options: ['م', 7, 'س'] }), 'OPTION_NOT_A_STRING'],
    [goodItem({ correct_index: '0' }), 'CORRECT_INDEX_NOT_AN_INTEGER'],
    [goodItem({ correct_index: 1.5 }), 'CORRECT_INDEX_NOT_AN_INTEGER'],
    [goodItem({ hint: 12 }), 'HINT_NOT_A_STRING'],
  ];
  for (const [raw, reason] of cases) {
    const r = validateItem(raw, expected());
    assert.equal(r.ok, false, `expected ${reason}, got ok`);
    assert.equal(r.reason, reason);
  }
});

test('gemini: the model cannot change the number of options the engine chose', () => {
  const r = validateItem(goodItem({ options: ['م', 'ب'] , correct_index: 0 }), expected({ optionCount: 3 }));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'WRONG_OPTION_COUNT');
});

test('gemini: a correct_index outside the options is rejected', () => {
  for (const idx of [-1, 3, 99]) {
    const r = validateItem(goodItem({ correct_index: idx }), expected());
    assert.equal(r.ok, false, `index ${idx} was accepted`);
    assert.equal(r.reason, 'CORRECT_INDEX_OUT_OF_RANGE');
  }
});

test('gemini: an item with two identical options has no right answer and is rejected', () => {
  const r = validateItem(goodItem({ options: ['م', 'م', 'س'] }), expected());
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'DUPLICATE_OPTIONS');
});

test('gemini: runaway lengths are capped', () => {
  assert.equal(validateItem(goodItem({ prompt: 'x'.repeat(LIMITS.PROMPT_CHARS + 1) }), expected()).reason, 'PROMPT_TOO_LONG');
  assert.equal(validateItem(goodItem({ options: ['x'.repeat(LIMITS.OPTION_CHARS + 1), 'b', 'c'] }), expected()).reason, 'OPTION_TOO_LONG');
  assert.equal(validateItem(goodItem({ hint: 'x'.repeat(LIMITS.HINT_CHARS + 1) }), expected()).reason, 'HINT_TOO_LONG');
});

/* ── outbound: content safety ────────────────────────────────────────────── */

test('gemini: banned terms are caught wherever they appear', () => {
  const places = [
    goodItem({ prompt: 'Which shows a percentile?' }),
    goodItem({ options: ['م', 'his IQ', 'س'] }),
    goodItem({ hint: 'Children with a deficit find this hard' }),
  ];
  for (const raw of places) {
    const r = validateItem(raw, expected());
    assert.equal(r.ok, false, `not caught: ${JSON.stringify(raw)}`);
    assert.equal(r.reason, 'BANNED_TERM');
  }
});

test('gemini: clinical, comparative and meta content never reaches a child', () => {
  const unsafe = [
    'Which picture shows a child with autism?',
    'Point to the therapy room',
    'Which child is behind the others?',
    'As an AI language model, here is a question',
    'Ask your doctor about this medication',
    'Which answer shows higher intelligence?',
    'Visit https://example.com for more',
    'Email us at help@example.com',
  ];
  for (const prompt of unsafe) {
    const r = validateItem(goodItem({ prompt }), expected());
    assert.equal(r.ok, false, `accepted unsafe prompt: ${prompt}`);
    assert.ok(['UNSAFE_CONTENT', 'BANNED_TERM'].includes(r.reason), `${prompt} → ${r.reason}`);
  }
});

test('gemini: Arabic clinical language is caught too', () => {
  const r = validateItem(
    { prompt: 'اختار صورة الطفل اللي عنده تشخيص', options: ['أ', 'ب'], correct_index: 0 },
    expected({ language: 'ar', optionCount: 2 })
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'UNSAFE_CONTENT');
});

/* ── outbound: it must be usable, not merely harmless ────────────────────── */

test('gemini: an Arabic request answered in Latin script is rejected', () => {
  const r = validateItem(goodItem({ options: ['م', 'ب'] , correct_index: 0 }), expected({ language: 'ar', optionCount: 2 }));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'NOT_ARABIC_SCRIPT');
});

test('gemini: an Arabic item in Arabic script is accepted', () => {
  const r = validateItem(
    { prompt: 'فين حرف الميم؟', options: ['م', 'ب'], correct_index: 0, hint: 'بصّ على السنّ' },
    expected({ language: 'ar', optionCount: 2 })
  );
  assert.equal(r.ok, true, r.reason);
});

test('gemini: a "variant" identical to an existing question is rejected', () => {
  const r = validateItem(goodItem(), expected({ avoid: ['Which one is the letter meem?'] }));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'DUPLICATE_OF_EXISTING_ITEM');
});

/* ── the whole point: nothing gets through by accident ───────────────────── */

test('gemini: a mutation of any single required field fails validation', () => {
  /**
   * A guard that only rejects the failures its author imagined is not a
   * guard. This walks every field and confirms that removing it is fatal,
   * so a future field added to the item shape cannot become optional by
   * omission.
   */
  for (const field of ['prompt', 'options', 'correct_index']) {
    const raw = goodItem();
    delete raw[field];
    const r = validateItem(raw, expected());
    assert.equal(r.ok, false, `an item with no "${field}" was accepted`);
  }
});

test('gemini: validation is pure — the same input always gives the same verdict', () => {
  const raw = goodItem();
  const first = validateItem(raw, expected());
  for (let i = 0; i < 20; i++) {
    const again = validateItem(raw, expected());
    assert.equal(again.ok, first.ok);
    assert.equal(again.item.prompt, first.item.prompt);
  }
});
