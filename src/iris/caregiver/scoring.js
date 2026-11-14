/**
 * IRIS — Caregiver profile scoring (contract cv1).
 *
 * Pure, deterministic. NO key named score / composite / totalScore is ever
 * emitted, and a null or missing answer is NEVER coerced to 0: an unanswered
 * item simply does not exist in the counts, so it can never become
 * `does_not_yet` (§0.1, §3, audit W9).
 *
 * ── OPPORTUNITY IS NOT INABILITY (§0.5) ──────────────────────────────────
 * An answer of `not_yet_chance` (band `opportunity`) is removed from the
 * eligible denominator of every ratio and is counted only in `notYetCount`.
 * A block where most answers are `not_yet_chance` becomes
 * `not_yet_opportunity`, which is a statement about the environment.
 *
 * ── STATE RULES, per scored block (C,L,S,M,P,H), applied in this order ────
 *  eligible  = age-applicable scored items; answered = items with a real
 *              answer; bandExcluded = `opportunity` (gate-failed) answers.
 *  ratios run over BANDED answers only (the four support bands).
 *  S1 answered < 50% of eligible                       -> needs_more_information
 *  S2 majority(>50%) of answered are `not_yet_chance`  -> not_yet_opportunity
 *  S3 any band hands_on|does_not_yet AND met==='unmet' -> unmet_need
 *  S4 independent/banded >= 75% AND hands_on === 0     -> does_independently
 *  S5 (little_help+hands_on)/banded > 50%              -> does_with_support
 *  S6 any independent present (mixed picture)          -> emerging
 *  S7 banded answers exist, none independent           -> does_with_support
 *
 * ── CONFIDENCE, per block (about OUR information, never about the child) ──
 *  HIGH            meta.completed && answeredShare >= 0.90 && no contradiction
 *  MEDIUM          answeredShare >= 0.65
 *  LOW             answeredShare >= 0.50
 *  NEEDS_MORE_INFO below 0.50
 *  A follow-up contradiction (support given where the answer says the child
 *  does it alone, or a triplet/met answer on a gate-failed item) caps HIGH.
 *
 * ── SUPPORT INTENSITY (framework §3) ─────────────────────────────────────
 * Majority `type` / `frequency` / `time` of the block's supported items, kept
 * as three separate values. NEVER summed, never averaged into a number.
 */
import { CAREGIVER_BANK_VERSION, getCaregiverBlocks, bandFor } from './bank.js';

const BANDS = ['independent', 'little_help', 'hands_on', 'does_not_yet'];
const SUPPORTED = ['little_help', 'hands_on', 'does_not_yet'];
const BLOCK_IDS = ['C', 'L', 'S', 'M', 'P', 'H'];
const HOURS = { lt2: 1.5, '2_4': 3, '4_6': 5, '6_plus': 7, lt1: 0.5, '1_3': 2, '3_6': 4.5, '6_plus_week': 7 };

const majorityOf = (list) => {
  const tally = new Map();
  for (const v of list) if (typeof v === 'string' && v) tally.set(v, (tally.get(v) || 0) + 1);
  let best = null;
  for (const [v, n] of tally) if (!best || n > best[1]) best = [v, n];
  return best ? best[0] : null;
};
const asList = (r) => (!r ? [] : Array.isArray(r.v) ? r.v : typeof r.v === 'string' && r.v.includes(',')
  ? r.v.split(',').map((s) => s.trim()).filter(Boolean) : (r.v ? [r.v] : []));
const ageOk = (item, months) => (typeof months !== 'number' || !Number.isFinite(months)
  ? true : (item.ageMinMonths === undefined || months >= item.ageMinMonths)
    && (item.ageMaxMonths === undefined || months <= item.ageMaxMonths));

/** Copy for each state, in both languages. Words a parent can read aloud. */
const WATCH = {
  C: { unmet_need: ['اللي بيقول بيه محتاج وسيلة — هنفضل نبحث عن طريقة توصله لكلامه.', 'The way he gets his meaning out needs a channel — keep looking for one that works.'], emerging: ['بيتواصل لكن مش في كل المواقف — جرّب تسأله بطريقة واحدة في اليوم بالظبط.', 'He communicates, but not in every situation — try one question style a day.'], does_independently: ['مفيش حاجة قلقانة منها في التواصل دلوقتي.', 'Nothing to watch in communication right now.'], does_with_support: ['بيوصل كلامه لكن بمساعدة — خلي المساعدة ثابتة مش متغيرة.', 'He gets his meaning across with help — keep the help the same each time.'], not_yet_opportunity: ['مفيش فرص كافية يتكلم فيها — زيّد المواقف قبل ما تزوّد الطلب.', 'Not enough chances to communicate — add situations before adding demands.'], needs_more_information: ['لسه محتاجين نعرف أكتر عن طريقة تواصله.', 'We still need to know more about how he communicates.'] },
  L: { unmet_need: ['فيه حاجة يومية محتاجة دعم ومفيش حد بيساعد فيها.', 'An everyday learning task needs support and nobody is helping with it.'], emerging: ['بيتعلم في روتين وبيلخبط في تاني — ثبّت الروتين الأول.', 'He learns in one routine and not in another — fix the routine first.'], does_independently: ['بيحل مشاكله اليومية لوحده — مفيش حاجة نتابعها.', 'He solves everyday problems on his own — nothing to watch.'], does_with_support: ['بياخد خطوة مساعدة في النشاطات — قلّلها بالتدريج مش مرة واحدة.', 'He takes a helping step in activities — fade it slowly, not at once.'], not_yet_opportunity: ['محروم من فرص تجربة حاجات — الحوافز مش التكرار.', 'He is missing chances to try things — access first, drills later.'], needs_more_information: ['محتاجين نعرف أكتر عن يومه العادي.', 'We need to know more about his ordinary day.'] },
  S: { unmet_need: ['مفيش حد بيساعد في حاجة يومية محتاجة دعم.', 'Nobody is helping with a daily-life task that needs support.'], emerging: ['العناية بالنفس ماشية في مكان ولسه في مكان تاني.', 'Self-care works in one place and not in another.'], does_independently: ['بيعتمد على نفسه في أغلب اليوم.', 'He depends on himself for most of the day.'], does_with_support: ['محتاج تذكير أو لمسة بداية في خطوة من الخطوات.', 'He needs a prompt or a hand-start for one of the steps.'], not_yet_opportunity: ['الفرصة ما اتاتش — روتين يومي ثابت هو المطلوب الأول.', 'The chance has not come — a steady daily routine is the first need.'], needs_more_information: ['لسه ما عرفناش كفاية عن العناية بنفسه.', 'We do not know enough about self-care yet.'] },
  M: { unmet_need: ['فيه حاجة في الحركة أو الإمساك محتاجة دعم ومفيش مساند.', 'Something in movement or holding needs support and nothing is backing it.'], emerging: ['بيتحرك كويس في مكان ومش في مكان تاني.', 'He moves well in one place and not in another.'], does_independently: ['الحركة واستخدام الإيدين شغالين كويس.', 'Movement and hand use work well.'], does_with_support: ['محتاج ترتيب مكان أو مسكة عشان يوصل للحاجة.', 'He needs the space arranged, or a hold, to reach the thing.'], not_yet_opportunity: ['مفيش مساحة أو وقت يتحرك فيه — ده ترتيب بيت، مش قدرته.', 'No space or time to move in — that is a home arrangement, not his capacity.'], needs_more_information: ['محتاجين نعرف أكتر عن حركته واستخدام إيده.', 'We need more about how he moves and uses his hands.'] },
  P: { unmet_need: ['فيه سلوك مقلق من غير أي خطة دعم — ده أكبر نقص في الملف.', 'A worrying behaviour with no support plan at all — the biggest gap in the profile.'], emerging: ['بيتعامل مع الناس في مواقف وبيرفض في مواقف — نمط المواقف هو المهم.', 'He engages in some situations and not others — the pattern matters.'], does_independently: ['بيشارك ويلعب ويستنى دوره بطريقته.', 'He joins in, plays, and waits his turn in his own way.'], does_with_support: ['محتاج حد يفكرّه أو يعيّنه له عشان يهدى.', 'He needs someone to remind him or set it up to settle.'], not_yet_opportunity: ['ملوش احتكاك كافي بناس — ده أول حاجة تتظبط.', 'Not enough contact with people — fix that first.'], needs_more_information: ['لسه ما عرفناش كفاية عن اللعب والمشاعر.', 'We still know too little about play and feelings.'] },
  H: { unmet_need: ['البصر أو السمع أو الأكل محتاج دعم ومفيش مساند — ده بيتحكم في كل الشاشة.', 'Vision, hearing or food needs support and nothing is backing it — this governs every screen.'], emerging: ['فيه حاجة صحية بتتحسن وبتتعكر حسب اليوم.', 'Something health-related comes and goes with the day.'], does_independently: ['حسه وراحته مش بيقيدوا أي حاجة دلوقتي.', 'His senses and comfort are not limiting anything right now.'], does_with_support: ['محتاج ترتيب — نضّارة، صوت أوطى، قعدة مظبوطة.', 'He needs an arrangement — glasses, lower sound, a set seat.'], not_yet_opportunity: ['ما اتعملش كشف أو ما اتجربش السمّاعة — دي فرصة ناقصة.', 'No check has been done, or the aid has not been tried — that is a missing opportunity.'], needs_more_information: ['محتاجين نعرف أكتر عن الصحة والحواس والنوم.', 'We need more about health, senses and sleep.'] },
};
const STRENGTH = {
  C: ['عنده طريقة بيوصل بيها نفسه — وده أساس كل حاجة جاية.', 'He has a way of making himself known — the base of everything that follows.'],
  L: ['بيتعلم من يومه وبيحل مشاكله بنفسه في حاجات كتير.', 'He learns from his day and works things out himself in many places.'],
  S: ['بيعتمد على نفسه في جزء كبير من يومه.', 'He handles a real part of his own day.'],
  M: ['بيتحرك ويستخدم إيده بطريقة تكفيه.', 'He moves and uses his hands in a way that carries him.'],
  P: ['فيه ناس وحاجات بيفضلها وبيروح لها — ده اللي هنشتغل بيه.', 'He has people and things he prefers and goes to — that is our lever.'],
  H: ['جسده مرتاح كفاية إنه يستفيد من الوقت اللي بنعمله.', 'His body is comfortable enough to gain from the time we make.'],
};

export function scoreCaregiverProfile({ responses = {}, meta = {} } = {}) {
  const months = typeof meta.childAgeMonths === 'number' ? meta.childAgeMonths : null;
  const blocks = getCaregiverBlocks();
  const domainStates = {};
  const supportIntensity = {};
  const unmetNeeds = [];
  const strengths = [];
  const perBlock = {};
  let answeredTotal = 0;
  let eligibleTotal = 0;

  for (const id of BLOCK_IDS) {
    const block = blocks.find((b) => b.id === id);
    const items = (block ? block.items : []).filter((i) => i.scored);
    const eligibleItems = items.filter((i) => ageOk(i, months));
    const rows = [];
    let notYetCount = 0;
    let answeredCount = 0;
    let contradiction = false;

    for (const item of eligibleItems) {
      const r = responses[item.id];
      if (!r || r.v === null || r.v === undefined || r.v === '') continue;
      const band = bandFor(item.id, r.v);
      if (!band) continue;
      answeredCount += 1;
      if (band === 'opportunity') {
        notYetCount += 1;
        if (r.met || r.t || r.f || r.tm) contradiction = true;
        continue;
      }
      if (band === 'experienced' || band === 'unknown') continue;
      if (band === 'independent' && r.t && r.t !== 'none') contradiction = true;
      if (!SUPPORTED.includes(band) && (r.met === 'unmet')) contradiction = true;
      rows.push({ id: item.id, band, r, item });
      if (SUPPORTED.includes(band) && r.met === 'unmet') {
        unmetNeeds.push({ itemId: item.id, block: id, ar: item.tag.ar, en: item.tag.en });
      }
      if (band === 'independent') strengths.push({ itemId: item.id, block: id, ar: item.tag.ar, en: item.tag.en });
    }

    const n = rows.length;
    const count = (b) => rows.filter((x) => x.band === b).length;
    const independent = count('independent');
    const littleHelp = count('little_help');
    const handsOn = count('hands_on');
    const doesNotYet = count('does_not_yet');
    const share = (x) => (n > 0 ? x / n : 0);

    let state;
    if (eligibleItems.length === 0 || answeredCount / eligibleItems.length < 0.5) state = 'needs_more_information';
    else if (answeredCount > 0 && notYetCount / answeredCount > 0.5) state = 'not_yet_opportunity';
    else if (rows.some((x) => SUPPORTED.includes(x.band) && x.band !== 'little_help' && x.r.met === 'unmet')) state = 'unmet_need';
    else if (n === 0) state = 'needs_more_information';
    else if (share(independent) >= 0.75 && handsOn === 0) state = 'does_independently';
    else if (share(littleHelp + handsOn) > 0.5) state = 'does_with_support';
    else if (independent > 0) state = 'emerging';
    else state = 'does_with_support';
    if (doesNotYet > 0 && rows.some((x) => x.band === 'does_not_yet' && x.r.met === 'unmet')) state = 'unmet_need';

    const answeredShare = eligibleItems.length ? answeredCount / eligibleItems.length : 0;
    let confidence;
    if (answeredShare < 0.5) confidence = 'NEEDS_MORE_INFO';
    else if (answeredShare >= 0.9 && meta.completed === true && !contradiction) confidence = 'HIGH';
    else if (answeredShare >= 0.65) confidence = 'MEDIUM';
    else confidence = 'LOW';

    const w = (WATCH[id] && WATCH[id][state]) || WATCH[id].needs_more_information;
    const s = STRENGTH[id];
    domainStates[id] = {
      state, answered: answeredCount, eligible: eligibleItems.length, notYetCount,
      unmet: rows.filter((x) => SUPPORTED.includes(x.band) && x.band !== 'little_help' && x.r.met === 'unmet').map((x) => x.id),
      supportItems: rows.filter((x) => SUPPORTED.includes(x.band)).map((x) => x.id),
      confidence, watchAr: w[0], watchEn: w[1],
      strengthAr: state === 'does_independently' || strengths.some((y) => y.block === id) ? s[0] : null,
      strengthEn: state === 'does_independently' || strengths.some((y) => y.block === id) ? s[1] : null,
    };
    if (domainStates[id].supportItems.length) {
      const sup = rows.filter((x) => SUPPORTED.includes(x.band));
      supportIntensity[id] = {
        type: majorityOf(sup.map((x) => x.r.t)) || 'supervise',
        frequency: majorityOf(sup.map((x) => x.r.f)) || 'sometimes',
        time: majorityOf(sup.map((x) => x.r.tm)) || 'lt15',
      };
    }
    perBlock[id] = { answered: answeredCount, eligible: eligibleItems.length };
    answeredTotal += answeredCount;
    eligibleTotal += eligibleItems.length;
  }

  /* ── personalisation outputs (§4) — read from the answers, never derived ── */
  const g1 = responses.G1; const p6 = responses.P6; const g2 = responses.G2;
  const labelOf = (itemId, values) => {
    const all = [];
    const walk = (its) => its.forEach((i) => { all.push(i); (i.followUps || []).forEach((f) => walk([f.item])); });
    blocks.forEach((b) => walk(b.items));
    const item = all.find((i) => i.id === itemId);
    const opts = item ? item.ar.opts : [];
    return values.map((v) => (opts.find((o) => o.v === v) || {}).label || v);
  };
  const interests = labelOf('G1', asList(g1));
  const soothing = [...new Set([...labelOf('P6', asList(p6)), ...labelOf('G2', asList(g2))])];
  const doneSignal = responses.G3 && responses.G3.v ? labelOf('G3', [responses.G3.v])[0] : null;
  const bestTime = responses.G4 && responses.G4.v ? labelOf('G4', [responses.G4.v])[0] : null;
  const goals = [...new Set(asList(responses.G6).concat(typeof responses.G6?.note === 'string' ? responses.G6.note.split('\n') : []))].map((s) => String(s).trim()).filter(Boolean).slice(0, 2);

  const hBand = (id) => bandFor(id, (responses[id] || {}).v);
  const sensoryAvoid = asList(responses.H6);
  const m4a = asList(responses.M4a);
  const sleepHard = asList(responses.H3).some((v) => ['night_waking', 'hours_lt6', 'hard_to_settle', 'very_early', 'not_refreshed'].includes(v));
  let minutes = { independent: 8, little_help: 6, hands_on: 5, does_not_yet: 4 }[hBand('M5')] ?? 6;
  if (sleepHard) minutes -= 1;
  if (['long', 'big'].includes((responses.L6 || {}).v)) minutes -= 1;
  if (unmetNeeds.length > 2) minutes -= 1;
  minutes = Math.max(4, Math.min(8, minutes));
  const accessSettings = {
    audioFirst: hBand('H1') === 'hands_on' || hBand('H1') === 'does_not_yet' || hBand('C5') === 'does_not_yet' || (responses.C8 || {}).v === 'much_more',
    responseMode: m4a.includes('switch_button') || m4a.includes('gaze') || m4a.includes('voice') ? 'scan'
      : (m4a.includes('helper_taps') || ['hands_on', 'does_not_yet'].includes(hBand('M4'))) ? 'point_assist' : 'tap',
    targetSize: m4a.includes('big_targets') || ['little_help', 'hands_on', 'does_not_yet'].includes(hBand('M3')) || ['hands_on', 'does_not_yet'].includes(hBand('M4')) ? 'large' : 'standard',
    timersOff: true,
    reducedMotion: sensoryAvoid.some((v) => ['avoids_bright', 'avoids_loud', 'avoids_surprise'].includes(v)) || hBand('H1') === 'hands_on',
    sessionMinutes: minutes,
    breakPrompt: true,
    helperPresent: ['hands_on', 'does_not_yet'].includes(hBand('C2')) || asList(responses.P7).some((v) => v !== 'none') || asList(responses.H3).includes('caregiver_up'),
  };

  const langList = asList(responses.X1);
  const schoolV = (responses.X2 || {}).v;
  const therapies = asList(responses.X2b);
  const context = {
    homeLanguages: labelOf('X1', langList),
    schoolLanguage: (responses.X1b || {}).v ? labelOf('X1b', [(responses.X1b || {}).v])[0] : null,
    understandsBest: (responses.X1a || {}).v ? labelOf('X1a', [(responses.X1a || {}).v])[0] : null,
    school: { attending: ['school_full', 'school_part', 'kindergarten', 'learning_place'].includes(schoolV), hoursPerDay: (responses.X2a || {}).v ? (HOURS[responses.X2a.v] ?? null) : null },
    therapies: { has: therapies.length > 0 && !therapies.includes('no_therapy'), hoursPerWeek: (responses.X2c || {}).v ? (HOURS[responses.X2c.v] ?? null) : null },
    respondent: { who: typeof responses.X4 === 'string' ? responses.X4 : (responses.X4 || {}).note || ((responses.X4 || {}).v) || null, knownWeeks: Number.isFinite(+(responses.X4a || {}).v) ? +responses.X4a.v : null },
    preferredFormat: (responses.X5 || {}).v || null,
    priorReports: labelOf('X3', asList(responses.X3)),
  };

  const guidanceNotes = [];
  if (hBand('H1') !== 'independent' && responses.H1) guidanceNotes.push('اتأكد إن النضّارة شغالة ونضيفة قبل وقت الشاشات — من غيرها الصورة على الشاشة بتبقى مجهدة مش مساعدة.');
  if (hBand('H2') !== 'independent' && responses.H2) guidanceNotes.push('اتأكد إن السماعة شغالة ومشبّعة قبل الجلسة — صوت التطبيق مش هيوصل لو السماعة مطفية.');
  if ((responses.H7 || {}).v === 'none' || (responses.H7 || {}).v === 'tried_unavailable') guidanceNotes.push('البصر والسمع يستاهلوا كشف عند دكتور — ده بيغيّر شكل الشاشات كله أحسن من أي تدريب.');
  if (sleepHard) guidanceNotes.push('النوم متقطع — الجلسات القصيرة النهارده أحسن من الطويلة بكرة.');
  if (context.schoolLanguage && context.understandsBest && context.schoolLanguage !== context.understandsBest) guidanceNotes.push('اللغة اللي بيفهمها أحسن مش هي لغة المدرسة — أي حاجة يبان عليها التأخر في الشاشات يمكن تكون لغة مش فهم.');
  if (Object.values(domainStates).some((d) => d.notYetCount > 0)) guidanceNotes.push('في حاجات لسه ماخدش فرصة يعمله — دي مش نقص قدرة، دي فرص ناقصة في يومه.');
  if (asList(responses.P7).some((v) => v !== 'none') && asList(responses.P7a).includes('no_plan_yet')) guidanceNotes.push('فيه سلوك مقلق ومن غير خطة — ترتيب دعم مع مختص أهم من أي نشاط في التطبيق.');
  if (minutes <= 4) guidanceNotes.push('جلسات النهارده أقصر وخلاص: القعدة نفسها تعبانة، والتعلّم مش بيتغلّب على التعب.');

  return {
    bankVersion: CAREGIVER_BANK_VERSION,
    domainStates, supportIntensity, unmetNeeds, strengths,
    interests, soothing, doneSignal, bestTime, goals,
    accessSettings, context,
    completeness: { answered: answeredTotal, total: eligibleTotal, perBlock },
    guidanceNotes,
  };
}
