#!/usr/bin/env node
/* P71b STICKY-CLEAN WATCHER. Old warm prod instances may flush stale bytes
   over our cleaned snapshot once per instance until they self-heal (their
   next request fresh-installs the remote we just wrote). This loop watches
   the default key: if junk users come back, it re-pulls, re-cleans, re-pushes.
   Exits when 3 consecutive checks (60s apart) show the snapshot clean. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { put, head } from '@vercel/blob';

const KEY = 'iris-db/snapshot.sqlite';
const q = `
const sqlite3 = require('better-sqlite3');
`
; // (unused; python does the purge)
function cleanPull(local) {
  execFileSync('node', ['scripts/pull-prod-db.mjs', local], { stdio: 'inherit' });
}
function purgeReport(local) {
  const out = execFileSync('python3', ['-c', `
import sqlite3,sys
db = sqlite3.connect(${JSON.stringify(local)})
junk=[r[0] for r in db.execute("select id from Users where email like '%qa.test' or email like '%example.com' or email like '%example.test' or email like 'p61prod%' or email like '%probe.test'").fetchall()]
if junk:
    ph=','.join('?'*len(junk))
    jemails=[r[0] for r in db.execute(f"select email from Users where id in ({ph})",junk)]
    kids=[r[0] for r in db.execute(f"select id from Children where parentId in ({ph})",junk)]
    if kids:
        kph=','.join('?'*len(kids))
        for t in ['AssessmentRecords','ActivitySessions','CaregiverDrafts','LadderDrafts']:
            db.execute(f"delete from {t} where childId in ({kph})",kids)
    db.execute(f"delete from Children where parentId in ({ph})",junk)
    db.execute(f"delete from VerificationCodes where userId in ({ph})",junk)
    eph=','.join('?'*len(jemails))
    db.execute(f"delete from Sessions where email in ({eph})",jemails)
    db.execute(f"delete from Users where id in ({ph})",junk)
    db.commit()
print(len(junk), db.execute("select count(*) from Users").fetchone()[0])
`], { encoding: 'utf-8' });
  return out.trim();
}
async function snapshotState(local) {
  cleanPull(local);
  const out = execFileSync('python3', ['-c', `
import sqlite3
db = sqlite3.connect(${JSON.stringify(local)})
n = db.execute("select count(*) from Users where email like '%qa.test' or email like '%example.com' or email like '%example.test' or email like 'p61prod%' or email like '%probe.test'").fetchone()[0]
print(n, db.execute("select count(*) from Users").fetchone()[0])
`], { encoding: 'utf-8' });
  return out.trim(); // "junkCount total"
}
let cleanStreak = 0;
let ver = '';
for (let i = 0; i < 16; i++) {
  const h = await head(KEY);
  const local = '/tmp/watch.sqlite';
  const state = await snapshotState(local);
  const [junk, total] = state.split(' ').map(Number);
  const stamp = new Date().toISOString().slice(11, 19);
  if (junk > 0) {
    const rep = purgeReport(local);
    await put(KEY, readFileSync(local), { access: 'private', addRandomSuffix: false, allowOverwrite: true });
    console.log(stamp, `RE-CLEANED (${rep}) @`, h.uploadedAt);
    cleanStreak = 0;
  } else if (ver !== String(h.uploadedAt)) {
    console.log(stamp, `clean ${total} users, version moved (a real write?) @`, h.uploadedAt);
    ver = String(h.uploadedAt);
    cleanStreak++;
  } else {
    console.log(stamp, `clean ${total} users, same version`);
    cleanStreak++;
  }
  if (cleanStreak >= 3) { console.log('STICKY-CLEAN-OK'); break; }
  await new Promise((r) => setTimeout(r, 60000));
}
console.log('watch done, streak', cleanStreak);
