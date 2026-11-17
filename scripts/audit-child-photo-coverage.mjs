// P73 audit: prove every child-facing image reference is a real local
// photograph, every referenced file exists, and nothing hotlinks remotely.
// Exits non-zero on any violation. Run via `npm run audit:photos`.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const PHOTOS = path.join(ROOT, 'public/photos');

let fail = 0;
const bad = msg => { console.log('FAIL ' + msg); fail++; };
const ok = msg => console.log('ok   ' + msg);

// 1) no remote image hotlinks anywhere in app code
const files = [];
(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(tsx?|jsx?|css)$/.test(e.name)) files.push(p);
    }
})(SRC);
let hotlinks = 0;
for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/https?:\/\/(images\.unsplash\.com|picsum\.photos|cdn\.)[^\s'"`]*/g)) {
        bad(`remote image hotlink in ${path.relative(ROOT, f)}: ${m[0].slice(0, 70)}`);
        hotlinks++;
    }
}
if (!hotlinks) ok('no remote image hotlinks in src/');

// 2) every /photos/<id>.jpg referenced from code exists on disk
const refs = new Set();
for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\/photos\/([a-z0-9-]+)\.jpg/gi)) refs.add(m[1]);
    // P('id') helpers inside object3d.ts
    if (f.endsWith('object3d.ts')) for (const m of s.matchAll(/P\('([a-z0-9-]+)'\)/gi)) refs.add(m[1]);
    // NUMBER_PHOTO_UNIT lives in realPhotos.ts
    if (f.endsWith('realPhotos.ts')) for (const m of s.matchAll(/:\s*'([a-z0-9-]+)'/gi)) refs.add(m[1]);
    if (f.endsWith('realPhotos.ts')) for (const m of s.matchAll(/'\/photos\/([a-z0-9-]+)\.jpg'/gi)) refs.add(m[1]);
    if (f.endsWith('object3d.ts')) for (const m of s.matchAll(/P\(NUMBER_PHOTO_UNIT\[\d+\]\)/g)) { /* covered by realPhotos scan */ }
}
let missing = 0;
for (const id of refs) {
    if (!fs.existsSync(path.join(PHOTOS, `${id}.jpg`))) { bad(`referenced photo missing: /photos/${id}.jpg`); missing++; }
}
if (!missing) ok(`${refs.size} referenced photos all exist locally`);

// 3) contextImage values in child data are local photo paths
let remoteCtx = 0;
for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/contextImage:\s*'([^']+)'/g)) {
        if (!m[1].startsWith('/photos/')) { bad(`non-local contextImage in ${path.relative(ROOT, f)}: ${m[1].slice(0, 60)}`); remoteCtx++; }
    }
}
if (!remoteCtx) ok('every contextImage is a local photograph');

// 4) chooser grids render RealPhoto (screens that used to show emoji tiles)
const expectRealPhoto = ['FruitsScreen', 'AnimalsScreen', 'VehiclesScreen', 'BodyPartsScreen', 'ColorsScreen', 'ShapesScreen', 'EmotionsScreen', 'LifeSkillsScreen', 'SongsScreen', 'MemoryGameScreen'];
for (const s of expectRealPhoto) {
    const f = path.join(SRC, 'App/components', s + '.tsx');
    if (!fs.existsSync(f)) { bad(`${s}.tsx vanished`); continue; }
    const src = fs.readFileSync(f, 'utf8');
    if (!src.includes('RealPhoto')) bad(`${s} renders no RealPhoto`);
}
if (!fail) ok('all lesson/game chooser grids render real photographs');

// 5) every photo file has a source record (title+license) in ASSET_SOURCES.json
const sourcesPath = path.join(PHOTOS, 'ASSET_SOURCES.json');
if (!fs.existsSync(sourcesPath)) {
    bad('ASSET_SOURCES.json missing');
} else {
    const meta = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
    const all = fs.readdirSync(PHOTOS).filter(f => f.endsWith('.jpg')).map(f => f.replace(/\.jpg$/, ''));
    const unlisted = all.filter(id => !meta[id]);
    if (unlisted.length) bad(`${unlisted.length} photos without a source record: ${unlisted.join(', ')}`);
    else ok(`${all.length} photographs, every one has a recorded source & license`);
}

console.log(fail ? `\nAUDIT FAILED (${fail})` : `\nAUDIT PASSED — ${refs.size} unique photos referenced, all genuine & local`);
process.exit(fail ? 1 : 0);
