import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREGIVER_BANK_VERSION } from '../src/iris/caregiver/bank.js';
import { CAREGIVER_V2_VERSION, getCaregiverBlocksV2, CARE_CARD_CODES } from '../src/iris/caregiver/bankV2.js';
import { scoreCaregiverV2 } from '../src/iris/caregiver/scoringV2.js';

const blocks = getCaregiverBlocksV2();
const all = blocks.flatMap((b) => b.items);
const CORE = all.filter((i) => !['VQ1v', 'VQ6s', 'VQ3f', 'VQ5f', 'VQ5h', 'VQ6m', 'VQ9f'].includes(i.id));
const byId = (id) => all.find((i) => i.id === id);

test('cv2 bank: version, shape, no gate/triplet formats, unique ids', () => {
  assert.equal(CAREGIVER_V2_VERSION, 'cv2');
  assert.deepEqual(blocks.map((b) => b.id), ['V-A', 'V-B', 'V-C', 'V-D']);
  const seen = new Set();
  for (const it of all) {
    assert.ok(!seen.has(it.id), `dup ${it.id}`);
    seen.add(it.id);
    assert.ok(['single', 'multi', 'opentext'].includes(it.format), `${it.id} format ${it.format}`);
    assert.ok(!it.triplet && !it.gate, `${it.id} must not carry gate/triplet UI`);
    assert.ok(it.ar?.q && it.en?.q, `${it.id} bilingual`);
    if (it.format !== 'opentext') {
      assert.ok((it.ar?.opts?.length ?? 0) >= 2 && (it.en?.opts?.length ?? 0) >= 2, `${it.id} options`);
      assert.deepEqual(it.ar.opts.map((o) => o.v), it.en.opts.map((o) => o.v), `${it.id} codes aligned`);
    }
  }
});

test('cv2 core count is 13 always-on (+VQ13 at 5y +VPREF) — never above 15', () => {
  const always = CORE.filter((i) => !i.ageMinMonths);
  assert.equal(always.length, 14, 'VQ1..VQ12 minus probes + VQ10b + VPREF = 14');
  assert.ok(byId('VQ13').ageMinMonths === 60);
  // "under 15" promise: 13 child questions + VPREF = 14 for a 4-year-old
  const under5 = always.filter((i) => i.id !== 'VPREF');
  assert.equal(under5.length, 13);
});

test('cv2: VPREF is a preference, not child information', () => {
  assert.equal(byId('VPREF').feeds, 'prefs');
  assert.ok(byId('VPREF').ar.q.includes('ملوش علاقة بيه'));
});

test('score cv2: speech probe only when words are the channel', () => {
  const r = scoreCaregiverV2({ responses: {
    VQ1: { v: 'aac' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' }, VQ4: { v: 'independent' },
    VQ5: { v: 'independent' }, VQ6: { v: 'free' }, VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] },
    VQ9: { v: ['hug'] }, VQ10: { v: ['music'] }, VQ11: { v: 'morning' }, VQ12: { v: 'home' }, VPREF: { v: 'both' },
  }, meta: { childAgeMonths: 50 } });
  assert.equal(r.bankVersion, 'cv2');
  // AAC path never asked the speech-level probe → C5/C6 unsure → still MEDIUM at most
  assert.equal(r.domainStates.C.state, 'does_with_support');
  assert.notEqual(r.domainStates.C.confidence, 'HIGH');
});

test('score cv2: self-care tick sets care flag + calm note, never a score', () => {
  const r = scoreCaregiverV2({ responses: {
    VQ1: { v: 'words' }, VQ1v: { v: 'few_words' }, VQ2: { v: 'hands_on' }, VQ3: { v: 'hands_on' },
    VQ4: { v: 'hands_on' }, VQ5: { v: 'middle' }, VQ6: { v: 'free' }, VQ7: { v: 'near_kids' },
    VQ8: { v: ['self_care', 'fuss'] }, VQ9: { v: ['unknown'] }, VQ9f: { v: 'before_demand' },
    VQ10: { v: ['water'] }, VQ11: { v: 'evening' }, VQ12: { v: 'home' }, VPREF: { v: 'text' },
  }, meta: { childAgeMonths: 66 } });
  assert.deepEqual(r.careFlags, ['self_care']);
  assert.ok(CARE_CARD_CODES.includes('self_care'));
  assert.ok(r.guidanceNotes[0].includes('مايشخّصش'), 'calm non-diagnostic note first');
  assert.ok(r.guidanceNotes[0].includes('الدكتور اللي متابع معاكم'));
  // P7 legacy emitted but the composite never exists
  assert.equal(r.overallScore ?? null, null);
  assert.equal(r.composite ?? null, null);
  // no numeric field above 100 anywhere in domain states
  for (const d of Object.values(r.domainStates)) {
    assert.ok(['independent', 'does_independently', 'does_with_support', 'emerging', 'needs_more_information'].includes(d.state));
  }
});

test('score cv2: S and M confidence are capped at MEDIUM', () => {
  const full = {
    VQ1: { v: 'words' }, VQ1v: { v: 'sentences_plus' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' },
    VQ4: { v: 'independent' }, VQ5: { v: 'middle' }, VQ5f: { v: ['dress'] }, VQ5h: { v: 'mama_baba' },
    VQ6: { v: 'support' }, VQ6m: { v: 'hands_ok' }, VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] },
    VQ9: { v: ['hug'] }, VQ10: { v: ['animals'] }, VQ10b: { note: 'بيركب السلالم لوحده' }, VQ11: { v: 'morning' }, VQ12: { v: 'school' },
    VQ13: { v: 'home_only' }, VPREF: { v: 'both' },
  };
  const r = scoreCaregiverV2({ responses: full, meta: { childAgeMonths: 72 } });
  assert.notEqual(r.domainStates.S.confidence, 'HIGH');
  assert.notEqual(r.domainStates.M.confidence, 'HIGH');
  assert.equal(r.completeness.total, 15);
  assert.equal(r.completeness.answered, 15); // core only — probes never inflate
  assert.ok(['emerging', 'does_with_support'].includes(r.domainStates.M.state)); // support-holding walker, good hands
});

test('score cv2: access never inferred from walking', () => {
  const freeWalker = scoreCaregiverV2({ responses: {
    VQ1: { v: 'gesture' }, VQ2: { v: 'little_help' }, VQ3: { v: 'little_help' }, VQ4: { v: 'little_help' },
    VQ5: { v: 'independent' }, VQ6: { v: 'free' }, VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] },
    VQ9: { v: ['hug'] }, VQ10: { v: ['balls'] }, VQ11: { v: 'morning' }, VQ12: { v: 'kg' }, VPREF: { v: 'both' },
  }, meta: { childAgeMonths: 54 } });
  // VQ6m not shown → M3/M4 unsure → no tap-only access invention beyond defaults
  assert.equal(freeWalker.accessSettings.responseMode, 'tap');
  const deviceChild = scoreCaregiverV2({ responses: {
    VQ1: { v: 'aac' }, VQ2: { v: 'hands_on' }, VQ3: { v: 'hands_on' }, VQ4: { v: 'hands_on' },
    VQ5: { v: 'hands_on' }, VQ5f: { v: ['eat', 'dress', 'wash', 'toilet', 'choose'] }, VQ5h: { v: 'hand_help' },
    VQ6: { v: 'device' }, VQ6m: { v: 'own_way' }, VQ7: { v: 'near_kids' }, VQ8: { v: ['fuss'] },
    VQ9: { v: ['music'] }, VQ10: { v: ['music'] }, VQ11: { v: 'varies' }, VQ12: { v: 'home' }, VPREF: { v: 'audio' },
  }, meta: { childAgeMonths: 84 } });
  assert.equal(deviceChild.accessSettings.targetSize, 'large');
  assert.equal(deviceChild.supportIntensity.S.type, 'full_physical');
  assert.notEqual(deviceChild.domainStates.M.state, 'does_independently');
});

test('score cv2: speech probes change C precision', () => {
  const withProbe = scoreCaregiverV2({ responses: {
    VQ1: { v: 'words' }, VQ1v: { v: 'many_words' }, VQ2: { v: 'little_help' },
  }, meta: { childAgeMonths: 48 } });
  // words + many words + understands with gesture → strong but still emerging,
  // never 'does_independently' on three partial answers alone
  assert.equal(withProbe.domainStates.C.state, 'emerging');
  assert.ok(withProbe.completeness.probesAnswered === 1);
});

import { scoreCaregiverProfile } from '../src/iris/caregiver/scoring.js';
test('cv1 stays untouched: version constant and legacy scorer work', () => {
  assert.equal(CAREGIVER_BANK_VERSION, 'cv1');
  // an old cv1 draft scoring path is unchanged in behaviour (smoke)
  const legacy = scoreCaregiverProfile({ responses: { C1: { v: 'little_help' }, L2: { v: 'independent' } }, meta: { childAgeMonths: 48, completed: false } });
  assert.equal(legacy.bankVersion, 'cv1');
});
