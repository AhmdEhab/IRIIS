/**
 * blobsync — makes the SQLite file durable on ephemeral (serverless) hosts.
 *
 * The problem: on Vercel the database is a plain SQLite file under /tmp,
 * which disappears whenever a function instance is recycled — accounts and
 * OTP rows would vanish. This module keeps ONE authoritative snapshot of
 * the file in Vercel Blob (private store, static RW token from the project
 * environment, never from code):
 *
 *   boot      → download() the snapshot (if any) and write it to disk
 *               BEFORE sequelize.sync() ever sees the file.
 *   mutation  → middleware schedules an upload after the response body was
 *               produced; in serverless the function stays alive while the
 *               event loop drains, and the next request also awaits any
 *               pending flush before running, so no write is left behind.
 *   identical content never re-uploads (md5 comparison).
 *
 * Safety rails:
 *  - Disabled entirely when no BLOB_READ_WRITE_TOKEN is present (plain
 *    local dev keeps using its local file untouched).
 *  - A failed restore is LOUD ([blobsync] errors) but never deletes a
 *    snapshot; a failed upload is retried once and reported.
 *  - Concurrent cold instances converge on last-writer-wins; for this MVP
 *    traffic (single parent per household) that is an accepted trade-off
 *    and is documented in docs/AUTH_FLOW_REPORT.md.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Overridable ONLY for local integration tests against the same blob
// store; production never sets it, so the real snapshot path is stable.
const SNAPSHOT_KEY = process.env.BLOB_SNAPSHOT_KEY || 'iris-db/snapshot.sqlite';
let blob = null;
try {
  if (process.env.BLOB_READ_WRITE_TOKEN) blob = require('@vercel/blob');
} catch {
  blob = null;
}

// Local dev with a pulled token must NOT sync: it would push throwaway QA
// rows into the production snapshot. Only Vercel runtime (or an explicit
// BLOB_SYNC=1) activates the durable layer.
// P71b HARD GUARD: a NON-Vercel process may never bind the DEFAULT
// production key, even with BLOB_SYNC=1 — that is how inherited QA-shell
// env once leaked test rows into prod and wiped QA mid-suite. Local test
// instances must set an explicit throwaway BLOB_SNAPSHOT_KEY (see
// scripts/qa-cross-instance.mjs) or blob sync stays off entirely.
let active = !!blob && (process.env.VERCEL === '1' || process.env.BLOB_SYNC === '1');
if (active && process.env.VERCEL !== '1' && !process.env.BLOB_SNAPSHOT_KEY) {
  console.error('[blobsync] GUARD: refusing DEFAULT production key off-Vercel; sync DISABLED (set BLOB_SNAPSHOT_KEY for tests)');
  active = false;
  blob = null;
}
// REMOTE DATABASE GUARD. When DB_PATH is a libsql/Turso URL (or any http(s)
// database URL) the data already lives outside the function's ephemeral disk,
// so there is no local file to snapshot. Leaving the blob layer on would try
// to fs.writeFileSync() onto a URL and fail on every cold start.
if (active && /^(libsql|https?):\/\//i.test(process.env.DB_PATH || '')) {
  console.log('[blobsync] DB_PATH is a remote database URL — snapshot layer DISABLED (database is already durable)');
  active = false;
  blob = null;
}
console.log(`[blobsync] module loaded: sdk=${!!blob} active=${active} VERCEL=${process.env.VERCEL || '-'} token=${process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'unset'}`);
let dbPath = null;
let lastHash = null;
let timer = null;
let inflight = null;
let dirty = false;
/* P69 CROSS-INSTANCE FRESHNESS. Vercel runs several warm function
   instances and pins nothing between requests. A snapshot downloaded at
   boot goes stale within seconds: a family could register on instance A
   and hit /verify/confirm on instance B — whose local file predates the
   account — so the CORRECT code is rejected with a generic error (and a
   B-side mutation could push B's stale file over A's writes, losing
   data). The fix: before every API request, cheaply HEAD the snapshot;
   if its version changed since we last saw it, re-download and hot-swap
   the SQLite file (closing pooled connections first via the freshHook).
   Every push also records the new remote version from put()'s reply, so
   an instance never re-pulls bytes it just wrote. */
let remoteVer = null; /* version of the snapshot bytes currently on OUR disk (null = never installed) */
let restoreErr = null; /* why the last restore failed, surfaced by /api/health */
let freshHook = null;
function onFresh(fn) { freshHook = fn; }
function versionOf(meta) {
  if (!meta) return null;
  return String(meta.etag || meta.uploadedAt || meta.addedTime || meta.lastModified || '');
}

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

/** Download the snapshot onto disk. Must be awaited before sequelize.sync. */
/**
 * Download the snapshot bytes from a head() result.
 *
 * `downloadUrl` for a private blob is already signed (`?token=…`), and the
 * signed URL is rejected with 403 when an Authorization header is added on
 * top — which is exactly what happened: head() found the blob, the download
 * answered "download HTTP 403", and every cold start fell back to an empty
 * database. So: try the signed URL as-is, and only fall back to the RW token
 * for stores whose URL is not pre-signed.
 */
async function downloadSnapshot(hd) {
  const plain = await fetch(hd.downloadUrl);
  if (plain.ok) return Buffer.from(await plain.arrayBuffer());
  const authed = await fetch(hd.downloadUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (authed.ok) return Buffer.from(await authed.arrayBuffer());
  throw new Error(`download HTTP ${authed.status}`);
}

async function restore(fileStoragePath) {
  if (!active) return 'disabled';
  dbPath = fileStoragePath;
  try {
    // @vercel/blob v2 has no download(); resolve the private blob via
    // head() then fetch its signed download URL with the RW token.
    const hd = await headSnapshot();
    if (!hd || !hd.downloadUrl) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      return 'empty-store';
    }
    const buf = await downloadSnapshot(hd);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, buf);
    lastHash = md5(buf);
    remoteVer = versionOf(hd);
    console.log(`[blobsync] restored ${buf.length} bytes from snapshot`);
    return 'restored';
  } catch (e) {
    /* Kept, not just logged: a silent 'error' left the deployment looking
       healthy while every cold start began from an empty database. Health now
       names the reason (invalid token, missing store, HTTP 403 …). */
    restoreErr = e.message;
    console.error('[blobsync] restore failed:', e.message);
    return 'error';
  }
}

async function uploadNow() {
  if (!active || !dbPath || !fs.existsSync(dbPath)) return;
  const buf = fs.readFileSync(dbPath);
  const hash = md5(buf);
  if (hash === lastHash) {
    dirty = false;
    return;
  }
  const put = await blob.put(SNAPSHOT_KEY, buf, {
    // The store is PRIVATE: every command must state access explicitly or
    // the SDK rejects the call ("access must be private or public").
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  lastHash = hash;
  remoteVer = versionOf(put) || remoteVer;
  dirty = false;
}

/* Download the newer remote snapshot and swap it in underneath the
 * database layer. freshHook must close pooled connections BEFORE we
 * overwrite the file (and clear -wal/-shm sidecars) so the next query
 * opens the fresh bytes instead of a handle over replaced ones.
 */
async function installRemote(hd) {
  const buf = await downloadSnapshot(hd);
  if (freshHook) await freshHook();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  for (const side of ['-wal', '-shm', '-journal']) {
    try { fs.rmSync(dbPath + side, { force: true }); } catch { /* ignore */ }
  }
  fs.writeFileSync(dbPath, buf);
  lastHash = md5(buf);
  remoteVer = versionOf(hd);
  console.log(`[blobsync] fresh-installed ${buf.length} bytes (cross-instance sync)`);
}

/** Cheap HEAD; if the world moved on, come along. */
async function ensureFresh() {
  if (!active || !dbPath) return;
  try {
    const hd = await headSnapshot();
    if (!hd || !hd.downloadUrl) return;
    const v = versionOf(hd);
    /* remoteVer is the version of the bytes WE HOLD ON DISK. Null means
       this instance never installed a snapshot (its file is a freshly
       synced empty store) - so the FIRST time we see a real remote
       version we must INSTALL it, not merely adopt the number. Boot
       restore sets the version itself whenever it downloads bytes. */
    if (remoteVer != null && v === remoteVer) return;
    await installRemote(hd);
  } catch (e) {
    // A failed freshness probe must NOT take the API down: serve local.
    console.error('[blobsync] ensureFresh failed:', e.message);
  }
}

/** Await any pending work before serving a new request (serverless-safe). */
async function flushPending() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!dirty && !inflight) return;
  try {
    if (inflight) await inflight;
    else await uploadNow();
  } catch (e) {
    console.error('[blobsync] flush failed, retrying once:', e.message);
    try { await uploadNow(); } catch (e2) { console.error('[blobsync] retry failed:', e2.message); }
  } finally {
    inflight = null;
  }
}

function scheduleFlush() {
  if (!active) return;
  dirty = true;
  if (inflight || timer) return;
  timer = setTimeout(() => {
    timer = null;
    inflight = uploadNow().catch((e) => {
      console.error('[blobsync] snapshot upload failed:', e.message);
      return uploadNow().catch((e2) => console.error('[blobsync] retry failed:', e2.message));
    }).finally(() => { inflight = null; });
  }, 400);
  if (timer.unref) timer.unref();
}

/**
 * Express middleware: after every SUCCESSFUL mutating API call, snapshot;
 * before every request, make sure the previous snapshot has been written.
 */
function middleware(req, res, next) {
  if (!active) return next();
  const mutating = req.method !== 'GET' && String(req.path || '').startsWith('/api');
  /* P71b ORDERING FIX. The old order (flush → fresh) let an instance whose
     local file predates an admin data-clean (or another instance's newer
     writes) RE-UPLOAD its stale bytes before it ever looked at the remote,
     clobbering the cleaned snapshot on every write it served. Now the
     remote is installed FIRST; a same-request pending flush is then either
     a no-op (disk equals remote, hashes match) or a genuinely newer
     local write, and the handler mutates on top of fresh bytes. */
  ensureFresh().then(flushPending).finally(() => {
    if (mutating) {
        res.on('finish', () => {
    if (req.method !== 'GET' && res.statusCode < 400) {
      dirty = true;
      scheduleFlush();
      // The debounce timer may NEVER run: serverless freezes the instance
      // the moment it has no pending work, so the last mutation before the
      // freeze would stay only in /tmp. Hand the upload to the platform's
      // waitUntil (kept alive after the response) when available, else
      // fire-and-forget the promise — either way the next request's
      // pre-flush remains the backstop and hashes dedupe double uploads.
      const wu = typeof globalThis.waitUntil === 'function' ? globalThis.waitUntil : null;
      if (wu) { try { wu(flushNow()); } catch { /* ignore */ } }
      else { flushNow().catch(() => {}); }
    }
  });
    }
    next();
  });
}

/** Awaited upload used by critical routes before responding (serverless
 *  cannot rely on post-response timers). Safe to call anywhere. */
async function flushNow() {
  if (!active) return;
  try { await uploadNow(); global.__blobsyncLastErr = null; } catch (e) {
    console.error('[blobsync] flushNow failed:', e.message);
    try { await uploadNow(); global.__blobsyncLastErr = null; }
    catch (e2) { global.__blobsyncLastErr = String(e2 && e2.message || e2); console.error('[blobsync] flushNow retry failed:', e2.message); }
  }
}

function diagnostics() {
  return {
    active,
    dbPath,
    dbExists: dbPath ? fs.existsSync(dbPath) : false,
    dbSize: dbPath && fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
    hasUploaded: !!lastHash,
    dirty,
    remoteVer,
    restoreErr,
    lastErr: global.__blobsyncLastErr || null,
    token: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'unset',
  };
}

module.exports = { active, restore, flushPending, scheduleFlush, flushNow, middleware, diagnostics, onFresh };

/**
 * HEAD the snapshot, in the store's own access mode.
 *
 * The store is PRIVATE — `uploadNow()` already passes `access: 'private'` to
 * `put()` for exactly that reason. `head()` needs the same statement, and it
 * was the one call that did not make it: on a private store the SDK rejects a
 * bare `head()` with an "access" error, which is neither BlobNotFoundError nor
 * anything the restore path knew how to read, so `restore()` returned 'error'
 * on every cold start. The visible symptom was the worst kind: an account was
 * created, worked while that instance lived, and was gone after the next
 * deployment — the SQLite file is /tmp, and the snapshot that was supposed to
 * outlive it was never downloaded.
 *
 * Public stores (older deployments) still work: the private attempt fails
 * with the access error and the public one is tried next. A genuinely absent
 * blob returns null from both.
 */
async function headSnapshot() {
  const attempt = async (access) => {
    try {
      return await blob.head(SNAPSHOT_KEY, { access });
    } catch (e) {
      if (e && (e instanceof blob.BlobNotFoundError || e.name === 'BlobNotFoundError')) return null;
      throw e;
    }
  };
  try {
    return await attempt('private');
  } catch (e) {
    if (process.env.BLOBSYNC_DEBUG) console.error('[blobsync] private head failed:', e.message);
    return attempt('public');
  }
}
