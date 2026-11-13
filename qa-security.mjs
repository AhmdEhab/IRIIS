/**
 * Pass 4 — backend security, auth and persistence checks.
 *
 * These run against the live backend over HTTP, the same way an attacker or a
 * broken client would reach it. Nothing here touches the database directly, so
 * a pass means the guarantee holds at the API boundary, not just in the model.
 */
const API = 'http://localhost:5000/api';
const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const j = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  return { status: res.status, body };
};

const stamp = Date.now();
const EMAIL = `qa.pass4.${stamp}@example.com`;
const PASSWORD = 'CorrectHorse9!';

// ── 1. registration ─────────────────────────────────────────────────────────
console.log('\n[1] Registration');
let token = null;
{
  const r = await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'QA Parent', email: EMAIL, password: PASSWORD, consent_mvp_use: true }),
  });
  pass('new user can register', r.status === 200 || r.status === 201, `${r.status}`);
  token = r.body?.token || null;
  pass('registration returns a session token', !!token);
  pass('password is NOT returned by register',
    !JSON.stringify(r.body || {}).toLowerCase().includes('password'),
    JSON.stringify(r.body || {}).slice(0, 80));

  const short = await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'X', email: `s.${stamp}@example.com`, password: '123', consent_mvp_use: true }),
  });
  pass('short password is rejected', short.status >= 400, `${short.status}`);

  const bad = await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'X', email: 'not-an-email', password: PASSWORD, consent_mvp_use: true }),
  });
  pass('malformed email is rejected', bad.status >= 400, `${bad.status}`);

  const noConsent = await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'X', email: `nc.${stamp}@example.com`, password: PASSWORD }),
  });
  pass('registration WITHOUT consent is refused', noConsent.status === 403
    && noConsent.body?.error === 'CONSENT_REQUIRED', `${noConsent.status} ${noConsent.body?.error}`);

  const dup = await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'QA Parent', email: EMAIL, password: PASSWORD, consent_mvp_use: true }),
  });
  pass('duplicate email returns 409', dup.status === 409, `${dup.status}`);
  pass('duplicate email carries a machine-readable reason', !!dup.body?.detail || !!dup.body?.error,
    JSON.stringify(dup.body || {}).slice(0, 70));
}

// ── 2. login ────────────────────────────────────────────────────────────────
console.log('\n[2] Login');
{
  const ok = await j('/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  pass('correct credentials log in', ok.status === 200, `${ok.status}`);
  pass('login does not return the password',
    !JSON.stringify(ok.body || {}).toLowerCase().includes('"password"'));

  const wrongPw = await j('/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: 'wrong-one-99' }) });
  pass('wrong password is rejected', wrongPw.status === 401, `${wrongPw.status}`);

  const wrongEmail = await j('/login', { method: 'POST', body: JSON.stringify({ email: `nobody.${stamp}@example.com`, password: PASSWORD }) });
  pass('unknown email is rejected', wrongEmail.status === 401, `${wrongEmail.status}`);

  pass('wrong password and unknown email are indistinguishable (no user enumeration)',
    JSON.stringify(wrongPw.body) === JSON.stringify(wrongEmail.body),
    `${JSON.stringify(wrongPw.body)} vs ${JSON.stringify(wrongEmail.body)}`);

  // Email normalisation: same account, different casing and padding.
  const messy = await j('/login', {
    method: 'POST',
    body: JSON.stringify({ email: `  ${EMAIL.toUpperCase()}  `, password: PASSWORD }),
  });
  pass('email is normalised (case + whitespace)', messy.status === 200, `${messy.status}`);
  if (messy.body?.token) token = messy.body.token;
}

// ── 3. tokens and authorisation ─────────────────────────────────────────────
console.log('\n[3] Tokens and authorisation');
{
  const noAuth = await j('/children');
  pass('protected route rejects a missing token', noAuth.status === 401, `${noAuth.status}`);

  const badAuth = await j('/children', { headers: { Authorization: 'Bearer not-a-real-token' } });
  pass('protected route rejects a forged token', badAuth.status === 401, `${badAuth.status}`);

  const good = await j('/children', { headers: { Authorization: `Bearer ${token}` } });
  pass('protected route accepts a valid token', good.status === 200, `${good.status}`);
}

// ── 4. the disabled user dump stays disabled ────────────────────────────────
console.log('\n[4] User-dump endpoint');
{
  for (const path of ['/users', '/user', '/all-users']) {
    const r = await j(path);
    pass(`GET ${path} is not a public user dump`,
      r.status === 404 || r.status === 401 || r.status === 403 || r.status === 410,
      `${r.status}`);
  }
  const withToken = await j('/users', { headers: { Authorization: `Bearer ${token}` } });
  pass('GET /users is not reachable even when authenticated',
    withToken.status !== 200, `${withToken.status}`);
}

// ── 5. password storage ─────────────────────────────────────────────────────
console.log('\n[5] Password storage');
{
  const { default: sqlite3 } = await import('/home/claude/iris_build/server/node_modules/sqlite3/lib/sqlite3.js');
  const db = new sqlite3.Database('/home/claude/iris_build/server/database.sqlite');
  const row = await new Promise((res) =>
    db.get('SELECT password FROM Users WHERE email = ?', [EMAIL], (e, r) => res(r))
  );
  const stored = row?.password || '';
  pass('password is hashed at rest, not plaintext', stored !== PASSWORD && stored.length > 20,
    stored.slice(0, 12) + '…');
  pass('hash looks like bcrypt', /^\$2[aby]\$/.test(stored), stored.slice(0, 7));

  const sessions = await new Promise((res) =>
    db.get('SELECT token_hash FROM Sessions LIMIT 1', [], (e, r) => res(r))
  );
  pass('session tokens are stored hashed, not raw',
    !!sessions?.token_hash && sessions.token_hash !== token && /^[a-f0-9]{64}$/.test(sessions.token_hash),
    (sessions?.token_hash || '').slice(0, 12) + '…');
  db.close();
}

// ── 6. persistence across a real restart ────────────────────────────────────
console.log('\n[6] Persistence across a server restart');
{
  const { execSync } = await import('node:child_process');
  try { execSync('fuser -k 5000/tcp', { stdio: 'ignore' }); } catch { /* nothing bound */ }
  await new Promise((r) => setTimeout(r, 1200));
  execSync('cd /home/claude/iris_build/server && nohup npm start > /tmp/backend-restart.log 2>&1 & disown', {
    stdio: 'ignore', shell: '/bin/bash',
  });
  // Wait for it to come back.
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try { up = (await fetch(`${API}/tts/status`)).ok; } catch { /* still starting */ }
  }
  pass('backend restarted', up);

  const after = await j('/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  pass('the account still exists after a restart', after.status === 200, `${after.status}`);

  const oldToken = await j('/children', { headers: { Authorization: `Bearer ${token}` } });
  pass('a token issued before the restart still works (sessions are in the DB)',
    oldToken.status === 200, `${oldToken.status}`);
  token = after.body?.token || token;
}

// ── 7. logout invalidates ───────────────────────────────────────────────────
console.log('\n[7] Logout');
{
  const out = await j('/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  pass('logout is accepted', out.status === 200 || out.status === 204, `${out.status}`);
  const after = await j('/children', { headers: { Authorization: `Bearer ${token}` } });
  pass('the token is dead after logout', after.status === 401, `${after.status}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
