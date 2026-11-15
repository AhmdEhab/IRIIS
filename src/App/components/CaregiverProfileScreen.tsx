import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useIris } from '../contexts/IrisContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { API_URL, authHeaders } from '../config';
import { CAREGIVER_BANK_VERSION, getCaregiverBlocks } from '../../iris/caregiver/bank.js';
import { scoreCaregiverProfile } from '../../iris/caregiver/scoring.js';
import { CAREGIVER_V2_VERSION, getCaregiverBlocksV2, CARE_CARD_CODES } from '../../iris/caregiver/bankV2.js';
import { scoreCaregiverV2 } from '../../iris/caregiver/scoringV2.js';
import './caregiver-profile.css';

/**
 * Instrument ① — the Family Profile (ملف العائلة).
 *
 * This screen implements `docs/research/ASSESSMENT_FRAMEWORK.md` §2 (the item
 * bank it renders) and §5 (the parent UX requirements, which are binding):
 *
 *   • one item per screen, "سؤال X من Y" plus a per-block dot map;
 *   • autosave on every answer — localStorage is the safety net and
 *     `POST /caregiver/draft` is the cross-device copy (fixes audit W3);
 *   • back-arrow always available, editing never loses anything, and editing
 *     an answer re-runs the follow-ups because the step list is *derived* from
 *     the answers rather than stored;
 *   • every item read aloud (the speaker click itself is the gesture that
 *     unlocks the audio context), plus optional auto-read for low-literacy
 *     homes (X5);
 *   • 48px+ touch targets, nothing timed anywhere, calm brand palette.
 *
 * ── WHAT THIS FILE DOES NOT DECIDE ────────────────────────────────────────
 * Nothing about content or maths. Items, formats, gates, triplets, follow-up
 * triggers and age windows come from `src/iris/caregiver/bank.js`; the
 * interpretation comes from `src/iris/caregiver/scoring.js`, whose result is
 * passed straight to `onComplete`. This screen computes no score of its own
 * (§0.1: never a single number) and holds no domain logic.
 *
 * ── TONE ──────────────────────────────────────────────────────────────────
 * Nothing here judges. No "wrong", no red penalty state, no difficulty count.
 * The banned vocabulary of §3 never appears on screen: اختبار / تشخيص / درجة
 * are absent from every heading, label and button — the buttons are السابق /
 * التالي / يبدأ / خلصت — and "hasn't had the chance" (`not_yet_chance`) is a
 * first-class answer (§0.5), which is why it short-circuits the item instead
 * of recording anything about ability.
 *
 * ── WHY THE STEP LIST IS DERIVED, NOT STORED ──────────────────────────────
 * The flow is one flat list (block intro → items → review), but which items
 * appear depends on the answers: a gate answered "not yet an opportunity"
 * removes the ability step, a triggered follow-up inserts one. Keeping that
 * list in state would drift the moment a parent edits an earlier answer, so
 * `buildSteps()` is a pure memo of the answers and the position is simply an
 * index into it. Editing upstream re-runs the interview logic for free.
 */

export interface CaregiverProfileScreenProps {
  /** "حفظ وخروج مؤقت" — the draft is already saved; hand back to a safe screen. */
  onSuspend?: () => void;
  /** Forced onboarding gate: the hub is not reachable until the file is
      done, so a suspend affordance here would only loop back into itself.
      Rendered without one — the honest control set is "Start". */
  forced?: boolean;
  /** After the final submit: the raw answers and the engine's scored profile. */
  onComplete: (responses: object, scored: object) => void;
  /** Reserved for the orchestrator's deterministic demo wiring; unused here. */
  demoSeed?: null;
}

/* ── The bank's shape, restated structurally ───────────────────────────────
   `bank.js` is untyped JavaScript, so the §2 contract is described here as
   structural types and every read is optional-safe: a field the bank does not
   ship falls back to a sane presentation default instead of throwing. Nothing
   in these types invents content — it is the contract from the task brief. */

type Code = string;

interface BankOpt { v: Code; label?: string }
interface BankLoc { q?: string; ex?: string; opts?: BankOpt[] }

type BankFormat =
  | 'gate_ability' | 'ability' | 'frequency' | 'situational'
  | 'multi' | 'single' | 'opentext' | 'context' | 'list';

interface BankItem {
  id: string;
  block?: string;
  scored?: boolean;
  ar?: BankLoc;
  en?: BankLoc;
  format?: BankFormat;
  gate?: { ar?: BankLoc; en?: BankLoc };
  triplet?: boolean;
  metUnmet?: boolean;
  followUps?: Array<{ id?: string; when?: { itemId?: string; answers?: Code[]; allOf?: { itemId: string; answers: Code[] }[] }; item?: BankItem }>;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  feeds?: string;
}

interface BankBlock {
  id: string;
  order?: number;
  icon?: string;
  titleAr?: string;
  titleEn?: string;
  blurbAr?: string;
  blurbEn?: string;
  items?: BankItem[];
}

/** One recorded answer. Keys are exactly the contract's: v, t, f, tm, met, note. */
interface Answer {
  v?: Code | Code[];
  t?: Code;
  f?: Code;
  tm?: Code;
  met?: Code;
  note?: string;
}
type Answers = Record<string, Answer>;

/* ── Step list ──────────────────────────────────────────────────────────── */

type Step =
  | { kind: 'block'; id: string; block: BankBlock }
  | { kind: 'gate'; id: string; block: BankBlock; item: BankItem }
  | { kind: 'item'; id: string; block: BankBlock; item: BankItem }
  | { kind: 'care'; id: string; block: BankBlock; item: BankItem }
  | { kind: 'review'; id: string };

/** Which bank wrote these answers? cv2 keys are VQ-numbers or VPREF; cv1 are the
 *  ids. The stamp on a draft wins when present; inference keeps
 *  OLD cv1 drafts (written before any stamping) resuming correctly with no
 *  server schema change. */
function inferBankFromResponses(resp: Answers | undefined | null): string {
  const keys = Object.keys(resp || {});
  return keys.some((k) => k === 'VPREF' || /^VQ\d/.test(k)) ? CAREGIVER_V2_VERSION : CAREGIVER_BANK_VERSION;
}
/** The only two answers a GATE can hold (§2 response grammar). */
const GATE_YES = 'yes_happens';
const GATE_NO = 'not_yet_chance';

/** Ability codes that open the support triplet (§2: supported areas only). */
const TRIPLET_TRIGGERS = ['little_help', 'hands_on'];

/** localStorage safety net + the idempotency key that rides with it (§1). */
const DRAFT_KEY = 'iris_caregiver_draft_v1';

/** Per-block wash cycle — the landing page's belief-card rotation. */
const WASHES = ['blue', 'yellow', 'coral', 'green', 'purple'] as const;

/* ── Labels for codes the bank carries without text ───────────────────────
   Gate/ability/frequency option LABELS come from the bank itself. These maps
   are only the fallback for the triplet codes (t / f / tm) and the met/unmet
   row, which §2 defines as response grammar rather than as item content.
   Egyptian-friendly Arabic first, as everywhere in the product. */

const CODE_LABELS: Record<string, { ar: string; en: string }> = {
  [GATE_YES]: { ar: 'بيحصل معاه', en: 'It happens' },
  [GATE_NO]: { ar: 'لسه ماخدش الفرصة', en: "Hasn't had the chance" },

  independent: { ar: 'يعملها لوحده', en: 'On his/her own' },
  little_help: { ar: 'بمساعدة بسيطة', en: 'With a little help' },
  hands_on: { ar: 'بمساعدة باليد', en: 'With hands-on help' },
  does_not_yet: { ar: 'لسه بيعملهاش', en: 'Not yet' },

  never: { ar: 'مش بيحصل', en: 'Never' },
  rarely: { ar: 'نادراً', en: 'Rarely' },
  sometimes: { ar: 'أحياناً', en: 'Sometimes' },
  often: { ar: 'غالباً', en: 'Often' },
  most_times: { ar: 'في معظم المرات', en: 'Most times' },
  always: { ar: 'دايماً', en: 'Always' },

  none: { ar: 'مفيش مساعدة', en: 'None' },
  supervise: { ar: 'متابعة أو تذكير', en: 'Watching or reminding' },
  partial_physical: { ar: 'مساعدة جزئية باليد', en: 'Partly physical' },
  full_physical: { ar: 'مساعدة باليد بالكامل', en: 'Fully physical' },

  lt15: { ar: 'أقل من 15 دقيقة', en: 'Under 15 min' },
  '15_30': { ar: '15–30 دقيقة', en: '15–30 min' },
  '30_60': { ar: '30–60 دقيقة', en: '30–60 min' },
  most_day: { ar: 'معظم اليوم', en: 'Most of the day' },

  handled: { ar: 'اتعاملنا إحنا لوحدها', en: 'We handled it ourselves' },
  helped: { ar: 'حد يساعدنا', en: 'Someone helps us' },
  unmet: { ar: 'لسه محدش بساعدنا في الموضوع ده', en: 'Nobody is helping with this yet' },
};

/** The triplet's three probes, in the order §2 asks them. */
const TRIPLET_ROWS: Array<{ key: 't' | 'f' | 'tm'; ar: string; en: string; codes: Code[] }> = [
  { key: 't', ar: 'مين بيساعد وإزاي', en: 'Who helps, and how', codes: ['none', 'supervise', 'partial_physical', 'full_physical'] },
  { key: 'f', ar: 'قد إيه', en: 'How often', codes: ['never', 'rarely', 'sometimes', 'often', 'most_times', 'always'] },
  { key: 'tm', ar: 'قد إيه من الوقت', en: 'How much of the day', codes: ['none', 'lt15', '15_30', '30_60', 'most_day'] },
];

/** The met/unmet row (CANDID logic, §2). */
const MET_CODES = ['handled', 'helped', 'unmet'];

/* ── Screen copy ──────────────────────────────────────────────────────────
   Two languages for everything the screen itself says. The item text comes
   from the bank; this is only chrome, and it is written the way §5 asks:
   supportive, plain, and free of any evaluation word. */

const UI: Record<string, { ar: string; en: string }> = {
  title: { ar: 'ملف العائلة', en: 'Family profile' },
  introLead: {
    ar: 'أسئلة بسيطة عن يوم طفلك: إزاي بيتواصل، بيلعب، وبيعمل حاجات بنفسه.',
    en: 'Simple questions about your child’s day: how they communicate, play and do things for themselves.',
  },
  introTime: { ar: 'بنعمله مرة واحدة — ١٥ سؤال قصير على الأكثر.', en: 'Once, and it is at most 15 short questions.' },
  careTitle: { ar: 'خدنا بالك من النقطة دي', en: 'We took this part carefully' },
  careBody: {
    ar: 'الشكر إنك شاركتينا. اللي بيحصل ده ماحدش غلطان فيه، ومفيش في IRIS درجة أو تقييم على حاجات زي كده — إحنا بس هنراعي الموضوع في ترتيب الأنشطة ومددها. لو الحاجة بتتكرر أو قوية، الدكتور اللي متابع معاكم هو أنسب حد يكلموه، وإحنا هنا معاكم.',
    en: 'Thank you for telling us. Nothing here is judged or scored — we simply shape the activities and their timing around it. If it keeps happening or feels strong, the clinician already following your child is the right person to talk to, and we are with you.',
  },
  careCta: { ar: 'تمام، نكمّل', en: 'Okay, continue' },
  followupWord: { ar: 'سؤال متابعة', en: 'Follow-up question' },
  introEdit: {
    ar: 'ونقدر نرجّع نعدّله في أي وقت؛ تقدّمك بيتحفظ لوحده.',
    en: 'We can come back and edit it any time; your progress saves by itself.',
  },
  introHonest: {
    ar: 'الملف ده مش اختبار ولا بيفدي تشخيص — هو بس بيساعدنا نظبط التعلّم على مقاس طفلك.',
    en: 'This profile is not a test and gives no diagnosis — it only helps us fit learning to your child.',
  },
  normalise: {
    ar: 'الأطفال بينمو على أوقات مختلفة — إحنا بنرسم الصورة زي ما هي دلوقتي، ومش بنحكم على حد.',
    en: 'Children grow in their own order — we are mapping where things stand now, not judging anyone.',
  },
  start: { ar: 'يبدأ', en: 'Start' },
  resume: { ar: 'نكمّل من مكان ما وقفنا', en: 'Continue where you left off' },
  prev: { ar: 'السابق', en: 'Previous' },
  next: { ar: 'التالي', en: 'Next' },
  finish: { ar: 'خلصت', en: 'Done' },
  submit: { ar: 'أرسل الملف', en: 'Submit the profile' },
  suspend: { ar: 'حفظ وخروج مؤقت', en: 'Save and leave' },
  reviewTitle: { ar: 'مراجعة سريعة', en: 'Quick review' },
  reviewLead: {
    ar: 'دي الأقسام اللي جاوبتها. اضغط على أي قسم تشوف إجاباتك وتعدّلها.',
    en: 'These are the sections you answered. Tap any one to see and change your answers.',
  },
  reviewEmpty: { ar: 'لسه معندناش إجابات كتير — كمّل الأسئلة الأول.', en: 'Not many answers yet — carry on with the questions first.' },
  blockWord: { ar: 'قسم', en: 'Section' },
  questionWord: { ar: 'سؤال', en: 'Question' },
  ofWord: { ar: 'من', en: 'of' },
  answeredWord: { ar: 'إجابة', en: 'answers' },
  stillWord: { ar: 'لسه', en: 'none yet' },
  exampleWord: { ar: 'مثال', en: 'For example' },
  read: { ar: 'اسمع السؤال', en: 'Read it aloud' },
  stopRead: { ar: 'اقطع الصوت', en: 'Stop the audio' },
  otherLangHint: { ar: 'باللغة التانية', en: 'In the other language' },
  pickOne: { ar: 'اختار الإجابة اللي شبه طفلك', en: 'Pick the answer that fits your child' },
  pickMany: { ar: 'اختار كل اللي ينطبق', en: 'Pick everything that applies' },
  addOwn: { ar: 'أضف بنفسك', en: 'Add your own' },
  addBtn: { ar: 'إضافة', en: 'Add' },
  noteOptional: { ar: 'تحب تضيف تفصيل؟ (اختياري)', en: 'Want to add a detail? (optional)' },
  skipNote: { ar: 'مفيش سؤال بإجابة غلط — تقدر تسيبه وترجعله بعدين', en: 'No answer is wrong — you can leave it and come back' },
  tripletLead: { ar: 'المساعدة بتحصل إزاي؟', en: 'How does the help happen?' },
  metLead: { ar: 'الموضوع ده اتعامل إزاي لحد دلوقتي؟', en: 'How has this been handled so far?' },
  gateLead: { ar: 'الحاجة دي موجودة عند طفلك أصلاً؟', en: 'Does this happen for your child at all?' },
  gateNo: { ar: 'لأ، لسه ماخدش الفرصة', en: 'No — not yet an opportunity' },
  gateYes: { ar: 'أيوه، بتحصل', en: 'Yes — it happens' },
  submitting: { ar: 'بنلمّ الملف…', en: 'Putting the profile together…' },
  submitError: { ar: 'حصل مشكلة بسيطة — جرّب تاني', en: 'A small problem — please try again' },
  retry: { ar: 'حاول تاني', en: 'Try again' },
  savedLocal: { ar: 'محفوظ على الجهاز', en: 'Saved on this device' },
  savedServer: { ar: 'محفوظ على حسابك', en: 'Saved to your account' },
  langLabel: { ar: 'English', en: 'عربي' },
  childWord: { ar: 'عن', en: 'about' },
};

/* ── Small pure helpers ─────────────────────────────────────────────────── */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** Western numerals everywhere, per the project's numeral decision — Arabic
 *  text with Latin digits is what the target homes read off their own phones. */
const num = (n: number): string => String(n);

/**
 * The idempotency key from §1. Deterministic and generated ONCE per mount and
 * then persisted, never per render: `crypto.randomUUID` where the browser
 * offers it, a time+counter fallback where it does not (older WebView on
 * Android 4-ish hardware is the real case, not a hypothetical).
 */
let clientRefSeed = 0;
function makeClientRef(): string {
  try {
    const c = (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined);
    if (c && typeof c.randomUUID === 'function') return String(c.randomUUID());
  } catch { /* fall through to the deterministic fallback */ }
  clientRefSeed += 1;
  return `cg-${Date.now().toString(36)}-${clientRefSeed}`;
}

/** Answers are only ever read through these, so the two shapes a value can
 *  take (single code, or list of codes for `multi`) never leak into the UI. */
const codes = (a: Answer | undefined): Code[] =>
  a == null || a.v == null ? [] : Array.isArray(a.v) ? a.v.filter(x => typeof x === 'string' && x.length > 0) : [a.v];

const firstCode = (a: Answer | undefined): Code | undefined => (Array.isArray(a?.v) ? a!.v[0] : a?.v);

const isAnswered = (a: Answer | undefined): boolean =>
  !!a && (Array.isArray(a.v) ? a.v.length > 0 : (typeof a.v === 'string' && a.v.length > 0));

/**
 * An item is "done" when its own answer is in. The gate is a separate step, so
 * a `gate_ability` item still needs its ability answer before it counts; a gate
 * answered `not_yet_chance` completes the item on its own (§0.5 — the opportunity
 * answer IS the answer).
 */
function itemComplete(item: BankItem, answers: Answers): boolean {
  const a = answers[item.id];
  if (!isAnswered(a)) return false;
  if (item.format === 'gate_ability' && firstCode(a) !== GATE_NO) return false;
  return true;
}

/** Label for a code the bank did not supply text for (triplet / met rows). */
function codeLabel(code: Code, ar: boolean): string {
  const entry = CODE_LABELS[code];
  return entry ? (ar ? entry.ar : entry.en) : code;
}

/** The option list for the active language: bank labels win, code labels back them up. */
function optsFor(loc: BankLoc | undefined, ar: boolean): Array<{ v: Code; label: string }> {
  const list = Array.isArray(loc?.opts) ? loc!.opts! : [];
  return list
    .filter(o => o && typeof o.v === 'string')
    .map(o => ({ v: o.v, label: (typeof o.label === 'string' && o.label.trim()) || codeLabel(o.v, ar) }));
}

const locOf = (item: BankItem, ar: boolean): BankLoc => (ar ? item.ar : item.en) || (ar ? item.en : item.ar) || {};

/** The other language's question, shown as the muted subtitle line for bilingual homes (§5). */
const otherLoc = (item: BankItem, ar: boolean): BankLoc => (ar ? item.en : item.ar) || {};

/**
 * Age window (§2: age-scaled items such as S6). `childProfile.age` is years, so
 * months are `age * 12`; an absent age is read as 7 years, which is the middle
 * of the 4–10 band and the conservative choice — it keeps age-scaled items
 * visible rather than silently dropping them.
 */
function childAgeMonths(childProfile: { age?: number } | null | undefined): number {
  const years = Number(childProfile?.age);
  if (!Number.isFinite(years) || years <= 0) return 7 * 12;
  return Math.round(years * 12);
}

function ageVisible(item: BankItem, months: number): boolean {
  if (typeof item.ageMinMonths === 'number' && months < item.ageMinMonths) return false;
  if (typeof item.ageMaxMonths === 'number' && months > item.ageMaxMonths) return false;
  return true;
}

/**
 * Does a conditional follow-up fire? `when.answers` is a list of codes; a
 * `multi` parent answer matches when ANY of its chips is in the list.
 */
function followUpFires(when: { itemId?: string; answers?: Code[]; allOf?: { itemId: string; answers: Code[] }[] } | undefined, answers: Answers): boolean {
  if (!when) return false;
  const one = (itemId?: string, list?: Code[]) => {
    if (!itemId || !Array.isArray(list) || list.length === 0) return false;
    return codes(answers[itemId]).some(c => list.includes(c));
  };
  // cv2 adds { allOf: [...] } — every clause must match before the probe shows.
  if (Array.isArray(when.allOf) && when.allOf.length > 0) return when.allOf.every(c => one(c.itemId, c.answers));
  return one(when.itemId, when.answers);
}

/** The flat, derived step list. See the header comment for why it is derived. */
function buildSteps(blocks: BankBlock[], answers: Answers, months: number): Step[] {
  const steps: Step[] = [];
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const block of sorted) {
    const items = (block.items ?? []).filter(i => i && i.id && ageVisible(i, months));
    if (items.length === 0) continue;

    // §5: a block intro card opens every block, so the parent always knows
    // which part of the child's day they are being asked about.
    steps.push({ kind: 'block', id: `block:${block.id}`, block });

    for (const item of items) {
      const gateOpts = optsFor(item.gate?.ar, true).length || optsFor(item.gate?.en, false).length;
      if (item.format === 'gate_ability' && item.gate && gateOpts > 0) {
        // The gate is its OWN two-chip step (§2: opportunity is a first-class
        // answer, so it gets its own screen rather than being a fifth button).
        steps.push({ kind: 'gate', id: `gate:${item.id}`, block, item });
        // …and the ability step only exists once the gate says it happens.
        if (firstCode(answers[item.id]) !== GATE_NO) steps.push({ kind: 'item', id: `item:${item.id}`, block, item });
      } else {
        steps.push({ kind: 'item', id: `item:${item.id}`, block, item });
        // cv2: the self-harm tick opens a calm care card right where the worry
        // was voiced (approved draft, refinement 3). Not a question — it does
        // not count in the progress and blocks nothing.
        if (item.id === 'VQ8') {
          const vq8 = codes(answers[item.id]);
          if (vq8.some((c) => CARE_CARD_CODES.includes(c))) {
            steps.push({ kind: 'care', id: `care:${item.id}`, block, item });
          }
        }
      }

      // Interview logic: probes fire immediately after their parent answer.
      // Recursive: cv2 nests VQ5 → VQ5f → VQ5h (parts, then who helps).
      const pushFollowUps = (parent: BankItem) => {
        for (const fu of parent.followUps ?? []) {
          const child = fu?.item;
          if (!child || !child.id || !ageVisible(child, months)) continue;
          if (!followUpFires(fu.when, answers)) continue;
          steps.push({ kind: 'item', id: `item:${child.id}`, block, item: child });
          pushFollowUps(child);
        }
      };
      pushFollowUps(item);
    }
  }
  steps.push({ kind: 'review', id: 'review' });
  return steps;
}

/** Item steps only — the denominator of "سؤال X من Y" (block intros and the
 *  review screen are not questions and must not inflate the count). */
const questionSteps = (steps: Step[]): Step[] => steps.filter(s => s.kind === 'item' || s.kind === 'gate');

/** How many of an item's own answers are in, for the review screen's counts. */
function blockCounts(block: BankBlock, answers: Answers, months: number): { done: number; total: number } {
  const items = (block.items ?? []).filter(i => i && i.id && ageVisible(i, months));
  return { done: items.filter(i => itemComplete(i, answers)).length, total: items.length };
}

/* ── Choice atoms ───────────────────────────────────────────────────────
   Module scope on purpose: an inline-defined component gets a NEW type
   identity on every parent render, which remounts it and drops keyboard focus
   from the card that was just pressed. These two are pure props-in/DOM-out. */

const ChoiceCard = ({ active, onPress, children, wide }: { active: boolean; onPress: () => void; children: React.ReactNode; wide?: boolean }) => (
  <button type="button" role="radio" aria-checked={active} className={cx('cp-opt', active && 'cp-opt--on', wide && 'cp-opt--wide')} onClick={onPress} data-sfx="tap">
    <span className="cp-opt-body">{children}</span>
    <span className={cx('cp-opt-check', active && 'cp-opt-check--on')} aria-hidden="true">
      {active ? <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
    </span>
  </button>
);

const Chip = ({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) => (
  <button type="button" aria-pressed={active} className={cx('cp-chip', active && 'cp-chip--on')} onClick={onPress} data-sfx="tap">{children}</button>
);

/* ══════════════════════════════════════════════════════════════════════════
   The screen
   ══════════════════════════════════════════════════════════════════════════ */

export function CaregiverProfileScreen({ onSuspend, onComplete, demoSeed, forced = false }: CaregiverProfileScreenProps) {
  void demoSeed; // reserved: the bank is already deterministic, nothing to seed

  const { childProfile } = useApp();
  /* The draft API is keyed on the CHILD ROW id (server ownership check);
     childProfile has no id field — IrisContext.childDbId is the real source. */
  const { childDbId } = useIris();
  const { language, setLanguage } = useLanguage();
  const ar = language === 'ar';
  const { speak, stopSpeaking } = useAudio();
  const reduced = useReducedMotion();

  /* The bank is read once. `useMemo` with an empty key keeps the step
     identities stable across renders, which is what makes the derived index in
     `idx` mean the same question after every edit. */
  /* cv2 for fresh families; a draft stamped cv1 (server or local) resumes on
     its own bank — a family that already sat cv1 is never re-asked (spec). */
  const [vBank, setVBank] = useState<string>(CAREGIVER_V2_VERSION);
  const vBankRef = useRef(CAREGIVER_V2_VERSION);
  vBankRef.current = vBank;
  const blocks = useMemo(() => (vBank === CAREGIVER_BANK_VERSION
    ? (Array.isArray(getCaregiverBlocks()) ? getCaregiverBlocks() as BankBlock[] : [])
    : getCaregiverBlocksV2() as BankBlock[]), [vBank]);
  const months = useMemo(() => childAgeMonths(childProfile as { age?: number } | null), [childProfile]);

  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<'intro' | 'flow' | 'review' | 'busy'>('intro');
  // NOTE: 'submit' is the busy spinner only; the review screen is a step, so
  // landing on it flips phase to 'review' below in goNext().
  const [idx, setIdx] = useState(0);
  const [clientRef, setClientRef] = useState<string>(() => makeClientRef());
  const [saveState, setSaveState] = useState<'idle' | 'local' | 'server' | 'offline'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [ownText, setOwnText] = useState<Record<string, string>>({}); // free-text 'add own' buffer per item
  const [restored, setRestored] = useState(false);
  const startAtRef = useRef<number | null>(null);

  const steps = useMemo(() => buildSteps(blocks, answers, months), [blocks, answers, months]);
  const qs = useMemo(() => questionSteps(steps), [steps]);
  /* cv2: short conditional probes ride between core questions. They are
     follow-ups, not new questions — the 'question X of Y' counter counts
     CORE questions only, so the 'at most 15' promise holds on every path. */
  const PROBE_FLOW_IDS = ['VQ1v', 'VQ6s', 'VQ3f', 'VQ5f', 'VQ5h', 'VQ6m', 'VQ9f'];
  const coreQs = useMemo(() => qs.filter(x => !(x.kind === 'item' && PROBE_FLOW_IDS.includes(x.item?.id || ''))), [qs]);
  const step: Step | undefined = steps[Math.min(idx, steps.length - 1)];
  const qNo = step ? coreQs.findIndex(s => s.id === step.id) + 1 : 0;
  const isProbeStep = !!step && step.kind === 'item' && PROBE_FLOW_IDS.includes(step.item?.id || '');

  /* Wash rotation, by block order rather than array position, so editing an
     answer (which can add or remove a step) never repaints the card. */
  const blockOrder = useMemo(() => {
    const map: Record<string, number> = {};
    [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach((b, i) => { map[b.id] = i; });
    return map;
  }, [blocks]);
  /* The step union is narrowed ONCE here rather than with optional chains at
     every read, so `block` / `item` stay type-safe instead of being asserted. */
  const stepBlockId = step && step.kind !== 'review' ? step.block.id : '';
  const answeredQs = qs.filter(s => (s.kind === 'item' || s.kind === 'gate') && itemComplete(s.item, answers)).length;
  const wash = WASHES[(blockOrder[stepBlockId] ?? 0) % WASHES.length];

  const T = useCallback((key: keyof typeof UI) => UI[key]?.[ar ? 'ar' : 'en'] ?? String(key), [ar]);

  /* ── Autosave ───────────────────────────────────────────────────────────
     localStorage first and synchronously (it is the safety net that must never
     fail), then the server draft debounced by 800ms and swallowed silently.
     A parent on a flaky 3G connection keeps every answer regardless. */
  const serverTimer = useRef<number | null>(null);
  const submittedRef = useRef(false); // after submit, autosave is done
  const latest = useRef<{ answers: Answers; clientRef: string; bankVersion: string }>({ answers, clientRef, bankVersion: vBank });
  latest.current = { answers, clientRef, bankVersion: vBank };

  const postDraft = useCallback(async (status: 'IN_PROGRESS' | 'COMPLETE') => {
    const { answers: a, clientRef: ref, bankVersion: bv } = latest.current;
    const body = {
      childId: childDbId ?? (childProfile as unknown as { id?: string } | null)?.id ?? null,
      clientRef: ref,
      responses: a,
      status,
      bankVersion: bv,
      updatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`${API_URL}/caregiver/draft`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) setSaveState('server');
      else setSaveState('offline');
    } catch { setSaveState('offline'); }
  }, [childProfile, childDbId]);

  const queueSave = useCallback((next: Answers) => {
    // 1. the local net, written on every answer, never debounced
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        responses: next, itemId: steps[idx]?.kind === 'item' || steps[idx]?.kind === 'gate' ? steps[idx]?.id : null,
        bankVersion: vBankRef.current, clientRef, updatedAt: new Date().toISOString(),
      }));
      setSaveState(prev => (prev === 'server' ? prev : 'local'));
    } catch { /* private mode: the server copy is still queued below */ }
    // 2. the cross-device copy, debounced so a fast run of answers is one call
    if (serverTimer.current) window.clearTimeout(serverTimer.current);
    if (submittedRef.current) return;
    serverTimer.current = window.setTimeout(() => { void postDraft('IN_PROGRESS'); }, 800);
  }, [clientRef, idx, steps, postDraft]);

  useEffect(() => () => { if (serverTimer.current) window.clearTimeout(serverTimer.current); }, []);

  const record = useCallback((itemId: string, patch: Answer, opts?: { keepIndex?: boolean }) => {
    setAnswers(prev => {
      const merged: Answers = { ...prev, [itemId]: { ...(prev[itemId] ?? {}), ...patch } };
      queueSave(merged);
      // Answering a gate is the one moment the step list changes shape under us:
      // `not_yet_chance` removes the ability step, so the index must be clamped.
      if (!opts?.keepIndex) queueMicrotask(() => setIdx(i => Math.min(i, steps.length)));
      return merged;
    });
  }, [queueSave, steps.length]);

  /* ── Resume (§5: "continue later lands exactly where left off, cross-device") */
  const bootRef = useRef(false);
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    let local: any = null;

        try { local = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { local = null; }
    if (local?.clientRef) setClientRef(local.clientRef);
    if (Object.keys(local?.responses || {}).length) {
      const stamped = local?.bankVersion === CAREGIVER_BANK_VERSION || local?.bankVersion === CAREGIVER_V2_VERSION
        ? local.bankVersion : inferBankFromResponses(local?.responses);
      setVBank(stamped);
      vBankRef.current = stamped;
    }
    const localStamp = local?.updatedAt ? Date.parse(local.updatedAt) : 0;

    const applyLocal = () => {
      if (local?.responses && Object.keys(local.responses).length) {
        setAnswers(local.responses);
        setRestored(true);
        setPhase('flow');
        // resume at the saved item, else at the first unanswered one
        const want = local.itemId ? String(local.itemId).replace(/^(item|gate):/, '') : null;
        const list = buildSteps(blocks, local.responses, months);
        const byId = want ? list.findIndex(s => s.id === `item:${want}` || s.id === `gate:${want}`) : -1;
        const firstOpen = list.findIndex(s => (s.kind === 'item' || s.kind === 'gate') && s.item && !itemComplete(s.item, local.responses!));
        setIdx(byId >= 0 ? byId : firstOpen >= 0 ? firstOpen : 0);
      }
    };

    // Server copy wins when it is newer than this device's; otherwise local wins.
    const childId = childDbId ?? ((childProfile as unknown as { id?: string } | null)?.id ?? null);
    fetch(`${API_URL}/caregiver/draft?childId=${encodeURIComponent(childId ?? '')}`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(raw => {
        // the endpoint wraps the draft: { ok, draft: { responses… } } — accept
        // both shapes (a real bug caught by the cv1-resume regression test).
        const data = (raw && (raw as { draft?: unknown }).draft) || raw;
        const serverStamp = data?.updatedAt ? Date.parse(data.updatedAt) : 0;
        const done = (data as { status?: string })?.status === 'COMPLETE';
        if (!done && data?.responses && Object.keys(data.responses).length && serverStamp >= localStamp) {
          setAnswers(data.responses as Answers);
          setClientRef(data.clientRef || clientRef);
          const serverBank = (data as { bankVersion?: string })?.bankVersion === CAREGIVER_BANK_VERSION
            ? CAREGIVER_BANK_VERSION : inferBankFromResponses(data.responses as Answers);
          setVBank(serverBank);
          vBankRef.current = serverBank;
          setRestored(true); setPhase('flow'); setSaveState('server');
          const list = buildSteps(serverBank === CAREGIVER_BANK_VERSION ? getCaregiverBlocks() as BankBlock[] : getCaregiverBlocksV2() as BankBlock[], data.responses as Answers, months);
          const firstOpen = list.findIndex(s => (s.kind === 'item' || s.kind === 'gate') && s.item && !itemComplete(s.item, data.responses as Answers));
          setIdx(firstOpen >= 0 ? firstOpen : 0);
        } else {
          applyLocal();
        }
      })
      .catch(() => applyLocal()); // offline or 404: the local net decides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Read-aloud ───────────────────────────────────────────────────────────
     `speak(text, language)` from AudioContext. The speaker press is itself the
     user gesture that unlocks the audio context, so nothing else is needed. */
  const spokenBlocks = useRef<Set<string>>(new Set());
  const sayItem = useCallback((item: BankItem) => {
    const loc = locOf(item, ar);
    const other = otherLoc(item, ar);
    const text = [loc.q, loc.ex ? `${ar ? 'مثال: ' : 'For example: '}${loc.ex}` : '', other.q]
      .filter(Boolean).join(ar ? ' — ' : '. ');
    speak(text, language);
  }, [ar, language, speak]);

  // X5 asks the family's preferred format; 'audio' auto-reads the first item
  // of every block, once, and the stop button (or the next press) ends it.
  const preferred = String(firstCode(answers['X5']) ?? firstCode(answers['VPREF']) ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('iris_display_pref') : '') ?? '');
  useEffect(() => {
    if (phase !== 'flow' || !step || step.kind !== 'item' || !step.item) return;
    if (!/audio|both/i.test(preferred)) return;
    const key = step.block?.id ?? '?';
    const firstOfBlock = steps.find(s => s.kind === 'item' && s.block?.id === key);
    if (firstOfBlock?.id !== step.id || spokenBlocks.current.has(key)) return;
    spokenBlocks.current.add(key);
    sayItem(step.item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, phase, preferred]);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  const goBack = useCallback(() => {
    if (idx <= 0) { setPhase('intro'); setIdx(0); return; }
    setIdx(i => Math.max(0, i - 1)); // back NEVER clears an answer (§5)
  }, [idx]);

  const goNext = useCallback(() => {
    const next = Math.min(idx + 1, steps.length - 1);
    setIdx(next);
    if (steps[next]?.kind === 'review') setPhase('review');
  }, [idx, steps]);

  const jumpTo = useCallback((stepId: string) => {
    const at = steps.findIndex(s => s.id === stepId);
    if (at >= 0) { setIdx(at); setPhase('flow'); setOpenBlock(null); }
  }, [steps]);

  const submit = useCallback(async () => {
    setSubmitError(null);
    setPhase('busy');
    // §5: the review step's idx autosave can still be in flight; a late
    // IN_PROGRESS write must never land after this COMPLETE.
    if (serverTimer.current) window.clearTimeout(serverTimer.current);
    submittedRef.current = true;
    // A visible beat for the spinner, then the engine does the reading.
    await new Promise((r) => setTimeout(r, 450));
    try {
      // §5: a brief spinner so the work is visible, then the engine does the
      // reading. The scored object is passed straight through — this screen
      // interprets nothing of its own.
      const probes = ['VQ1v', 'VQ6s', 'VQ3f', 'VQ5f', 'VQ5h', 'VQ6m', 'VQ9f'];
      const metrics = vBank === CAREGIVER_V2_VERSION ? {
        bank: vBank,
        durationSeconds: startAtRef.current ? Math.round((Date.now() - startAtRef.current) / 1000) : null,
        probesShown: steps.filter((st) => st.kind === 'item' && probes.includes(st.item?.id || '')).length,
        careCardShown: steps.some((st) => st.kind === 'care'),
      } : null;
      const scored = vBank === CAREGIVER_BANK_VERSION
        ? scoreCaregiverProfile({ responses: answers, meta: { childAgeMonths: months, completed: true } })
        : scoreCaregiverV2({ responses: answers, meta: { childAgeMonths: months, completed: true, metrics } });
      if (vBank === CAREGIVER_V2_VERSION) {
        const pref = String(firstCode(answers['VPREF']) ?? 'both');
        try { localStorage.setItem('iris_display_pref', pref); } catch { /* non-critical */ }
      }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ responses: answers, bankVersion: vBankRef.current, clientRef, status: 'COMPLETE', itemId: null, updatedAt: new Date().toISOString() })); } catch { /* silent */ }
      await postDraft('COMPLETE'); // best-effort; a local COMPLETE still stands
      onComplete(answers, scored);
    } catch {
      setSubmitError(T('submitError'));
      setPhase('review');
    }
  }, [answers, months, clientRef, postDraft, onComplete, T]);

  /* ── One item card, whatever its format ───────────────────────────────── */
  const ItemBody = ({ item }: { item: BankItem }) => {
    const loc = locOf(item, ar);
    const other = otherLoc(item, ar);
    const a = answers[item.id] ?? {};
    const fmt = item.format ?? 'single';
    const opts = optsFor(loc, ar);
    const chosen = codes(a);

    return (
      <div className={cx('cp-item', reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
        <p className="cp-q">{loc.q}</p>
        {other.q && other.q !== loc.q && <p className="cp-q-alt">{other.q}</p>}
        {loc.ex && <p className="cp-ex"><span className="cp-ex-label">{T('exampleWord')}</span>{loc.ex}</p>}

        {fmt === 'opentext' ? (
          <div className="cp-field">
            <label className="cp-label" htmlFor={`cp-t-${item.id}`}>{T('noteOptional')}</label>
            <textarea id={`cp-t-${item.id}`} className="cp-textarea" rows={3} value={String(a.note ?? a.v ?? '')}
              onChange={(e) => record(item.id, { note: e.target.value, v: e.target.value })} />
          </div>
        ) : fmt === 'multi' ? (
          <div className="cp-multi">
            <p className="cp-hint">{T('pickMany')}</p>
            <div className="cp-chips" role="group" aria-label={T('pickMany')}>
              {opts.map(o => <Chip key={o.v} active={chosen.includes(o.v)}
                onPress={() => record(item.id, { v: chosen.includes(o.v) ? chosen.filter(x => x !== o.v) : [...chosen, o.v] })}>{o.label}</Chip>)}
            </div>
            {AddOwn({ item, chosen })}
          </div>
        ) : (
          <div className="cp-opts" role="radiogroup" aria-label={loc.q}>
            <p className="cp-hint">{T('pickOne')}</p>
            {opts.map(o => (
              <ChoiceCard key={o.v} active={firstCode(a) === o.v} wide={opts.length <= 3}
                onPress={() => record(item.id, { v: o.v })}>{o.label}</ChoiceCard>
            ))}
          </div>
        )}

        {/* Support triplet: only once an answer says help is involved (§2). */}
        {item.triplet && TRIPLET_TRIGGERS.includes(String(firstCode(a))) && (
          <div className="cp-triplet">
            <p className="cp-sub-lead">{T('tripletLead')}</p>
            {TRIPLET_ROWS.map(row => (
              <div className="cp-trow" key={row.key}>
                <span className="cp-tlabel">{ar ? row.ar : row.en}</span>
                <div className="cp-topts" role="radiogroup" aria-label={ar ? row.ar : row.en}>
                  {row.codes.map(c => (
                    <button type="button" key={c} role="radio" aria-checked={a[row.key] === c}
                      className={cx('cp-topt', a[row.key] === c && 'cp-topt--on')}
                      onClick={() => record(item.id, { [row.key]: c } as Answer)}>{codeLabel(c, ar)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Met / unmet (§0.6: only unmet needs become learning levers). */}
        {item.metUnmet && (
          <div className="cp-met">
            <p className="cp-sub-lead">{T('metLead')}</p>
            <div className="cp-chips" role="radiogroup" aria-label={T('metLead')}>
              {MET_CODES.map(c => (
                <Chip key={c} active={a.met === c} onPress={() => record(item.id, { met: c })}>{codeLabel(c, ar)}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /** "أضف بنفسك" — a free-text chip the family can add to any multi list (G1/G2/H6). */
  const AddOwn = ({ item, chosen }: { item: BankItem; chosen: Code[] }) => {
    const custom = (item.ar?.opts?.length ?? 0) > 0 ? chosen.filter(c => !(item.ar!.opts || []).some(o => o.v === c)) : chosen;
    const text = ownText[item.id] ?? '';
    const setText = (val: string) => setOwnText(prev => ({ ...prev, [item.id]: val }));
    return (
      <div className="cp-own">
        <label className="cp-label" htmlFor={`cp-own-${item.id}`}>{T('addOwn')}</label>
        <div className="cp-own-row">
          <input id={`cp-own-${item.id}`} className="cp-own-input" value={text} placeholder={T('addOwn')}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { e.preventDefault(); add(); } }} />
          <button type="button" className="cp-own-btn" onClick={add} disabled={!text.trim()}>{T('addBtn')}</button>
        </div>
        {custom.length > 0 && (
          <div className="cp-chips cp-chips--custom">
            {custom.map(c => <Chip key={c} active onPress={() => record(item.id, { v: chosen.filter(x => x !== c) })}>{c}</Chip>)}
          </div>
        )}
      </div>
    );

    function add() {
      const v = text.trim();
      if (!v) return;
      record(item.id, { v: [...chosen, v] });
      setText('');
    }
  };

  /* ── Screens ──────────────────────────────────────────────────────────── */

  const Speaker = ({ onSay }: { onSay: () => void }) => (
    <button type="button" className="cp-say" onClick={() => { onSay(); }} data-sfx="tap"
      aria-label={T('read')} title={T('read')}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );

  const head = (
    <header className="cp-head" dir={ar ? 'rtl' : 'ltr'}>
      <div className="cp-head-row">
        {!forced && onSuspend ? (
          <button type="button" className="cp-home" onClick={onSuspend} data-sfx="tap">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>{T('suspend')}</span>
          </button>
        ) : <span className="cp-home cp-home--spacer" aria-hidden="true" />}
        <span className={cx('cp-save', `cp-save--${saveState}`)} role="status" aria-live="polite">
          {saveState === 'server' ? T('savedServer') : saveState === 'local' || saveState === 'offline' ? T('savedLocal') : ''}
        </span>
      </div>
      {phase !== 'intro' && (
        <div className="cp-progress">
          <div className="cp-progress-meta">
            <span className="cp-count">
              {step?.kind === 'review'
                ? T('reviewTitle')
                : step?.kind === 'block' || step?.kind === 'care'
                  ? `${T('blockWord')} ${num((blockOrder[step.block.id] ?? 0) + 1)} ${T('ofWord')} ${num(blocks.length)}`
                  : isProbeStep
                    ? T('followupWord')
                    : `${T('questionWord')} ${num(qNo)} ${T('ofWord')} ${num(coreQs.length)}`}
            </span>
            <span className="cp-pct" aria-hidden="true">{num(Math.round((answeredQs / Math.max(1, qs.length)) * 100))}%</span>
          </div>
          <div className="cp-track" aria-hidden="true"><span className="cp-track-fill" style={{ inlineSize: `${(qNo / Math.max(1, coreQs.length)) * 100}%` }} /></div>
          <div className="cp-dots" role="group" aria-label={T('blockWord')}>
            {blocks.map(b => {
              const c = blockCounts(b, answers, months);
              const on = stepBlockId === b.id;
              return (
                <button type="button" key={b.id} className={cx('cp-dot', on && 'cp-dot--on', c.done >= c.total && c.total > 0 && 'cp-dot--full')}
                  title={ar ? b.titleAr : b.titleEn} aria-label={ar ? b.titleAr : b.titleEn} onClick={() => jumpTo(`block:${b.id}`)} />
              );
            })}
          </div>
        </div>
      )}
    </header>
  );

  const body = (() => {
    if (!step) return null;

    if (step.kind === 'block') {
      const b = step.block;
      return (
        <section className={cx('cp-card', 'cp-card--block', `cp-wash--${wash}`, reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
          <span className="cp-block-icon" aria-hidden="true">{b.icon || '✨'}</span>
          <h2 className="cp-block-title">{ar ? b.titleAr : b.titleEn}</h2>
          {b.titleEn && b.titleEn !== b.titleAr && <p className="cp-q-alt">{ar ? b.titleAr : b.titleEn}</p>}
          {(b.blurbAr || b.blurbEn) && <p className="cp-block-blurb">{ar ? b.blurbAr : b.blurbEn}</p>}
          <p className="cp-normalise">{T('normalise')}</p>
          <div className="cp-nav">
            <button type="button" className="cp-ghost" onClick={goBack} data-sfx="tap">{T('prev')}</button>
            <button type="button" className="cp-cta" onClick={goNext} data-sfx="tap"><span>{T('next')}</span></button>
          </div>
        </section>
      );
    }

    if (step.kind === 'care') {
      return (
        <section className={cx('cp-card', 'cp-card--care', `cp-wash--${wash}`, reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'} role="note">
          <div className="cp-card-top">
            <span className="cp-kicker">{ar ? step.block.titleAr : step.block.titleEn}</span>
          </div>
          <span className="cp-care-heart" aria-hidden="true">💙</span>
          <h2 className="cp-care-title">{T('careTitle')}</h2>
          <p className="cp-care-body">{T('careBody')}</p>
          <div className="cp-nav cp-nav--end">
            <button type="button" className="cp-cta cp-cta--care" onClick={goNext} data-sfx="tap"><span>{T('careCta')}</span></button>
          </div>
        </section>
      );
    }
    if (step.kind === 'gate') {
      const item = step.item;
      const a = answers[item.id] ?? {};
      const g = (ar ? item.gate?.ar : item.gate?.en) || (ar ? item.gate?.en : item.gate?.ar) || {};
      const gopts = optsFor(g, ar);
      return (
        <section className={cx('cp-card', `cp-wash--${wash}`, reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
          <div className="cp-card-top">
            <span className="cp-kicker">{ar ? step.block.titleAr : step.block.titleEn}</span>
            <Speaker onSay={() => sayItem(item)} />
          </div>
          <p className="cp-q">{g.q || locOf(item, ar).q}</p>
          {(g.ex || locOf(item, ar).ex) && <p className="cp-ex"><span className="cp-ex-label">{T('exampleWord')}</span>{g.ex || locOf(item, ar).ex}</p>}
          <p className="cp-q-alt">{otherLoc(item, ar).q || g.q || ''}</p>
          <div className="cp-opts cp-opts--gate" role="radiogroup" aria-label={T('gateLead')}>
            {/* The opportunity answer is offered FIRST and reads as equally fine. */}
            {gopts.length ? gopts.map(o => (
              <ChoiceCard key={o.v} active={firstCode(a) === o.v} onPress={() => record(item.id, { v: o.v })}>{o.label}</ChoiceCard>
            )) : (
              <>
                <ChoiceCard active={firstCode(a) === GATE_NO} onPress={() => record(item.id, { v: GATE_NO })}>{T('gateNo')}</ChoiceCard>
                <ChoiceCard active={firstCode(a) === GATE_YES} onPress={() => record(item.id, { v: GATE_YES })}>{T('gateYes')}</ChoiceCard>
              </>
            )}
          </div>
          <p className="cp-hint cp-hint--soft">{T('skipNote')}</p>
          <div className="cp-nav">
            <button type="button" className="cp-ghost" onClick={goBack} data-sfx="tap">{T('prev')}</button>
            <button type="button" className="cp-cta" onClick={goNext} disabled={!isAnswered(a)} data-sfx="tap"><span>{T('next')}</span></button>
          </div>
        </section>
      );
    }

    if (step.kind === 'item') {
      const item = step.item;
      return (
        <section className={cx('cp-card', `cp-wash--${wash}`, reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
          <div className="cp-card-top">
            <span className="cp-kicker">{ar ? step.block.titleAr : step.block.titleEn}</span>
            <div className="cp-card-top-actions">
              <button type="button" className="cp-say cp-say--stop" onClick={() => stopSpeaking()} aria-label={T('stopRead')} title={T('stopRead')}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6h12v12H6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
              </button>
              <Speaker onSay={() => sayItem(item)} />
            </div>
          </div>
          {ItemBody({ item })}
          <div className="cp-nav">
            <button type="button" className="cp-ghost" onClick={goBack} data-sfx="tap">{T('prev')}</button>
            <button type="button" className="cp-cta" onClick={goNext} data-sfx="tap"><span>{steps[idx + 1]?.kind === 'review' || idx === steps.length - 2 ? T('finish') : T('next')}</span></button>
          </div>
        </section>
      );
    }

    // REVIEW: the blocks, their answered counts, and a way into every answer.
    return (
      <section className={cx('cp-card', 'cp-card--review', reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
        <h2 className="cp-review-title">{T('reviewTitle')}</h2>
        <p className="cp-block-blurb">{T('reviewLead')}</p>
        <div className="cp-review">
          {blocks.map(b => {
            const c = blockCounts(b, answers, months);
            const open = openBlock === b.id;
            const items = (b.items ?? []).filter(i => i && i.id && ageVisible(i, months));
            return (
              <div className={cx('cp-rblock', `cp-wash--${WASHES[(blockOrder[b.id] ?? 0) % WASHES.length]}`)} key={b.id}>
                <button type="button" className="cp-rhead" onClick={() => setOpenBlock(open ? null : b.id)} aria-expanded={open} data-sfx="tap">
                  <span className="cp-ricon" aria-hidden="true">{b.icon || '✨'}</span>
                  <span className="cp-rtitle">{ar ? b.titleAr : b.titleEn}</span>
                  <span className="cp-rmeta">{c.done > 0 ? `${num(c.done)}/${num(c.total)} ${T('answeredWord')}` : T('stillWord')}</span>
                </button>
                {open && (
                  <ul className="cp-ritems">
                    {items.map(i => (
                      <li key={i.id}>
                        <button type="button" className={cx('cp-ritem', itemComplete(i, answers) && 'cp-ritem--done')}
                          onClick={() => jumpTo(steps.find(s => s.kind === 'item' && s.item?.id === i.id)?.id || `item:${i.id}`)} data-sfx="tap">
                          <span className="cp-ritem-q">{locOf(i, ar).q}</span>
                          <span className="cp-ritem-a">{itemComplete(i, answers) ? (codes(answers[i.id]).map(cd => codeLabel(cd, ar)).join(' · ') || '✓') : '—'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        {answeredQs < qs.length && (
          <p className="cp-note">{T('reviewEmpty')}</p>
        )}
        {submitError && <p className="cp-err" role="alert">{submitError}</p>}
        <div className="cp-nav cp-nav--end">
          <button type="button" className="cp-ghost" onClick={() => { setPhase('flow'); setIdx(Math.max(0, idx - 1)); }} data-sfx="tap">{T('prev')}</button>
          {submitError
            ? <button type="button" className="cp-cta cp-cta--finish" onClick={() => void submit()} data-sfx="tap"><span>{T('retry')}</span></button>
            : <button type="button" className="cp-cta cp-cta--finish" onClick={() => void submit()} data-sfx="tap"><span>{T('submit')}</span></button>}
        </div>
      </section>
    );
  })();

  /* ── Root ─────────────────────────────────────────────────────────────── */
  return (
    <div className="cp-root" data-accent="blue" dir={ar ? 'rtl' : 'ltr'}>
      <div className="cp-decor" aria-hidden="true">
        <span className="cp-blob cp-blob--1" /><span className="cp-blob cp-blob--2" />
      </div>

      {head}

      <main className="cp-main">
        {phase === 'intro' ? (
          <section className={cx('cp-card', 'cp-card--intro', reduced && 'cp-item--still')} dir={ar ? 'rtl' : 'ltr'}>
            <h1 className="cp-intro-title">{T('title')}</h1>
            <p className="cp-intro-lead">{T('introLead')}</p>
            <ul className="cp-intro-points">
              <li>{T('introTime')}</li>
              <li>{T('introEdit')}</li>
              <li>{T('introHonest')}</li>
            </ul>
            {restored && Object.keys(answers).length > 0 && (
              <p className="cp-note cp-note--warm">{T('resume')}</p>
            )}
            <div className="cp-nav cp-nav--end">
              {!forced && onSuspend ? (
                <button type="button" className="cp-ghost" onClick={onSuspend} data-sfx="tap">{T('suspend')}</button>
              ) : null}
              <button type="button" className="cp-cta cp-cta--start"
                onClick={() => {
                  if (!startAtRef.current) startAtRef.current = Date.now();
                  const list = buildSteps(blocks, answers, months);
                  const firstOpen = list.findIndex(s => (s.kind === 'item' || s.kind === 'gate') && s.item && !itemComplete(s.item, answers));
                  setIdx(Object.keys(answers).length && firstOpen >= 0 ? firstOpen : 0);
                  setPhase('flow');
                }} data-sfx="tap">
                <span>{Object.keys(answers).length ? T('resume') : T('start')}</span>
              </button>
            </div>
          </section>
        ) : phase === 'busy' ? (
          <section className="cp-card cp-card--submit" role="status" aria-live="polite" dir={ar ? 'rtl' : 'ltr'}>
            <span className={cx('cp-spin', reduced && 'cp-spin--still')} aria-hidden="true" />
            <p className="cp-intro-lead">{T('submitting')}</p>
          </section>
        ) : (
          <div className="cp-stack">{body}</div>
        )}
      </main>

      <div className="cp-lang">
        <button type="button" className="cp-langbtn" onClick={() => setLanguage(ar ? 'en' : 'ar')} aria-label={T('langLabel')}>{T('langLabel')}</button>
      </div>
    </div>
  );
}

export default CaregiverProfileScreen;
