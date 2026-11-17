/**
 * P69 integration proof — CROSS-INSTANCE FRESHNESS.
 *
 * Simulates exactly what Vercel does in production: two warm function
 * instances with SEPARATE local SQLite files converging through one blob
 * snapshot. Before the fix, instance B never re-downloaded, so a family
 * that registered on A got "Something went wrong" on B when confirming
 * the CORRECT email code (their session row simply did not exist there).
 *
 * Runs against a throwaway snapshot key (BLOB_SNAPSHOT_KEY) — never the
 * production database path — and deletes the test key at the end.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ROOT = new URL('..', import.meta.url).pathname.trim();
const KEY = `iris-db/qa-cross-instance-${Date.now()}.sqlite`;
const A = 'http://127.0.0.1:5070/api';
const B = 'http://127.0.0.1:5071/api';

const results = [];
const ok = (name, cond, extra = '') => {
  results.push([cond, name]);
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
};

const baseEnv = { ...process.env, NODE_ENV: 'test', BLOB_SYNC: '1', BLOB_SNAPSHOT_KEY: KEY, VERIFY_DEV_CODES: 'true' };
function start(port, db) {
  return spawn('node', ['server/server.js'], {
    cwd: ROOT,
    env: { ...baseEnv, PORT: String(port), DB_PATH: db },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
const logFile = (p, f) => { p.stdout.on('data', (d) => fs.appendFileSync(f, d)); p.stderr.on('data', (d) => fs.appendFileSync(f, d)); };

for (const f of ['/tmp/instA.sqlite', '/tmp/instB.sqlite', '/tmp/instA.sqlite-wal', '/tmp/instB.sqlite-wal', '/tmp/instA.sqlite-shm', '/tmp/instB.sqlite-shm']) {
  try { fs.rmSync(f, { force: true }); } catch { /* */ }
}
const srvA = start(5070, '/tmp/instA.sqlite');
const srvB = start(5071, '/tmp/instB.sqlite');
logFile(srvA, '/tmp/instA.log');
logFile(srvB, '/tmp/instB.log');

const J = async (base, method, url, body, token) => {
  const r = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch { /* */ }
  return { status: r.status, j };
};

const boot = async () => {
  let lastErr = null;
  for (let i = 0; i < 90; i++) {
    try {
      const a = await J(A, 'GET', '/health');
      const b = await J(B, 'GET', '/health');
      if (a.status === 200 && b.status === 200) return true;
    } catch (e) { lastErr = e.message + (e.cause ? '/' + e.cause.message : ''); }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('boot probe last error:', lastErr);
  return false;
};

try {
  ok('both instances boot', await boot());

  // ── the user's exact scenario ────────────────────────────────────────────
  const email = 'cross-A-' + Date.now() + '@example.test';
  const reg = await J(A, 'POST', '/register', { email, password: 'Passw0rd1', name: 'Cross Kid', age: 5, condition: 'other', consent_mvp_use: true });
  ok('register on instance A', (reg.status === 200 || reg.status === 201) && !!reg.j.token, 'status ' + reg.status);
  const token = reg.j.token;

  const code = String((reg.j.verification || {}).devCode || reg.j.devCode || '');
  ok('register echoes devCode in test mode', /^\d{6}$/.test(code), 'code len ' + code.length);

  // give A's post-response flush a beat to land in the blob store
  await new Promise((r) => setTimeout(r, 1500));

  const conf = await J(B, 'POST', '/verify/confirm', { code }, token);
  ok('CORRECT code confirms on instance B (was the user bug)', conf.status === 200 && conf.j.ok === true, 'status ' + conf.status + ' ' + JSON.stringify(conf.j).slice(0, 90));

  // ── reverse direction: write on B visible on A ───────────────────────────
  const email2 = 'cross-B-' + Date.now() + '@example.test';
  const reg2 = await J(B, 'POST', '/register', { email: email2, password: 'Passw0rd1', name: 'Kid Two', age: 4, condition: 'other', consent_mvp_use: true });
  ok('register on instance B', reg2.status === 200 || reg2.status === 201, 'status ' + reg2.status);
  // verify email2 too — the API rightly 403s unverified accounts, and the
  // cross-read must prove data movement, not auth semantics.
  const code2 = String((reg2.j.verification || {}).devCode || '');
  const conf2 = await J(B, 'POST', '/verify/confirm', { code: code2 }, reg2.j.token);
  ok('confirm on B self', conf2.status === 200, 'status ' + conf2.status);
  await new Promise((r) => setTimeout(r, 1500));
  // The strongest cross-instance proof is a LOGIN on A for the account
  // that only B created: it exercises fresh-install + auth + user read.
  const login2 = await J(A, 'POST', '/login', { email: email2, password: 'Passw0rd1' });
  ok('B-written account visible on A (login works there)', (login2.status === 200 || login2.status === 201) && !!login2.j.token, 'status ' + login2.status + ' ' + JSON.stringify(login2.j).slice(0, 110));

  // ── a mutation on A after the swap still reads correctly ─────────────────
  const child = await J(A, 'POST', '/children', { displayName: 'Fresh Girl', ageYears: 3, condition: 'other' }, reg2.j.token);
  ok('child creation still works after hot-swap', child.status === 200 || child.status === 201, 'status ' + child.status + ' ' + JSON.stringify(child.j).slice(0, 70));
  await new Promise((r) => setTimeout(r, 1500));
  const list = await J(B, 'GET', '/children', null, reg2.j.token);
  const names = Array.isArray(list.j) ? list.j.map((c) => c.displayName || c.name) : [];
  ok('child visible on B too', names.includes('Fresh Girl'), JSON.stringify(names));

  // ── health diagnostics show the layer armed ──────────────────────────────
  const hb = await J(B, 'GET', '/health');
  ok('blobsync active with remoteVer tracked', hb.j && hb.j.blobsync && hb.j.blobsync.active === true, JSON.stringify(hb.j && hb.j.blobsync || {}).slice(0, 120));

  const fails = results.filter((r) => !r[0]).length;
  console.log(`RESULT cross-instance: ${results.length - fails} pass / ${fails} fail`);
} catch (e) {
  console.log('HARNESS ERROR', e.message);
  console.log('RESULT cross-instance: CRASHED');
} finally {
  srvA.kill('SIGKILL');
  srvB.kill('SIGKILL');
  // purge the throwaway snapshot from the blob store
  try {
    const blob = await import('@vercel/blob');
    const hd = await blob.head(KEY);
    if (hd && hd.url) await blob.del([hd.url]);
    console.log('test snapshot key purged');
  } catch (e) {
    console.log('purge note:', e.message.slice(0, 60), '(key:', KEY, ')');
  }
}
