/* Dev-only: pull the production SQLite snapshot from Vercel Blob for
 * read-only incident forensics. Usage (with BLOB_READ_WRITE_TOKEN set):
 *   node scripts/pull-prod-db.mjs [outPath] */
import { head } from '@vercel/blob';
import { writeFileSync } from 'node:fs';

const KEY = 'iris-db/snapshot.sqlite';
const out = process.argv[2] || '/tmp/prod-snapshot.sqlite';
const hd = await head(KEY);
const res = await fetch(hd.downloadUrl || hd.url, {
  headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
});
if (!res.ok) { console.error('download failed', res.status); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(out, buf);
console.log('wrote', out, buf.length, 'bytes; blob uploadedAt =', hd.uploadedAt);
