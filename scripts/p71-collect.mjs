#!/usr/bin/env node
/* P71 COLLECT — harvest every Arabic string that can reach speak() from the
   LEGACY screens (the P70 sweep covered bank + caregiver + shared phrases).
   Sources: literals inside speak/say/narrate calls, data arrays feeding them
   (skills, items, balloons, badges, stories, syndromes, syndromes content,
   assessment q.ar), and LanguageContext values for t.KEY references spoken
   at call sites. Output: /tmp/p71-new.json (strings NOT already in the
   P70 manifest). Composed templates (${x}) are reported so the call sites
   can be rewired to clipped parts. */
import { readFileSync, writeFileSync } from 'fs';

const R = (p) => readFileSync(p, 'utf-8');
const C = 'src/App/components/';
const AR = /[\u0600-\u06FF]/;
const out = new Set();
const templates = [];

const literals = (s) => (s.match(/'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"]+)"|`([^`$]*)`/g) || [])
  .map((m) => m.slice(1, -1))
  .filter((x) => x && AR.test(x));

/* helper: pull the language==='ar' Arabic branch of ternaries inside a file */
const arBranches = (s) => [...s.matchAll(/(?:language|ar|l)\s*===?\s*'ar'\s*\?\s*('(?:[^']|\\')*'|"(?:[^"])*"|`(?:[^`$])*`)/g)].map((m) => m[1].slice(1, -1)).filter((x) => AR.test(x));

const push = (arr) => { for (const x of arr) { const y = x.replace(/\\'/g, "'").trim(); if (AR.test(y)) out.add(y); } };

/* 1) per-file literals+branches around speak calls (line windows) */
const files = ['LifeSkillsScreen', 'ShadowMatchScreen', 'SongsScreen', 'LoginScreen',
  'RegistrationScreen', 'ParentSettingsScreen', 'ChildModeScreen', 'ModeSelectionScreen',
  'IrisStoryPlayer', 'IrisAssessmentScreen', 'SyndromeLearningCard', 'DrawingScreen',
  'StoriesScreen', 'MemoryGameScreen', 'BalloonPopScreen', 'IRISAssistant',
  'FamilyGuidanceScreen', 'CommunitySessionsScreen', 'SplashScreen', 'RewardsScreen',
  'LandingChildMode', 'EmailVerificationScreen', 'iris/IrisActivityScreen', 'iris/IrisChildHome',
  'iris/ui/IrisCompanion', 'iris/ui/AudioControl'];
for (const f of files) {
  const p = C + f + '.tsx';
  let s; try { s = R(p); } catch { continue; }
  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/\bspeak\(|narrate\(/.test(lines[i])) continue;
    const win = lines.slice(i, i + 3).join(' ');
    push(literals(win));
    push(arBranches(win));
    if (/`[^`]*\$\{/.test(win)) templates.push(f + ' L' + (i + 1));
  }
  /* t.KEY spoken references */
  const keys = [...s.matchAll(/(?:speak|narrate)\(\s*t\.([A-Za-z]+)/g)].map((m) => m[1]);
  if (keys.length) {
    const lang = R('src/App/contexts/LanguageContext.tsx');
    const arDictBlock = lang.indexOf("const ar");
    const seg = lang.slice(arDictBlock, lang.indexOf("const en", arDictBlock) > 0 ? lang.indexOf("const en", arDictBlock) : undefined);
    for (const k of keys) {
      const m = seg.match(new RegExp(`\\b${k}:\\s*'([^']*)'`));
      if (m && AR.test(m[1])) out.add(m[1].trim());
    }
  }
}

/* 2) LifeSkills data: titleAr + step textAr + tips */
{
  const s = R(C + 'LifeSkillsScreen.tsx');
  push([...s.matchAll(/titleAr:\s*'([^']*)'/g)].map((m) => m[1]));
  push([...s.matchAll(/textAr:\s*'([^']*)'/g)].map((m) => m[1]));
}
/* 3) Shadow + Balloon + Drawing palettes */
push([...R(C + 'ShadowMatchScreen.tsx').matchAll(/nameAr:\s*'([^']*)'/g)].map((m) => m[1]));
{
  const s = R(C + 'BalloonPopScreen.tsx');
  push([...s.matchAll(/label:\s*'([^']*)'/g)].map((m) => m[1]));
}
{
  const s = R(C + 'DrawingScreen.tsx');
  push([...s.matchAll(/nameAr:\s*'([^']*)'/g)].map((m) => m[1]));
}
/* 4) badges (RewardsScreen data + AppContext badge defs) */
for (const p of [C + 'RewardsScreen.tsx', 'src/App/contexts/AppContext.tsx']) {
  try {
    const s = R(p);
    push([...s.matchAll(/nameAr:\s*'([^']*)'/g)].map((m) => m[1]));
    push([...s.matchAll(/descriptionAr:\s*'([^']*)'/g)].map((m) => m[1]));
  } catch { /* */ }
}
/* 5) stories content */
{
  const s = R('src/App/content/stories.ts');
  push([...s.matchAll(/titleAr:\s*'([^']*)'/g)].map((m) => m[1]));
  push([...s.matchAll(/\bar:\s*'([^']*)'/g)].map((m) => m[1]));
  push([...s.matchAll(/foundAr:\s*'([^']*)'/g)].map((m) => m[1]));
}
/* 6) SKIPPED on purpose: IrisAssessmentScreen is dead code (nothing mounts
   it; only IrisFlow's mapCondition is imported). Its placeholder-dash strings
   would produce nonsense narration. */

/* 7) syndromes content (name + spoken step texts) */
{
  let s = '';
  for (const p of [C + 'syndromeData.ts', 'src/App/content/syndromeData.ts', C + 'iris/syndromeData.ts']) {
    try { s += R(p); } catch { /* */ }
  }
  if (!s) { // find data source from the card imports
    const card = R(C + 'SyndromeLearningCard.tsx');
    const im = [...card.matchAll(/from '([^']+)'/g)].map((m) => m[1]).filter((x) => /syndrome/i.test(x));
    for (const rel of im) {
      const p = (C + rel).replace(/^\.\//, 'src/App/');
      try { s += R(p.endsWith('.ts') || p.endsWith('.tsx') ? p : p + '.ts'); } catch { /* */ }
    }
  }
  for (const fld of ['name', 'nameAr', 'text', 'textAr', 'letterName', 'sound', 'song']) {
    push([...s.matchAll(new RegExp(`\\b${fld}:\\s*'([^']*)'`, 'g'))].map((m) => m[1]));
  }
}
/* 8) registration conditions names + validation msgs */
{
  const s = R(C + 'RegistrationScreen.tsx');
  push([...s.matchAll(/name:\s*'([^']*)'/g)].map((m) => m[1]).filter((x) => AR.test(x)));
  push(arBranches(s));
  push(literals(s)); // validation msgs are Arabic literals too
}
/* 9) IRISAssistant canned messages */
{
  const s = R(C + 'IRISAssistant.tsx');
  const i = s.indexOf('ar:');
  push([...s.matchAll(/'([^']*)'/g)].map((m) => m[1]).filter((x) => AR.test(x)));
}
/* 10) FamilyGuidance articles + community strings */
for (const p of [C + 'FamilyGuidanceScreen.tsx', C + 'CommunitySessionsScreen.tsx']) {
  const s = R(p);
  push(arBranches(s));
  push([...s.matchAll(/title:\s*'([^']*)'/g)].map((m) => m[1]).filter((x) => AR.test(x)));
  push([...s.matchAll(/content:\s*'([^']*)'/g)].map((m) => m[1]).filter((x) => AR.test(x)));
}
/* 10b) MasterCurriculum (SyndromeLearningCard speaks these names) */
{
  const s = R('src/App/data/MasterCurriculum.ts');
  for (const fld of ['nameAr', 'letterNameAr', 'soundAr', 'songAr', 'textAr', 'wordAr', 'hintAr']) {
    push([...s.matchAll(new RegExp(`\\b${fld}:\\s*'([^']*)'`, 'g'))].map((m) => m[1]));
  }
  // Williams-style composed intro per item name
  const names = [...s.matchAll(/\bnameAr:\s*'([^']*)'/g)].map((m) => m[1]);
  for (const n of names) out.add(`اسمع! هذا هو ${n}`);
}
/* 10b2) Shadow praise composed per item */
{
  const names = [...R(C + 'ShadowMatchScreen.tsx').matchAll(/\bnameAr:\s*'([^']*)'/g)].map((m) => m[1]);
  for (const n of names) out.add(`رائع! هذا الـ ${n}`);
}
/* 10b3) Williams song line composed per curriculum item */
{
  const names = [...R('src/App/data/MasterCurriculum.ts').matchAll(/\bnameAr:\s*'([^']*)'/g)].map((m) => m[1]);
  for (const n of names) out.add(`🎵 لنغني مع ${n}! 🎵`);
}
/* 10c) social opening lines in SyndromeLearningCard */
push(arBranches(R(C + 'SyndromeLearningCard.tsx')));
/* 10d) badge composed lines (RewardsScreen speaks `وسام: {name}. {desc}`) */
{
  const s = R(C + 'RewardsScreen.tsx') + R('src/App/contexts/AppContext.tsx');
  const names = [...s.matchAll(/\bnameAr:\s*'([^']*)'/g)].map((m) => m[1]);
  const descs = [...s.matchAll(/\bdescriptionAr:\s*'([^']*)'/g)].map((m) => m[1]);
  names.forEach((n, i) => out.add(`وسام: ${n}. ${descs[i] || ''}`.trim()));
}
/* 11) shared phrases (say kinds) + welcomeMessage etc. via LanguageContext keys used in screens */
{
  const ph = R('src/App/audio/phrases.ts');
  push([...ph.matchAll(/ar:\s*'([^']*)'/g)].map((m) => m[1]));
}

/* dedupe against existing manifest */
const gen = R('src/App/audio/fileClips.generated.ts');
const { cleanSpeechText } = await import('../src/App/audio/speechText.js');
const known = new Set();
for (const m of gen.matchAll(/^  "(.*?)": '\/audio\/tts/gms)) known.add(m[1].replace(/\\"/g, '"'));
const fresh = [];
// Drop JSX/markup fragments the window scan swallowed: real narration never
// contains angle brackets, braces or comparison operators.
const junk = (k) => process.env.P71_NOJUNK ? false : /[<>{}=]|language === /.test(k);
const tooLong = [];
for (const s of out) {
  const c = cleanSpeechText(s, 'ar');
  if (!c) continue;
  if (!known.has(c) && !junk(c)) {
    if (c.length > 160) { tooLong.push(c.slice(0, 90)); continue; }
    fresh.push({ raw: s, key: c });
  }
}
console.log('over-160 chars (stay browser-voice):', tooLong.length);
writeFileSync('/tmp/p71-new.json', JSON.stringify(fresh, null, 1));
console.log('candidates:', out.size, '| NOT in manifest:', fresh.length);
console.log('--- composed templates needing call-site rewire ---');
for (const t of [...new Set(templates)].slice(0, 20)) console.log(' ', t);
for (const f of fresh.slice(0, 40)) console.log(' NEW:', f.key.slice(0, 84));
