#!/usr/bin/env node
/* P69 PRODUCTION PROBE: after the blobsync freshness fix, a login for a
   freshly-registered account must succeed no matter which Vercel instance
   answers. Register once, then hammer login 12 times; every answer is a
   potential (cold or warm) instance. A single failure means some instance
   served a stale snapshot. Also asserts /api/health reports blobsync
   active with a tracked remote version. Never prints secrets. */
const O = 'https://iris-kohl-seven.vercel.app';
const API = `${O}/api`;

const J = async (m, p, b, t) => {
  const r = await fetch(API + p, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) },
    body: b ? JSON.stringify(b) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch { /* html */ }
  return { status: r.status, j };
};

let pass = 0, fail = 0;
const ok = (c, n, d = '') => { console.log(`${c ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`); c ? pass++ : fail++; };

const h = await J('GET', '/health');
ok(h.status === 200 && h.j && h.j.blobsync && h.j.blobsync.active === true,
  'health: blobsync active', JSON.stringify(h.j && h.j.blobsync || {}).slice(0, 140));
ok(h.j && h.j.blobsync && (h.j.blobsync.remoteVer !== undefined),
  'health: freshness fields exposed');

const email = `xinst-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
const reg = await J('POST', '/register', { email, password: 'Passw0rd1!', name: 'Probe Kid', age: 4, condition: 'other', consent_mvp_use: true });
ok(reg.status === 201 || reg.status === 200, 'register on prod', 'status ' + reg.status);

// Immediate cross-instance reads. No sleep: the worst case is the first
// request that lands on another warm instance right after the write.
let firstBad = null;
for (let i = 0; i < 12; i++) {
  const l = await J('POST', '/login', { email, password: 'Passw0rd1!' });
  if (l.status !== 200 && l.status !== 201) { firstBad = firstBad || `#${i}: ${l.status} ${JSON.stringify(l.j).slice(0, 80)}`; }
}
ok(!firstBad, '12 consecutive logins (any instance) all succeed', firstBad || 'all 200');

// The registered session's own child write + cross read from other instances
if (reg.j && reg.j.token) {
  const ch = await J('POST', '/children', { displayName: 'XProbe', ageYears: 4, condition: 'other' }, reg.j.token);
  ok(ch.status === 201 || ch.status === 200, 'child create', 'status ' + ch.status);
  let bad = null;
  for (let i = 0; i < 8; i++) {
    const list = await J('GET', '/children', null, reg.j.token);
    if (!(list.j || []).some((c) => c.displayName === 'XProbe')) { bad = bad || `#${i}: ${JSON.stringify(list.j).slice(0, 80)}`; }
  }
  ok(!bad, '8 child lists across instances all contain new child', bad || 'ok');
}

console.log(`RESULT prod-cross-instance: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
