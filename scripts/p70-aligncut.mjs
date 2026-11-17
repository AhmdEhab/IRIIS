#!/usr/bin/env node
/* P70 ALIGNCUT — the silence heuristic failed: TTS internal breaths rival
   phrase pauses. Instead: whisper already transcribed each batch WITH
   per-segment timestamps. Segments follow the phrase order (whisper breaks
   on the >=0.5 s <short pause>). We align expected phrases to consecutive
   segments monotonically (token coverage, digits wild, 4-char stem fuzz)
   and cut [first segment start - 0.10, last segment end + 0.18]. */
import { execFileSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'fs';

const final = JSON.parse(readFileSync('/tmp/speech-final.json', 'utf-8'));
const idx = (a, b) => Array.from({ length: b - a }, (_, k) => a + k);
const VPREF = final.findIndex((o) => o.spoken.startsWith('سؤال أخير'));
const PAREN1 = final.findIndex((o) => o.spoken.includes('علّمي'));
const PAREN2 = final.findIndex((o) => o.spoken.includes('اختاروا'));
const LAYOUT = [
  ['batch01', idx(0, 25)], ['batch03', idx(50, 75)],
  ['batch04', idx(75, 100)], ['batch05', idx(100, 125)], ['batch06', idx(125, 150)],
  ['batch07', idx(150, 175)], ['batch08', idx(175, 200)], ['batch09', idx(200, 225)],
  ['batch10', idx(225, 250)], ['batch11', idx(250, 275)],
  ['batch12', idx(275, 299).filter((i) => i !== PAREN1 && i !== PAREN2 && i !== VPREF)],
  ['batch13', [PAREN1, PAREN2]],
  ['batch14', idx(25, 37)], ['batch15', idx(37, 50)],
];

const norm = (s) => String(s)
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ').trim();
const toks = (s) => norm(s).split(' ').filter((t) => t.length > 0);
const isDigit = (t) => /^[0-9]$/.test(t);
const cover = (exp, actList) => {
  let hit = 0;
  for (const t of exp) {
    if (isDigit(t)) { hit++; continue; }
    if (actList.includes(t)) { hit++; continue; }
    if (t.length >= 4 && actList.some((a) => a.length >= 4 && (a.slice(0, 4) === t.slice(0, 4)))) hit++;
  }
  return exp.length ? hit / exp.length : 1;
};

const OUT = 'public/audio/tts';
// clear every generated clip + its old sidecar (keep src001-042 manual)
const map = {};
{
  const files = readdirSync(OUT);
  for (const f of files) {
    const m = f.match(/^src(\d+)\.mp3$/);
    if (m && +m[1] >= 43) rmSync(`${OUT}/${f}`, { force: true });
    if (/_transcription_/.test(f)) rmSync(`${OUT}/${f}`, { force: true });
  }
}
let nextSrc = 43;
const problems = [];
for (const [name, idxList] of LAYOUT) {
  const sideDir = '/tmp/p70';
  const jsonFile = readdirSync(sideDir).find((f) => f.startsWith(name + '_transcription_') && f.endsWith('.json'));
  if (!jsonFile) { console.log(name, 'NO SIDE CAR'); idxList.forEach((i) => problems.push(i)); continue; }
  const { segments } = JSON.parse(readFileSync(`${sideDir}/${jsonFile}`, 'utf-8'));
  const segT = segments.map((sg) => ({ ...sg, t: toks(sg.text) }));
  const wav = `/tmp/p70/${name}.wav`;
  let cursor = 0;
  for (let k = 0; k < idxList.length; k++) {
    const fi = idxList[k];
    const exp = toks(final[fi].spoken).filter((t) => !isDigit(t));
    // search window: allow whisper to have split/merged — try starts cursor..cursor+2
    let best = null;
    for (let st = cursor; st <= Math.min(cursor + 2, segT.length - 1); st++) {
      for (let en = st; en < Math.min(st + 3, segT.length); en++) {
        const act = segT.slice(st, en + 1).flatMap((x) => x.t);
        const c = cover(exp, act);
        // extra-content penalty: act words far beyond exp inside one seg
        const extra = act.length - exp.length;
        const score = c * 10 - Math.max(0, extra - 2) * 0.4 - (st - cursor) * 0.3 - (en - st) * 0.15;
        if (!best || score > best.score) best = { st, en, c, score };
        if (c >= 0.8 && en === st && extra <= 2) break; // tight first try wins fast
      }
      if (best && best.c >= 0.8 && best.st === cursor) break;
    }
    if (!best || best.c < 0.5) {
      problems.push(fi);
      console.log(`  ${name}[${k}] g${fi + 1} UNALIGNED "${final[fi].spoken.slice(0, 40)}"`);
      continue;
    }
    const a = Math.max(0, segT[best.st].start - 0.1);
    const b = segT[best.en].end + 0.18;
    const file = `src${String(nextSrc).padStart(3, '0')}.mp3`;
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
      '-ss', a.toFixed(3), '-to', b.toFixed(3), '-ar', '24000', '-ac', '1',
      '-c:a', 'libmp3lame', '-b:a', '48k', `${OUT}/${file}`], { encoding: 'utf-8' });
    map[final[fi].id] = { file, spoken: final[fi].spoken };
    nextSrc++;
    cursor = best.en + 1;
    if (cursor > segT.length - 1 && k < idxList.length - 1) cursor = Math.max(0, segT.length - (idxList.length - k)); // keep window alive
  }
  console.log(`${name}: aligned ${idxList.length - 0} phrases → src up to ${nextSrc - 1}`);
}
writeFileSync('/tmp/p70-map.json', JSON.stringify(map, null, 1));
writeFileSync('/tmp/p70-problems.json', JSON.stringify(problems, null, 0));
console.log('CLIPS:', Object.keys(map).length, '| problems:', problems.length, problems.map((i) => 'g' + (i + 1)).join(' '));
