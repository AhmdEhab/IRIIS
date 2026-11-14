// P56 part 3 — survival of REAL verified accounts across a cold redeploy.
// Enriches Y and X (children + one ladder assessment each), takes a
// snapshot of state through the API, then (after the caller redeploys)
// re-reads everything from the FRESH instance and compares.
const U = 'https://iris-kohl-seven.vercel.app';
const fs = require('fs');
const state = JSON.parse(fs.readFileSync('/tmp/e2e_state.json', 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { if (c) { pass++; console.log('  PASS ' + n); } else { fail++; console.log('  FAIL ' + n + (e ? ' :: ' + String(e).slice(0, 160) : '')); } };

async function api(path, opts = {}, token) {
  const r = await fetch(U + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

(async () => {
  const phase = process.argv[2] || 'seed';
  if (phase === 'seed') {
    // fresh logins (tokens from registration may predate later resends)
    for (const who of ['Y', 'X']) {
      const acc = state[who];
      const lg = await api('/api/login', { method: 'POST', body: { email: acc.email, password: acc.password } });
      ok(who + ' login 200 (seed phase)', lg.status === 200, JSON.stringify(lg.json).slice(0, 120));
      if (lg.status !== 200) continue;
      acc.token = lg.json.token;
      ok(who + ' shows emailVerified=true', lg.json.user.emailVerified === true);
      acc.verified = lg.json.user.emailVerified === true;
    }
    // one extra child for Y + an assessment for each parent's first child
    const ch = await api('/api/children', { method: 'POST', body: { displayName: 'Durability Kid', age: 5, condition: 'other' } }, state.Y.token);
    ok('Y second child created', ch.status === 201 && ch.json.id > 0, JSON.stringify(ch.json).slice(0, 120));
    state.Y.kids = [state.Y.kid, ch.json.id];
    // Real contract (server.js /api/assessments): assessment_kind LADDER +
    // the JSON columns; anything else silently stores blanks.
    const mk = (marker, level) => ({
      childId: 0, assessment_kind: 'LADDER',
      domain_scores: { letter_knowledge: level, phonological: level + 1, counting: level },
      item_results: { items: 12, correct: 9, marker },
      skill_estimates: { starting_step: 14 + level },
      learning_priorities: ['letter_sounds', 'counting'],
      confidence: { overall: 0.82 },
      rule_pack_version: 'mvp-1.0.0',
    });
    const bodyY = mk('SEED-Y-' + Date.now(), 3); bodyY.childId = state.Y.kid;
    const bodyX = mk('SEED-X-' + Date.now(), 2); bodyX.childId = state.X.kid;
    const asY = await api('/api/assessments', { method: 'POST', body: bodyY }, state.Y.token);
    const asX = await api('/api/assessments', { method: 'POST', body: bodyX }, state.X.token);
    ok('Y assessment stored', asY.status === 201 && asY.json.id > 0, JSON.stringify(asY.json).slice(0, 120));
    ok('X assessment stored', asX.status === 201 && asX.json.id > 0, JSON.stringify(asX.json).slice(0, 120));
    state.markerY = bodyY.item_results.marker; state.recY = asY.json && asY.json.id;
    state.markerX = bodyX.item_results.marker; state.recX = asX.json && asX.json.id;
    console.log('  seeded markers:', state.markerY, '|', state.markerX);
    fs.writeFileSync('/tmp/e2e_state.json', JSON.stringify(state));
    console.log('SEED DONE — redeploy now, then run verify phase');
  } else {
    for (const who of ['Y', 'X']) {
      const acc = state[who];
      const lg = await api('/api/login', { method: 'POST', body: { email: acc.email, password: acc.password } });
      ok('AFTER REDEPLOY: ' + who + ' login 200', lg.status === 200, JSON.stringify(lg.json).slice(0, 140));
      if (lg.status !== 200) continue;
      const tk = lg.json.token;
      ok(who + ' emailVerified persisted', lg.json.user.emailVerified === true);
      const kids = await api('/api/children', {}, tk);
      const n = who === 'Y' ? 2 : 1;
      ok(who + ' children survived (' + n + ')', Array.isArray(kids.json) ? kids.json.length >= n : (kids.json && kids.json.children ? kids.json.children.length >= n : false), JSON.stringify(kids.json).slice(0, 140));
      const list = kids.json && kids.json.children ? kids.json.children : kids.json;
      const all = [];
      if (Array.isArray(list)) {
        for (const k of list) {
          const as = await api('/api/assessments/' + k.id, {}, tk);
          if (Array.isArray(as.json)) all.push(...as.json);
        }
      }
      const marker = state['marker' + who];
      ok(who + ' some assessment survived', all.length >= 1, JSON.stringify(all).slice(0, 120));
      const mine = all.find((r) => r.item_results && r.item_results.marker === marker) || null;
      ok(who + ' assessment round-trips marker + JSON columns (marker=' + marker + ')', !!mine && mine.assessment_kind === 'LADDER' && (mine.learning_priorities || []).length === 2, JSON.stringify(mine).slice(0, 140) || 'no match');
    }
  }
  console.log(`RESULT part3(${phase}): ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
