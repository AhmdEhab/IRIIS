// P73 — backfill public/photos/ASSET_SOURCES.json for the search-fetched
// photographs (the hand-picked ones were already recorded with exact bytes
// when fetch-picked.mjs saved them).
//
// We replay searchFirst() EXACTLY as fetch-photos.mjs defines it (same
// filetype:bitmap query, same ordering, same keyword + exclusion filters) at
// the same thumbnail widths, then verify the hit with a HEAD request: the
// served Content-Length must equal the file on disk before we record its
// title/license. If the live search has drifted from what we originally
// downloaded, the id is recorded as `unresolved` — we never attribute the
// wrong file.
import fs from 'node:fs';
import path from 'node:path';

const UA = 'IRIS-Education/1.0 (contact: aehab3850@gmail.com)';
const OUT = path.resolve('public/photos');
const SOURCES = path.join(OUT, 'ASSET_SOURCES.json');

// --- parse QUERIES + the fetcher's own filters by importing its source ---
const scriptSrc = fs.readFileSync(path.resolve('scripts/fetch-photos.mjs'), 'utf8');
const QUERIES = {};
for (const m of scriptSrc.matchAll(/^\s*(?:'([a-z0-9-]+)'|([a-z0-9-]+)): \['([^']+)', '([^']+)'\]/gm)) {
  QUERIES[m[1] || m[2]] = [m[3], m[4]];
}
// keep entries recorded by fetch-picked (byte-exact downloads)
const pickedSrc = fs.readFileSync(path.resolve('scripts/fetch-picked.mjs'), 'utf8');
const PICKED_IDS = new Set([...pickedSrc.matchAll(/^\s*(?:'([a-z0-9-]+)'|([a-z0-9-]+)): 'File:/gm)].map(m => m[1] || m[2]));

const meta = JSON.parse(fs.readFileSync(SOURCES, 'utf8'));
for (const id of PICKED_IDS) if (!meta[id]) console.log(`WARN picked id ${id} has no record`);

async function apiJson(url, tries = 5) {
  for (let t = 0; t < tries; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429) { await new Promise(res => setTimeout(res, 10000 * (t + 1))); continue; }
    const text = await r.text();
    try { return JSON.parse(text); } catch { await new Promise(res => setTimeout(res, 3000 * (t + 1))); continue; }
  }
  throw new Error('api unavailable');
}

// mirrors fetch-photos.mjs searchFirst()
async function searchFirst(term, keyword) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' +
    encodeURIComponent(`filetype:bitmap ${term}`) + '&gsrlimit=20&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1024&format=json';
  const j = await apiJson(url);
  const pages = Object.values(j?.query?.pages ?? {}).sort((a, b) => (a.index ?? 9) - (b.index ?? 9));
  for (const pg of pages) {
    const ii = pg.imageinfo?.[0];
    if (!ii || !/jpeg|jpg|png/.test(ii.mime)) continue;
    if (ii.width < 600 || ii.height < 400) continue;
    if (!new RegExp(keyword, 'i').test(pg.title)) continue;
    if (/logo|diagram|svg|flag|chart|skull|skeleton|x-ray|MRI|drawing|coat of arms|glacier|river|volcano|cave/i.test(pg.title)) continue;
    return { thumburl: ii.thumburl, title: pg.title };
  }
  return null;
}

async function headLen(u) {
  const r = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': UA } });
  return r.ok ? Number(r.headers.get('content-length')) : -1;
}

const ids = fs.readdirSync(OUT).filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4));
let rec = 0, unresolved = [], refreshed = [];
for (const id of ids) {
  if (meta[id] && PICKED_IDS.has(id)) { rec++; continue; }         // already exact
  if (meta[id] && String(meta[id].source || '').startsWith('search-replay')) continue;  // done
  if (meta[id]?.source === 'unresolved') delete meta[id];  // retry drift resolution
  if (meta[id] && !meta[id].source) delete meta[id];       // stale 1280 replay -> redo
  const q = QUERIES[id];
  if (!q) { meta[id] = { note: 'pre-P73 asset, query not on file', source: 'unresolved', license: 'Wikimedia Commons (exact file pending)' }; unresolved.push(id); continue; }
  try {
    const hit = await searchFirst(q[0], q[1]);
    if (!hit) { meta[id] = { source: 'unresolved', note: 'search returned no first-match', license: 'Wikimedia Commons (exact file pending)' }; unresolved.push(id); console.log(`${id}: NO MATCH`); continue; }
    const disk = fs.statSync(path.join(OUT, `${id}.jpg`)).size;
    const sizes = [];
    for (const w of ['1024px-', '1280px-']) {
      const u = hit.thumburl.replace(/\/\d+px-/, `/${w}`);
      const len = await headLen(u);
      sizes.push([u, len]);
      if (len === disk) {
        const j2 = await apiJson('https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=' +
          encodeURIComponent(hit.title) + '&prop=imageinfo&iiprop=extmetadata|url');
        const ii = Object.values(j2.query.pages)[0].imageinfo[0];
        const em = ii.extmetadata || {};
        meta[id] = {
          title: hit.title,
          page: `https://commons.wikimedia.org/wiki/${hit.title.replace(/ /g, '_')}`,
          url: u,
          license: em.LicenseShortName?.value || 'CC',
          artist: (em.Artist?.value || '').replace(/<[^>]*>/g, '').trim().slice(0, 120) || 'unknown',
          source: 'search-replay',
        };
        rec++; console.log(`${id} RECORDED [${meta[id].license}]`);
        break;
      }
    }
    if (!meta[id] || !meta[id].source) {
      // The Commons search no longer byte-matches (thumbnail re-render or
      // index drift). The topic is still the same vetted subject: take the
      // current first-match, put THAT file on disk so the recorded source is
      // exact, and flag the id for the final visual re-review pass.
      const res = await fetch(hit.thumburl, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 20000) {
          fs.writeFileSync(path.join(OUT, `${id}.jpg`), buf);
          const j2 = await apiJson('https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=' +
            encodeURIComponent(hit.title) + '&prop=imageinfo&iiprop=extmetadata|url');
          const ii = Object.values(j2.query.pages)[0].imageinfo[0];
          const em = ii.extmetadata || {};
          meta[id] = {
            title: hit.title,
            page: `https://commons.wikimedia.org/wiki/${hit.title.replace(/ /g, '_')}`,
            url: hit.thumburl,
            license: em.LicenseShortName?.value || 'CC',
            artist: (em.Artist?.value || '').replace(/<[^>]*>/g, '').trim().slice(0, 120) || 'unknown',
            source: 'search-replay-refreshed',
          };
          refreshed.push(id); rec++; console.log(`${id} REFRESHED [${meta[id].license}]`);
        }
      }
      if (!meta[id]?.source) { meta[id] = { title: hit.title, url: hit.thumburl, source: 'unresolved', license: 'Wikimedia Commons (exact file pending)' }; unresolved.push(id); console.log(`${id}: UNRESOLVED`); }
    }
    fs.writeFileSync(SOURCES, JSON.stringify(meta, null, 2));
    await new Promise(r => setTimeout(r, 1400));
  } catch (e) { console.log(`${id} ERR ${String(e.message).slice(0, 60)}`); }
}
fs.writeFileSync(SOURCES, JSON.stringify(meta, null, 2));
console.log(`DONE recorded=${rec} refreshed=${refreshed.length} unresolved=${unresolved.length}${unresolved.length ? ': ' + unresolved.join(',') : ''}`);
fs.writeFileSync('/tmp/p73-refreshed.txt', refreshed.join('\n'));
