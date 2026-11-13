/**
 * Phase 10 — brand-system conformance checks.
 *
 * These are STATIC checks over the source, run alongside the browser pass.
 * They exist because the audit's central finding was that a design system can
 * be present and unused: the library had eight components and four of them had
 * zero render sites, while screens hand-built the same thing beside them. A
 * check that only looked at whether the tokens EXIST would have passed then
 * too. These check adoption.
 */
import fs from 'fs';
import path from 'path';

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) files.push(f);
  }
})('src/App');

const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const all = Object.values(src).join('\n');

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

console.log('\n── palette ──');
const OFF = /\b(bg|text|border|from|to|via|ring|fill|stroke|divide|placeholder|decoration|outline|accent|caret)-(slate|gray|grey|zinc|neutral|stone|purple|indigo|violet|pink|rose|sky|emerald|amber|teal|cyan|fuchsia|lime|red|orange|blue|green|yellow)-\d{2,3}\b/g;
const off = all.match(OFF) ?? [];
check('no off-palette Tailwind colour utilities', off.length === 0, `${off.length} found: ${[...new Set(off)].slice(0, 6).join(', ')}`);

const grads = all.match(/bg-gradient-to-/g) ?? [];
check('no gradients', grads.length === 0, `${grads.length} found`);

// Comments are stripped first: the App.tsx comment explaining why the root no
// longer uses bg-white legitimately contains the string "bg-white", and a
// check that fails on its own changelog is a check nobody will keep.
const codeOnly = all.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const white = codeOnly.match(/\bbg-white\b|\bborder-white\b/g) ?? [];
check('no pure white surfaces or borders', white.length === 0, `${white.length} found`);

console.log('\n── shape ──');
/**
 * Corner-specific resets (`rounded-ee-none`, `rounded-ss-brand-sm`) are part of
 * the system, not exceptions to it: they are how a chat bubble gets its tail.
 * What is checked is that every radius VALUE comes from the brand scale — so
 * `rounded-ee-brand-sm` passes and `rounded-ee-md` does not.
 */
const VALID_RADIUS = /^rounded-(?:(?:[tblrse]|ss|se|es|ee|tl|tr|bl|br)-)?(?:brand(?:-sm|-lg|-xl|-pill)?|full|none|\[inherit\]|\[50%.*\])$/;
const radii = new Set(
  (all.match(/\brounded-[a-z0-9[\]._%/-]*/g) ?? []).filter((r) => !VALID_RADIUS.test(r))
);
check('every radius comes from the brand scale', radii.size === 0, [...radii].slice(0, 8).join(', '));

const shadows = new Set((all.match(/\bshadow-(?!brand)(?:sm|md|lg|xl|2xl|3xl|inner)\b/g) ?? []));
check('only brand shadows', shadows.size === 0, [...shadows].join(', '));

console.log('\n── the glass overlay ──');
check('GlobalControls is no longer mounted', !src['src/App/App.tsx'].includes('<GlobalControls'));
const glass = all.match(/backdrop-blur-(?:md|lg|xl|2xl|3xl)/g) ?? [];
check('no heavy glassmorphism', glass.length === 0, `${glass.length} found`);

console.log('\n── system adoption ──');
const uses = (c) => files.filter((f) => new RegExp(`<${c}[\\s/>]`).test(src[f])).length;
for (const c of ['ScreenFrame', 'TopBar', 'ActivityTile', 'ParentCard', 'ProgressTrack', 'StarCount', 'BrandIcon', 'DisplayTitle', 'StepDisc', 'EmptyState', 'Celebration', 'InfoTile', 'Mark']) {
  const n = uses(c);
  check(`${c} is rendered somewhere`, n > 0, `${n} file(s)`);
}

console.log('\n── typography ──');
check('display/title/heading roles are in use', /t-display|t-title/.test(all));
/**
 * A `text-9xl` on a <div> holding 🏆 is CONTENT — the trophy is meant to be
 * huge. A `text-5xl` on an <h1> is TYPOGRAPHY, and it is exactly the drift the
 * audit measured (six size/weight pairs on one screen). Only headings are
 * checked.
 */
const headingSizes = [];
for (const [f, text] of Object.entries(src)) {
  for (const m of text.matchAll(/<(h[1-4])((?:[^>{]|\{[^{}]*\})*?)>/g)) {
    if (/\btext-(?:4xl|5xl|6xl|7xl|8xl|9xl)\b/.test(m[2])) headingSizes.push(`${path.basename(f)}:${m[1]}`);
  }
}
check('headings use the type scale, not ad-hoc sizes', headingSizes.length === 0, headingSizes.slice(0, 6).join(', '));

console.log('\n── tokens ──');
const css = fs.readFileSync('src/styles/iris.css', 'utf8');
const theme = fs.readFileSync('src/styles/theme.css', 'utf8');
check('--screen-accent exists and has five presets', (css.match(/\[data-accent='/g) ?? []).length === 5);
check('type scale tokens exist', /--text-display:/.test(css) && /--text-label:/.test(css));
check('motion tokens exist', /--motion-ease:/.test(css));
check('the cool-grey dark block is gone', !/\.dark\s*\{/.test(theme));
check('no oklch leftovers in the theme layer', !/oklch\(/.test(theme));
check('--primary is defined once, in the brand layer', (theme.match(/^\s*--primary:/gm) ?? []).length <= 1);
// Checked against the rendered className, not the whole file: the comment
// explaining the change legitimately contains the words "bg-white".
const rootCls = src['src/App/App.tsx'].match(/className="size-full[^"]*"/)?.[0] ?? '';
check('app root paints the brand ground', /bg-ground/.test(rootCls) && !/bg-white/.test(rootCls), rootCls);

console.log('\n── accessibility invariants ──');
check('focus ring is defined and not removable', /focus-visible/.test(css) && /outline-width: 3px !important/.test(css));
check('child touch floor is 56px', /--iris-touch-child: 56px/.test(css));
check('reduced motion is honoured', /prefers-reduced-motion/.test(css));
check('Arabic is never letter-spaced', /\[lang='ar'\] \* \{[\s\S]*?letter-spacing: 0 !important/.test(fs.readFileSync('src/styles/fonts.css', 'utf8')));
check('BarButton requires a label', /label: string;/.test(src['src/App/components/iris/ui/brand/system.tsx']));

console.log('\n── substantive content is untouched ──');
const chat = src['src/App/components/iris/IrisParentChat.tsx'];
check('Ask IRIS still calls the real retrieval engine', /answerParentQuestion\(/.test(chat));
check('the medical disclaimer is still on Ask IRIS', /does not diagnose/.test(chat) && /لا يقدّم IRIS تشخيصًا/.test(chat));
check('demo labelling survives on Specialists', /not verified|غير موثّق|demo/i.test(src['src/App/components/iris/IrisSpecialists.tsx']));
check('the snapshot still refuses to show a total score', !/overallScore|totalScore/.test(src['src/App/components/iris/IrisLearningSnapshot.tsx']));

console.log(`\n${failures === 0 ? 'ALL BRAND CHECKS PASS' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
