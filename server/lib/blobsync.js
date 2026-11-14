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

const SNAPSHOT_KEY = 'iris-db/snapshot.sqlite';
let blob = null;
try {
  if (process.env.BLOB_READ_WRITE_TOKEN) blob = require('@vercel/blob');
} catch {
  blob = null;
}

// Local dev with a pulled token must NOT sync: it would push throwaway QA
// rows into the production snapshot. Only Vercel runtime (or an explicit
// BLOB_SYNC=1) activates the durable layer.
const active = !!blob && (process.env.VERCEL === '1' || process.env.BLOB_SYNC === '1');
console.log(`[blobsync] module loaded: sdk=${!!blob} active=${active} VERCEL=${process.env.VERCEL || '-'} token=${process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'unset'}`);
let dbPath = null;
let lastHash = null;
let timer = null;
let inflight = null;
let dirty = false;

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

/** Download the snapshot onto disk. Must be awaited before sequelize.sync. */
async function restore(fileStoragePath) {
  if (!active) return 'disabled';
  dbPath = fileStoragePath;
  try {
    // @vercel/blob v2 has no download(); resolve the private blob via
    // head() then fetch its signed download URL with the RW token.
    let hd = null;
    try {
      hd = await blob.head(SNAPSHOT_KEY);
    } catch (e) {
      if (e && (e instanceof blob.BlobNotFoundError || e.name === 'BlobNotFoundError')) hd = null;
      else throw e;
    }
    if (!hd || !hd.downloadUrl) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      return 'empty-store';
    }
    const res = await fetch(hd.downloadUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, buf);
    lastHash = md5(buf);
    console.log(`[blobsync] restored ${buf.length} bytes from snapshot`);
    return 'restored';
  } catch (e) {
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
  await blob.put(SNAPSHOT_KEY, buf, {
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  lastHash = hash;
  dirty = false;
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
  flushPending().finally(() => {
    if (mutating) {
      res.on('finish', () => {
        if (res.statusCode < 400) scheduleFlush();
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
    lastErr: global.__blobsyncLastErr || null,
    token: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'unset',
  };
}

module.exports = { active, restore, flushPending, scheduleFlush, flushNow, middleware, diagnostics };
