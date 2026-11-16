/**
 * IRIS — the "getting-to-know" result (post-assessment screen data).
 *
 * ── WHAT THIS PAGE IS ─────────────────────────────────────────────────────
 * A DESCRIPTIVE summary of what the session showed: one honest row per ladder
 * track the child actually attempted, plus what the caregiver told us about
 * the same skill family at home. It is built from the REAL engine outputs —
 * `finaliseLadderAssessment()`'s indicators/profile/priorities/stops/probe
 * rows, and `scoreCaregiverProfile()`'s `domainStates` — and it adds no new
 * measurement of any kind.
 *
 * ── WHAT IT MUST NEVER BE ─────────────────────────────────────────────────
 * No ability score, no IQ, no diagnosis, no severity, no mental age, no
 * percentile, no age equivalent, no ranking against other children. The
 * four states here ('solo' / 'help' / 'emerging' / 'more_info') are
 * categories of WHAT WAS SEEN, not quantities of the child. No number from
 * an indicator ever leaves this module — the per-track aggregation reads
 * rows the way `rowsForStrand()` reads them (no invalid visits, no
 * calibration rows, nothing invented) and collapses them to a category.
 *
 * ── TWO INSTRUMENTS, NEVER ONE NUMBER (§0.3 of the family-profile rules) ──
 * The caregiver line sits BESIDE the observed line as its own sentence;
 * nothing is averaged between home and screen, exactly as merge.js insists.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No `condition` parameter, and none of the inputs it reads carries one.
 *
 * Pure: no React, no DOM, no storage, no clock, no randomness, no new deps.
 */
import {
  LADDER_IDS, tracksFor, baseRungOf, metaForTrack,
} from '../ladders/index.js';
import { PROBE_STOP } from '../engines/adaptiveProbe.js';
import { presentedOf } from '../engines/skillEstimate.js';
import { BLOCK_LABELS, PARENT_STATE_WORDS } from '../caregiver/merge.js';

/** The only four states a skill row may carry, in report order. */
export const RESULT_STATE_KEYS = Object.freeze(['solo', 'help', 'emerging', 'more_info']);

/**
 * Chip + one-line meaning for each state, for the UI and for tests to import.
 * Egyptian Arabic first — warm, second person to the parent, categorical.
 * None of these strings may contain a number, a %, or a banned word
 * (IQ / ذكاء / تشخيص / درجة / level =).
 */
export const RESULT_STATE_COPY = Object.freeze({
  solo: {
    ar: 'بيعملها لوحده',
    en: 'Does it on her/his own',
    meaningAr: 'دي حاجة حصلت على الشاشة النهاردة من غير ما حد يساعده فيها.',
    meaningEn: 'This happened on screen today without anyone stepping in to help.',
  },
  help: {
    ar: 'بيعملها بمساعدة',
    en: 'Does it with support',
    meaningAr: 'الحاجة تحصلت، بس لمّا المساعدة كانت موجودة — وده الطريق اللي توصله.',
    meaningEn: 'It happened, but when help was there — that is the route that reaches him.',
  },
  emerging: {
    ar: 'لسه في أول الطريق',
    en: 'Early in the road to it',
    meaningAr: 'جرّب ووصل لحاجات في الطريق، لسه مش واصلة — وده كلام على المهمة، مش حكم على الطفل.',
    meaningEn: 'He tried and reached things along the way, not all of it yet — a statement about the task, not the child.',
  },
  more_info: {
    ar: 'لسه محتاجين نفهم أكتر',
    en: 'We still need to learn more',
    meaningAr: 'الجلسة دي ماجمعتش كفاية نقول حاجة عنها — هنرجع نجرّب تاني بهدوء.',
    meaningEn: 'This session did not gather enough to say anything about it — we will try again, calmly.',
  },
});

/**
 * Human track labels + the caregiver block that talks about the same family
 * of things AT HOME. Keys are the real `ladder:track` keys the probe walks
 * (startProbe / stops / track_key style — indicators are per-strand and
 * carry `.ladder` + `.track`, so grouping by `${ladder}:${track}` is exact).
 *
 * The mapping is deliberately narrow and honest:
 *  - language/letters ↔ L ('learning and everyday problem-solving'),
 *  - listening & expressive communication ↔ C ('communication and language'),
 *  - visual matching ↔ M ('movement and how he controls things') — the home
 *    side of handling and placing things, nothing more,
 *  - memory/attention ↔ NONE. The questionnaire has no memory or attention
 *    section, so this module refuses to borrow one; the row simply has no
 *    parent line.
 */
export const TRACK_RESULT_META = Object.freeze({
  'LITERACY:MAIN': { ar: 'اللغة والكلمات', en: 'Language and words', caregiverBlock: 'L' },
  'LITERACY:LISTENING': { ar: 'الفهم بالسمع', en: 'Listening and understanding', caregiverBlock: 'C' },
  'LITERACY:COMM': { ar: 'التواصل والتعبير', en: 'Getting his meaning across', caregiverBlock: 'C' },
  'NUMERACY:MAIN': { ar: 'الأرقام والكميات', en: 'Numbers and amounts', caregiverBlock: 'L' },
  'VSP:MAIN': { ar: 'المطابقة البصرية', en: 'Visual matching', caregiverBlock: 'M' },
  'MEM:MAIN': { ar: 'الذاكرة والانتباه', en: 'Memory and attention', caregiverBlock: null },
});

/* ── sentence joiners (module-private) ─────────────────────────────────── */

const joinNamesAr = (names) => names.map((n) => `«${n}»`).join(' و');
const joinNamesEn = (names) => (names.length <= 1
  ? names.map((n) => `"${n}"`).join('')
  : `${names.slice(0, -1).map((n) => `"${n}"`).join(', ')} and "${names[names.length - 1]}"`);

/** Never let an empty name list produce a broken sentence. */
const namesOr = (list, fallbackAr, fallbackEn) => (
  list.length > 0 ? { ar: joinNamesAr(list), en: joinNamesEn(list) } : { ar: fallbackAr, en: fallbackEn }
);

/**
 * Every track key in ladder order: LITERACY (MAIN, LISTENING, COMM),
 * NUMERACY, VSP, MEM — straight from LADDERS/`tracksFor`, so a track added
 * to the registry appears here automatically.
 */
function orderedTrackKeys() {
  const out = [];
  for (const ladder of LADDER_IDS) {
    for (const track of tracksFor(ladder)) out.push({ key: `${ladder}:${track}`, ladder, track });
  }
  return out;
}

/* ── per-track evidence, read the way the engine reads it ──────────────── */

/** Indicator rows belonging to one `ladder:track` (indicators key on strand id). */
function trackIndicators(indicators, ladder, track) {
  return Object.values(indicators ?? {}).filter(
    (i) => i && typeof i === 'object' && i.ladder === ladder && i.track === track,
  );
}

/**
 * Probe rows for one track, filtered like `rowsForStrand` filters:
 * calibration rows and invalid visits are not evidence. `raw` keeps every
 * non-calibration row, so a track that WAS attempted can still be reported
 * (as 'more_info') when its evidence turned out to be nothing.
 */
function trackRows(probe, ladder, track) {
  const all = (probe?.results ?? []).filter(
    (r) => r && !r.calibration && r.ladder === ladder && r.track === track,
  );
  const scored = all.filter((r) => !r.invalid_flag && ((r.total ?? 0) > 0 || (r.insufficient ?? 0) > 0));
  return { all, scored };
}

/** The stop reason for a track, from `stops` first, then the live track state. */
function trackStopReason(ladderResult, trackKey) {
  const fromStops = ladderResult?.stops?.[trackKey]?.stop_reason;
  if (fromStops) return fromStops;
  const t = ladderResult?.probe?.tracks?.[trackKey];
  return t?.stop_reason ?? null;
}

/**
 * Collapse a track to one of the four states. Categories only — every
 * quantity computed here stays inside this function and is never emitted.
 *
 *  - stop INSUFFICIENT_INFORMATION, or evidence that the engine itself
 *    refuses to measure (all notMeasured, no floor)      → 'more_info'
 *  - tried with nothing gotten (a floor)                 → 'emerging'
 *  - mostly independent AND climbed past the entry rung,
 *    or got the great majority of what was presented     → 'solo'
 *  - got things but mainly with scaffolds                → 'help'
 *  - attempted, partial, nothing settled                 → 'emerging'
 */
function deriveTrackState({ scoredRows, indicators, stopReason }) {
  if (stopReason === PROBE_STOP.INSUFFICIENT_INFORMATION) return 'more_info';
  if (scoredRows.length === 0 && indicators.length === 0) return null; // not attempted

  /* P64b (report adaptivity fix): the family session runs ONE visit per
     track (2 items). The engine's indicator layer is deliberately
     conservative — it marks such thin samples `notMeasured` because it
     governs the CLINICAL ledger — but scored rows, when present, ARE real
     valid answers the child gave. Before this fix, `measured.length === 0`
     collapsed every track to 'more_info' no matter whether the child
     answered 2/2 or 0/2, and the report parents read never moved with the
     child's performance. Now the indicator-only collapse applies ONLY when
     there are no scored rows; with rows, the quantities below decide. The
     INSUFFICIENT_INFORMATION stop (disengaged child / failed
     administration) still wins above — that genuinely is a no-measurement
     case. Legacy/clinical records lacking these rows take the OLD path
     byte-for-byte. */
  if (scoredRows.length === 0) {
    const measured = indicators.filter((i) => i.notMeasured !== true);
    if (measured.length === 0) {
      // Anything the engine reported as a floor was attempted and produced no
      // demonstration; anything else (NOT_PROBED / NEEDS_MORE_INFORMATION /
      // TOO_FEW_ITEMS) is simply not enough information yet.
      if (indicators.some((i) => i.floor === true)) return 'emerging';
      return 'more_info';
    }
  }

  let presented = 0;
  let gained = 0;   // independent + scaffolded answers that were really presented
  let supported = 0;
  let climbed = false;
  const base = indicators[0] ? baseRungOf(indicators[0].ladder, indicators[0].track) : 0;
  for (const r of scoredRows) {
    const p = presentedOf(r);
    const g = Math.min(p, (r.correct ?? 0) + (r.supported ?? 0));
    presented += p;
    gained += g;
    supported += Math.min(r.supported ?? 0, g);
    if (g > 0 && (r.rung ?? 0) > base) climbed = true;
  }
  if (presented <= 0 || gained <= 0) {
    /* P64b: a track the engine marked as a FLOOR was genuinely attempted
       and produced no demonstration — that reads as 'emerging', whether or
       not scored rows also exist. Only a track with no usable signal at
       all stays 'more_info'. */
    if (indicators.some((i) => i.floor === true)) return 'emerging';
    return 'more_info';
  }

  const supportShare = supported / gained;
  const successShare = gained / presented;
  if (supportShare < 0.5 && (climbed || successShare >= 0.75)) return 'solo';
  if (supportShare >= 0.5 && successShare >= 0.5) return 'help';
  return 'emerging';
}

/* ── strand names for the evidence sentence ────────────────────────────── */

/** Up to three strand names that were actually seen working (measured). */
function demonstratedNames(indicators, max = 3) {
  return indicators
    .filter((i) => i.notMeasured !== true)
    .sort((a, b) => (
      (b.highest_rung ?? 0) - (a.highest_rung ?? 0)
      || ((b.accuracy ?? 0) * (b.items ?? 0)) - ((a.accuracy ?? 0) * (a.items ?? 0))
      || String(a.strand).localeCompare(String(b.strand))
    ))
    .slice(0, max);
}

/** Up to three strand names attempted at all (measured, floored, or tried). */
function attemptedNames(indicators, max = 3) {
  return indicators
    .slice()
    .sort((a, b) => (b.highest_rung ?? b.lowest_probed_rung ?? 0) - (a.highest_rung ?? a.lowest_probed_rung ?? 0)
      || String(a.strand).localeCompare(String(b.strand)))
    .slice(0, max);
}

/* ── the one evidence sentence per row ─────────────────────────────────── */

function evidenceLines({ trackLabel, state, indicators }) {
  const seen = demonstratedNames(indicators);
  const tried = attemptedNames(indicators);
  const { ar: seenAr, en: seenEn } = namesOr(
    seen.map((i) => i.nameAr).filter(Boolean), 'شوية حاجات', 'a few things',
  );
  const { ar: triedAr, en: triedEn } = namesOr(
    tried.map((i) => i.nameAr).filter(Boolean), 'شوية حاجات', 'a few things',
  );
  const triedEnList = namesOr(tried.map((i) => i.nameEn).filter(Boolean), 'a few things', 'a few things');
  const seenEnList = namesOr(seen.map((i) => i.nameEn).filter(Boolean), 'some skills', 'some skills');

  switch (state) {
    case 'solo':
      return {
        ar: `في ${trackLabel.ar}، شوفناه بيعمل ${seenAr} لوحده من غير ما حد يساعده.`,
        en: `In ${trackLabel.en}, we saw him doing ${seenEnList.en} on his own, without anyone helping.`,
      };
    case 'help':
      return {
        ar: `في ${trackLabel.ar}، تحصلت ${seenAr} لمّا المساعدة كانت موجودة — ودي طريقة توصله.`,
        en: `In ${trackLabel.en}, ${seenEnList.en} happened when the help was there — that is the route that reaches him.`,
      };
    case 'emerging':
      return {
        ar: `في ${trackLabel.ar}، جرّب ${triedAr} ووصل لأول الطريق؛ لسه بنشوف مش حاكمين.`,
        en: `In ${trackLabel.en}, he tried ${triedEnList.en} and reached the start of the road; we are still watching, not judging.`,
      };
    default: // more_info
      return {
        ar: `في ${trackLabel.ar}، جرّب ${triedAr} بس الجلسة ماجمعتش كفاية نقول حاجة — هنرجع تاني بهدوء.`,
        en: `In ${trackLabel.en}, he tried ${triedEnList.en}, but this session did not gather enough to say anything — we will go back to it, calmly.`,
      };
  }
}

/* ── the caregiver side of the same family ─────────────────────────────── */

/**
 * One calm home sentence from `domainStates[block].state`, reusing the
 * product's existing vocabulary (BLOCK_LABELS / PARENT_STATE_WORDS from
 * merge.js) so a family never sees two word sets for one thing.
 * Returns null when there is no caregiver profile, no mapped block, or the
 * block carries no state.
 */
function parentLine(caregiverProfile, block) {
  if (!block || !caregiverProfile || typeof caregiverProfile !== 'object') return null;
  const d = (caregiverProfile.domainStates ?? {})[block];
  const words = d && PARENT_STATE_WORDS[d.state];
  if (!words) return null;
  const label = BLOCK_LABELS[block] ?? { ar: block, en: block };
  return {
    ar: `وفي البيت، حسب كلامك عن ${label.ar}: ${words.ar}.`,
    en: `At home, from what you told us about ${label.en}: ${words.en}.`,
  };
}

/* ── strengths and next steps ──────────────────────────────────────────── */

/**
 * Two to four short bullets of what the child DID show:
 * ladder profile strengths first, then any demonstrated strand, then the
 * caregiver's own strength notes and interests. Categorical, no numbers.
 */
function buildStrengths({ lang, ladderResult, caregiverProfile, indicators, skills }) {
  const ar = lang !== 'en';
  const out = [];
  const profile = ladderResult?.profile ?? null;
  const byStrand = Object.fromEntries((indicators ?? []).map((i) => [i.strand, i]));

  const strengthStrands = Array.isArray(profile?.strengths) ? profile.strengths : [];
  for (const id of strengthStrands.slice(0, 2)) {
    const i = byStrand[id];
    if (!i) continue;
    out.push(ar
      ? `${i.nameAr} — دي حاجة ظهرت قوية النهاردة بالنسبة لبقية يومه.`
      : `${i.nameEn} — this showed up strongly today next to the rest of his day.`);
  }
  /* P64b: with the report now deriving real states from the family
     session's scored rows, a track the child did independently IS a
     strength the parent should see — even though the clinical indicator
     layer stays conservative for a 2-item sample. */
  if (out.length < 2) {
    for (const sk of (skills ?? []).filter((x) => x.state === 'solo').slice(0, 2 - out.length)) {
      out.push(ar
        ? `${sk.nameAr} — دي حاجة حصلت النهاردة من غير مساعدة`
        : `${sk.nameEn} — happened on screen today without help`);
    }
  }
  if (out.length < 2) {
    const extra = demonstratedNames((indicators ?? []).filter(
      (i) => !strengthStrands.includes(i.strand),
    ), 2 - out.length);
    for (const i of extra) {
      out.push(ar
        ? `${i.nameAr} — تحصلت على الشاشة النهاردة.`
        : `${i.nameEn} — happened on screen today.`);
    }
  }

  const cgStrengths = Array.isArray(caregiverProfile?.strengths) ? caregiverProfile.strengths : [];
  if (out.length < 4 && cgStrengths.length) {
    const first = cgStrengths.find((s) => s && (s.ar || s.en));
    if (first) {
      out.push(ar
        ? `من كلامك عن البيت: ${first.ar ?? first.en}`
        : `From what you told us at home: ${first.en ?? first.ar}`);
    }
  }
  const interests = Array.isArray(caregiverProfile?.interests) ? caregiverProfile.interests : [];
  if (out.length < 4 && interests.length) {
    out.push(ar
      ? `حاجات بيحبها من كلامك: ${interests.slice(0, 3).join('، ')}`
      : `Things he loves, from what you told us: ${interests.slice(0, 3).join(', ')}`);
  }

  return out.slice(0, 4);
}

/**
 * Two to three gentle next steps, in the same words the First Plan will use:
 * the engine's own learningPriorities, rephrased without a single number.
 */
function buildNextSteps({ lang, ladderResult, hasChildEvidence }) {
  const ar = lang !== 'en';
  const priorities = Array.isArray(ladderResult?.priorities) ? ladderResult.priorities : [];
  const out = [];
  for (const p of priorities.slice(0, 3)) {
    if (!p || !(p.nameAr || p.nameEn)) continue;
    out.push(p.floor
      ? (ar
        ? `«${p.nameAr}» ماظهرتش النهاردة — هنرجع لها من أول طريقها، في اللعب وخطوة خطوة.`
        : `"${p.nameEn}" did not appear today — we will come back to it from its very start, in play, one step at a time.`)
      : (ar
        ? `هنبدأ بـ«${p.nameAr}» في أول خطة — خطوة خطوة، وعلى طريقته.`
        : `The first plan starts with "${p.nameEn}" — one step at a time, on his own terms.`));
  }
  if (!out.length && hasChildEvidence) {
    out.push(ar
      ? 'هنعيد نفس اللعب تاني في الجلسات الجاية لحد ما الصورة توضح.'
      : 'We will replay the same games in the coming sessions until the picture gets clearer.');
  }
  if (!out.length) {
    out.push(ar
      ? 'أول جلسة لعب معانا هتفتح الطريق — لسه بنبدأ.'
      : 'The first play session with us opens the road — we are only starting.');
  }
  return out.slice(0, 3);
}

/* ── headline and the honest line ──────────────────────────────────────── */

function headlineFor({ lang, childName }) {
  const name = typeof childName === 'string' && childName.trim() ? childName.trim() : null;
  if (lang === 'en') {
    return name ? `Getting to know ${name} today` : 'What we got to know today';
  }
  return name ? `اتعرفنا على ${name} النهاردة` : 'اتعرفنا النهاردة على حاجات جديدة';
}

/**
 * The disclaimer. Deliberately phrased WITHOUT the banned tokens themselves
 * (no 'تشخيص', no 'درجة', no digits): a sentence that says "this is not a
 * score" must not contain the word score, or a copy-guard scanning parent
 * output would flag the page it exists to protect.
 */
export const RESULT_HONEST_LINE = Object.freeze({
  ar: 'ده كلام على اللي حصل النهاردة في اللعب والأسئلة بس — مش حكم على طفلك ولا مقارنة بطفل تاني، والصورة دي بتتكمّل مع الوقت.',
  en: 'This is only what showed up in today\'s play and questions — not a verdict on your child and not a comparison with anyone else; this picture fills in over time.',
});

/* ══════════════════════════════════════════════════════════════════════════
 * THE EXPORTED CONTRACT
 * ══════════════════════════════════════════════════════════════════════════
 * buildGettingToKnowResult({ ladderResult, caregiverProfile, childName, lang })
 *   → { headline, honestLine, skills[], strengths[], nextSteps[], hasChildEvidence }
 * See the JSDoc on the function for the exact field types. Tolerant by
 * construction: empty or absent inputs produce an empty skills list and
 * hasChildEvidence false — the caregiver-only variant of the screen.
 */
export function buildGettingToKnowResult({
  ladderResult = null,
  caregiverProfile = null,
  childName = null,
  lang = 'ar',
} = {}) {
  const language = lang === 'en' ? 'en' : 'ar';
  const lr = ladderResult && typeof ladderResult === 'object' ? ladderResult : null;

  const skills = [];
  const allTrackIndicators = [];

  if (lr) {
    for (const { key, ladder, track } of orderedTrackKeys()) {
      const indicators = trackIndicators(lr.indicators, ladder, track);
      const { all, scored } = trackRows(lr.probe, ladder, track);
      if (all.length === 0 && indicators.length === 0) continue; // never attempted → no row

      const stopReason = trackStopReason(lr, key);
      const state = deriveTrackState({ scoredRows: scored, indicators, stopReason });
      if (!state) continue; // belt and braces: derived as unattempted

      allTrackIndicators.push(...indicators);

      const meta = TRACK_RESULT_META[key] ?? null;
      const meta_ = metaForTrack(ladder, track);
      const label = meta
        ? { ar: meta.ar, en: meta.en }
        : { ar: meta_?.nameAr ?? `${ladder} ${track}`, en: meta_?.nameEn ?? `${ladder} ${track}` };
      const caregiverBlock = meta ? meta.caregiverBlock : null;

      const copy = RESULT_STATE_COPY[state];
      const ev = evidenceLines({ trackLabel: label, state, indicators });
      const parent = parentLine(caregiverProfile, caregiverBlock);

      skills.push({
        key,
        nameAr: label.ar,
        nameEn: label.en,
        state,
        stateAr: copy.ar,
        stateEn: copy.en,
        evidenceLineAr: ev.ar,
        evidenceLineEn: ev.en,
        fromParentLineAr: parent ? parent.ar : null,
        fromParentLineEn: parent ? parent.en : null,
      });
    }
  }

  const hasChildEvidence = skills.length > 0;

  return {
    headline: headlineFor({ lang: language, childName }),
    honestLine: language === 'en' ? RESULT_HONEST_LINE.en : RESULT_HONEST_LINE.ar,
    skills,
    strengths: buildStrengths({
      lang: language, ladderResult: lr, caregiverProfile, indicators: allTrackIndicators, skills,
    }),
    nextSteps: buildNextSteps({ lang: language, ladderResult: lr, hasChildEvidence }),
    hasChildEvidence,
  };
}
