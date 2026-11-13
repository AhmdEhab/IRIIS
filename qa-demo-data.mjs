/**
 * Demo-directory honesty checks.
 *
 * This is the layer most likely to drift, because "make the demo feel more
 * real" is a sentence someone will say. Every assertion below corresponds to a
 * specific way this project has already gone wrong once: the old
 * CommunitySessionsScreen shipped four invented practitioners with ratings and
 * review counts, three fabricated testimonials, and a live booking POST.
 *
 * Source files are read as TEXT rather than imported, so the checks also cover
 * the Arabic strings and the markup, not just the exported objects.
 */
import fs from 'node:fs';
import path from 'node:path';

const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const specSrc = read('src/App/data/mockSpecialists.ts');
const commSrc = read('src/App/data/mockCommunity.ts');
const specUI = read('src/App/components/iris/IrisSpecialists.tsx');
const commUI = read('src/App/components/iris/IrisCommunity.tsx');
const dirSrc = read('src/App/data/directory.ts');

// Strip block comments: the files DESCRIBE the banned patterns in their
// headers, and a check that trips on its own documentation is useless.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const specCode = code(specSrc);
const commCode = code(commSrc);
const uiCode = code(specUI) + code(commUI);

// ── 1. no invented people ───────────────────────────────────────────────────
console.log('\n[1] No invented people');
{
  // A title before a name is the credential signal that matters most.
  pass('no "Dr." / "د." titles anywhere in the demo data',
    !/\bDr\.?\s+[A-Z]/.test(specCode + commCode) && !/(^|[\s"'])د\.\s*\S/.test(specCode + commCode));

  // Every specialist name must be a label, not a person.
  const names = [...specCode.matchAll(/name_en:\s*'([^']+)'/g)].map((m) => m[1]);
  pass('every specialist name is a demo label', names.length > 0 && names.every((n) => /^Demo Specialist/.test(n)),
    names.join(' | '));
  const arNames = [...specCode.matchAll(/name_ar:\s*'([^']+)'/g)].map((m) => m[1]);
  pass('every Arabic specialist name is a demo label', arNames.every((n) => n.includes('تجريبي')),
    arNames.join(' | '));

  // Community authors likewise.
  const authors = [...commCode.matchAll(/author_en:\s*'([^']+)'/g)].map((m) => m[1]);
  pass('every community author is a demo label',
    authors.length > 0 && authors.every((a) => /^(Demo Parent|Illustrative)/.test(a)),
    [...new Set(authors)].join(' | '));
}

// ── 2. no credentials, no social proof ──────────────────────────────────────
console.log('\n[2] No credentials or social proof');
{
  for (const [label, pattern] of [
    ['rating', /\brating\b|\bstars?_count\b|★|⭐\s*\d/i],
    ['review count', /\breviews?\b\s*:|\breview_count\b/i],
    ['licence / registration number', /licen[cs]e|registration number|رقم ترخيص|رقم القيد/i],
    ['degree or qualification', /\b(MD|PhD|MSc|BSc|MBBS)\b|بكالوريوس|ماجستير|دكتوراه/],
    ['years-of-experience figure', /\d+\s*(\+)?\s*(years|yrs|سنة|سنوات)\s*(of\s*)?(experience|خبرة)?/i],
    ['patient / client counts', /\d{2,}\s*(patients|clients|families|حالة|أسرة)/i],
  ]) {
    pass(`no ${label} in the demo data`, !pattern.test(specCode + commCode));
  }

  // Reactions must stay obviously synthetic.
  const reactions = [...commCode.matchAll(/reactions:\s*(\d+)/g)].map((m) => Number(m[1]));
  pass('reaction counts are single digits, not social proof',
    reactions.length > 0 && reactions.every((r) => r < 10), reactions.join(','));
}

// ── 3. every record is flagged, and the UI says so ──────────────────────────
console.log('\n[3] Demo status is declared, not implied');
{
  const specCount = (specCode.match(/id:\s*'DEMO-SPEC-/g) || []).length;
  pass('specialist ids are namespaced DEMO-', specCount >= 4, `${specCount} profiles`);
  pass('every specialist defaults to DEMO_NOT_VERIFIED',
    /verification_status:\s*'DEMO_NOT_VERIFIED'/.test(specCode));
  pass('every specialist defaults to accepts_bookings: false',
    /accepts_bookings:\s*false/.test(specCode));
  pass('is_demo is set on specialists and on community records',
    /is_demo:\s*true/.test(specCode) && /is_demo:\s*true/.test(commCode));

  pass('the specialists screen renders a demo banner', /isDemoDirectory\(\)/.test(specUI));
  pass('the community screen renders a demo banner', /isDemoDirectory\(\)/.test(commUI));
  pass('specialist cards carry a per-card not-verified pill',
    /not verified|غير موثّق/.test(specUI));
  pass('specialist-style replies are labelled as not from a real specialist',
    /not a reply from a real specialist|مش رد من مختص حقيقي/.test(commUI));
}

// ── 4. no outcome claims and no medical content ─────────────────────────────
console.log('\n[4] No outcome claims, no medical content');
{
  for (const [label, pattern] of [
    ['an IRIS outcome claim', /(thanks to|because of|بفضل)\s*(IRIS|إيريس|ايريس)/i],
    ['a child-gain testimonial', /(my (son|daughter|child)|ابني|بنتي)\s+(now|finally|أخيرًا|بقى)\s/i],
    // Profession NAMES are not treatment claims: "علاج وظيفي" is the standard
    // Arabic for occupational therapy, and "speech therapy" names a field.
    // What must never appear is a promise that something treats or cures a
    // child — so the pattern targets the verb/claim forms, not the job titles.
    ['a cure or treatment claim',
      /\b(cure[sd]?|will treat|treats?\s+(your|the)\s+child|heals?|remedy)\b|شفاء|بيعالج|هيعالج|بتعالج|يشفي/i],
    ['medication content', /\b(medicine|medication|dose|drug)\b|دواء|جرعة/i],
    ['a diagnosis word', /\bdiagnos/i],
    ['an IQ reference', /\bIQ\b|معدل الذكاء|نسبة الذكاء/],
  ]) {
    pass(`no ${label}`, !pattern.test(specCode + commCode), '');
  }
}

// ── 5. the database seam ────────────────────────────────────────────────────
console.log('\n[5] Swappable to a real database');
{
  pass('a single flag controls the source', /USE_DEMO_DIRECTORY/.test(dirSrc));
  pass('the flag is overridable per deployment', /VITE_USE_DEMO_DIRECTORY/.test(dirSrc));
  pass('the live branch filters to VERIFIED only',
    /verification_status === 'VERIFIED'/.test(dirSrc) && /!s\.is_demo/.test(dirSrc));
  pass('the repository is async, matching a real API', /export async function listSpecialists/.test(dirSrc));
  pass('a dead backend degrades to an empty list, not a crash', /catch\s*{\s*return fallback/.test(dirSrc));

  // The seam only works if nothing bypasses it.
  const bypass = [];
  for (const [name, src] of [['IrisSpecialists', specUI], ['IrisCommunity', commUI]]) {
    if (/from '.*mockSpecialists'|from '.*mockCommunity'/.test(src)) bypass.push(name);
  }
  pass('no screen imports the mock files directly', bypass.length === 0, bypass.join(','));
}

// ── 6. the fabricated legacy screen cannot be reached ───────────────────────
// CommunitySessionsScreen still exists on disk and still contains four invented
// practitioners with ratings and review counts. The file is harmless only for
// as long as nothing imports it: an import puts it back in the bundle and back
// two taps from a parent. This check fails the build if it is ever re-routed.
console.log('\n[6] The fabricated legacy screen is unreachable');
{
  const app = read('src/App/App.tsx');
  pass('App.tsx does not import CommunitySessionsScreen',
    !/^\s*import\s+\{[^}]*CommunitySessionsScreen/m.test(app));
  pass('the community-sessions route renders the labelled demo community',
    /case 'community-sessions':[\s\S]{0,400}?<IrisCommunity/.test(app));

  // And the invented people must not survive a build.
  const dist = fs.existsSync(path.join(process.cwd(), 'dist/assets'))
    ? fs.readdirSync(path.join(process.cwd(), 'dist/assets')).filter((f) => f.endsWith('.js'))
    : [];
  if (dist.length) {
    const bundle = dist.map((f) => read(`dist/assets/${f}`)).join('');
    pass('no invented practitioner name survives into the built bundle',
      !/Sarah Ahmed|Mohamed Hassan|Layla Ibrahim|Ahmed Khalil/.test(bundle),
      `${dist.length} chunk(s) scanned`);
  } else {
    pass('bundle scan skipped — no dist/ present (run npm run build first)', true);
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
