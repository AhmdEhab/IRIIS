/**
 * Ask IRIS — the parent's companion.
 *
 * ── WHAT IT IS, WHICH THE OLD SCREEN HID ──────────────────────────────────
 * This is deliberately NOT a generative chatbot. It can only return text that
 * already exists in parent/guidance.js, plus live facts from this child's own
 * sessions. It cannot invent a citation, a diagnosis, or a benefit claim. When
 * it has no approved answer it says so and points to a professional.
 *
 * The old screen presented that as a plain header, a row of grey suggestion
 * pills, a large empty void and a blue "Send" — i.e. as a generic AI wrapper
 * (audit defect D8). A parent arriving at it had no reason to expect anything
 * other than a chatbot bolted onto the side of the product, and no signal that
 * the thing answering knows their child.
 *
 * ── WHAT THIS ONE DOES INSTEAD ────────────────────────────────────────────
 *  - IrisBuddy is the assistant. It is present before the first message, it
 *    changes mood while answering, and it is what a reply comes FROM — the
 *    same companion the child sees, which is the point: one product, not an
 *    app with a bot in it.
 *  - Replies arrive in warm surface cards with the companion beside them, not
 *    full-width grey bands.
 *  - The empty state is a greeting and a set of brochure-style coloured
 *    question tags, not chips floating in a void.
 *  - The composer is a rounded warm field with a drawn send mark.
 *  - The medical disclaimer stays exactly where it was and gains a marker
 *    swipe. It is a substantive constraint; making it smaller was never on the
 *    table.
 *
 * Not one line of the retrieval logic, the context assembly or the answer
 * rendering was changed. `answerParentQuestion` is called with the same
 * arguments, and every branch of `m.meta` renders the same sections.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { answerParentQuestion, SUGGESTED_QUESTIONS } from '../../../iris/parent/chatbot.js';
import { IrisBuddy } from './ui/IrisBuddy';
import {
  ScreenFrame,
  TopBar,
  BrandIcon,
  Mark,
  inputClass,
} from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';

type Msg = { role: 'user' | 'bot'; text: string; meta?: any };

/** The five tag colours cycle, so a row of questions looks like the brochure's
 *  chip cluster rather than six identical grey pills. */
const TAG = [
  'bg-brand-blue-wash text-brand-blue-ink hover:border-brand-blue',
  'bg-brand-green-wash text-brand-green-ink hover:border-brand-green',
  'bg-brand-yellow-wash text-brand-yellow-ink hover:border-brand-yellow',
  'bg-brand-coral-wash text-brand-coral-ink hover:border-brand-coral',
  'bg-brand-purple-wash text-brand-purple-ink hover:border-brand-purple',
];

export function IrisParentChat({ onBack }: { onBack: () => void }) {
  const { assignments, lastDecision, snapshots, profile, sessions, ladder, learningSnapshot, lastAdaptation } = useIris();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    /**
     * The ladder assessment is passed in a shape the chatbot understands:
     * strengths, developing, floors, priorities and confidence — all of them
     * things the child actually did. Without this the assistant answered
     * generically for a child who had just completed a full assessment.
     */
    const ladderContext = ladder
      ? {
          strengths: learningSnapshot?.strengths?.items ?? [],
          developing: learningSnapshot?.developing?.items ?? [],
          floors: Object.values(ladder.indicators ?? {}).filter((i: any) => i.floor),
          priorities: ladder.priorities ?? [],
          confidence: learningSnapshot?.confidence?.level ?? null,
        }
      : null;

    const r = answerParentQuestion(
      q,
      /**
       * `lastAdaptation` is the live IRIS-ADAPTATION-TRACE/1 record from the
       * child's most recent practice round. It is what lets "why did this
       * change?" be answered from the rule that actually fired instead of
       * from generic guidance.
       */
      { assignments, lastDecision, snapshots, profile, sessions, ladder: ladderContext, lastAdaptation },
      language
    );
    setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'bot', text: r.answer || '', meta: r }]);
    setInput('');
  };

  const last = msgs[msgs.length - 1];
  const mood = msgs.length === 0 ? 'idle' : last?.role === 'user' ? 'thinking' : 'listening';

  return (
    <ScreenFrame
      accent="purple"
      width="md"
      decor={msgs.length === 0}
      className="!pb-0"
      topBar={
        <TopBar
          ar={ar}
          onBack={onBack}
          backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
          title={ar ? 'اسألي إيريس' : 'Ask IRIS'}
          actions={<ChromeActions />}
        />
      }
    >
      <div className="flex flex-col min-h-[calc(100vh-9rem)]">
        <div className="flex-1 space-y-4 pb-4">
          {msgs.length === 0 ? (
            /* ── The greeting, not a void ─────────────────────────────── */
            <div className="pt-4 text-center flex flex-col items-center">
              <IrisBuddy mood="idle" className="w-32 h-32" />
              <p className="t-title text-ink mt-3 max-w-md">
                {ar ? 'اسأليني عن تعلّم طفلك' : "Ask me about your child's learning"}
              </p>
              <p className="t-body text-ink-muted mt-2 max-w-md leading-relaxed">
                {ar
                  ? 'بجاوب من قاعدة معرفة مراجَعة، وبستخدم اللي طفلك عمله فعلاً في الجلسات. مش بشخّص.'
                  : 'I answer from a reviewed knowledge base, using what your child actually did in their sessions. I do not diagnose.'}
              </p>

              <div className="mt-7 w-full">
                <p className="t-label text-brand-purple-ink mb-3">
                  {ar ? 'جرّبي واحد من دول' : 'Try one of these'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS[language].map((q: string, i: number) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className={`t-small px-4 py-2.5 rounded-brand-pill border-2 border-transparent
                        transition-colors text-start ${TAG[i % TAG.length]}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            msgs.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-brand-lg rounded-ee-brand-sm bg-brand-blue-ink text-white px-4 py-3 t-body">
                    {m.text}
                  </div>
                </div>
              ) : (
                <BotTurn key={i} m={m} ar={ar} />
              )
            )
          )}
          <div ref={endRef} />
        </div>

        {/* ── Composer ────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 bg-ground/95 backdrop-blur-sm border-t border-hairline-soft">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="ask-iris" className="sr-only-iris">
                {ar ? 'اكتبي سؤالك' : 'Type your question'}
              </label>
              <input
                id="ask-iris"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask(input)}
                placeholder={ar ? 'اكتبي سؤالك...' : 'Type your question...'}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => ask(input)}
              aria-label={ar ? 'إرسال' : 'Send'}
              className="shrink-0 w-12 h-12 rounded-brand-pill bg-brand-purple-ink text-white flex items-center justify-center hover:brightness-110 transition-[filter]"
            >
              <BrandIcon name="send" className="w-6 h-6" tone="transparent" />
            </button>
          </div>
          {/* Unchanged wording. The marker swipe is the brochure's emphasis
              device and is the right one here: this line is the most important
              sentence on the screen, not the smallest. */}
          <p className="t-small text-ink-muted mt-2.5 text-center leading-relaxed">
            {ar ? (
              <>
                <Mark>لا يقدّم IRIS تشخيصًا ولا نصيحة طبية</Mark> ولا تقديرًا للذكاء. الأسئلة الطبية تُحال دائمًا إلى
                مختص.
              </>
            ) : (
              <>
                <Mark>IRIS does not diagnose</Mark>, give medical advice, or estimate intelligence. Medical
                questions are always referred to a professional.
              </>
            )}
          </p>
        </div>
      </div>
    </ScreenFrame>
  );
}

/**
 * One reply from IRIS.
 *
 * The companion sits beside the card rather than inside it, so a long support
 * plan does not push the character off the top of the reply. Every meta branch
 * below renders exactly the sections the previous version did — the labels
 * ("what we noticed" = fact from the child's sessions, "what this might mean"
 * = inference) are load-bearing and unchanged.
 */
function BotTurn({ m, ar }: { m: Msg; ar: boolean }) {
  const safety = m.meta?.type === 'SAFETY_FALLBACK';
  return (
    <div className="flex items-start gap-2.5">
      {/* No overflow-hidden: the companion's petal crown sits outside the
          circle's bounds and was being sliced off, leaving a cropped face. */}
      <div className="shrink-0 w-14 h-14 rounded-full bg-brand-purple-wash flex items-center justify-center">
        <IrisBuddy mood={safety ? 'gentle' : 'happy'} className="w-14 h-14" />
      </div>
      <div
        className={`min-w-0 max-w-[92%] rounded-brand-lg rounded-ss-brand-sm px-4 py-3.5 whitespace-pre-wrap ${
          safety
            ? 'bg-brand-yellow-wash border-2 border-brand-yellow text-ink'
            : 'bg-surface border-2 border-hairline text-ink shadow-brand-sm'
        }`}
      >
        {m.text && <p className="whitespace-pre-line t-body">{m.text}</p>}

        {m.meta?.type === 'SUPPORT_PLAN' && (
          <div className="space-y-3 text-start mt-2">
            {m.meta.observed?.length > 0 && (
              <section className="rounded-brand bg-brand-blue-wash p-3">
                <h3 className="t-label text-brand-blue-ink mb-1">{ar ? 'لاحظنا' : 'What we noticed'}</h3>
                <ul className="list-disc ps-5 space-y-1 t-small text-ink font-medium">
                  {m.meta.observed.map((o: string, k: number) => (
                    <li key={k}>{o}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="t-label text-ink-muted mb-1">{ar ? 'ممكن يكون معناه' : 'What this might mean'}</h3>
              <p className="t-small text-ink-muted font-medium">{m.meta.meaning}</p>
            </section>

            <section className="rounded-brand bg-brand-green-wash p-3">
              <h3 className="t-label text-brand-green-ink mb-1">{ar ? 'نجرب إيه النهارده' : 'Try this today'}</h3>
              <p className="t-small text-ink mb-2 font-medium">{m.meta.today}</p>
              <p className="font-bold text-ink">{m.meta.activity.title}</p>
              <p className="t-small text-ink-muted mb-2 font-medium">
                {ar ? 'هتحتاجي: ' : 'You need: '}
                {m.meta.activity.materials}
              </p>
              <ol className="list-decimal ps-5 space-y-1 t-small text-ink font-medium">
                {m.meta.activity.steps.map((st: string, k: number) => (
                  <li key={k}>{st}</li>
                ))}
              </ol>
            </section>

            <div className="grid sm:grid-cols-2 gap-3">
              <section className="rounded-brand bg-brand-yellow-wash p-3">
                <h3 className="t-label text-brand-yellow-ink mb-1">{ar ? 'المدة المقترحة' : 'Suggested length'}</h3>
                <p className="t-small text-ink font-medium">{m.meta.duration}</p>
              </section>
              <section className="rounded-brand bg-surface-sunk p-3">
                <h3 className="t-label text-ink-muted mb-1">{ar ? 'راقبي' : 'What to watch'}</h3>
                <p className="t-small text-ink font-medium">{m.meta.watch}</p>
              </section>
            </div>

            <section>
              <h3 className="t-label text-ink-muted mb-1">{ar ? 'لو احتجتي تظبطيه' : 'If you need to adjust'}</h3>
              <p className="t-small text-ink-muted font-medium">
                <span className="font-bold">{ar ? 'أسهل: ' : 'Easier: '}</span>
                {m.meta.adjust.easier}
              </p>
              <p className="t-small text-ink-muted font-medium">
                <span className="font-bold">{ar ? 'أصعب: ' : 'Harder: '}</span>
                {m.meta.adjust.harder}
              </p>
            </section>

            <p className="t-small text-brand-purple-ink font-bold">{m.meta.reassurance}</p>
            <p className="text-[11px] text-ink-muted leading-relaxed">{m.meta.disclosure}</p>
          </div>
        )}

        {safety && (
          <p className="mt-2 t-small text-brand-yellow-ink font-bold inline-flex items-center gap-1.5">
            <BrandIcon name="alert" className="w-4 h-4" tone="transparent" />
            {ar ? 'يتطلب استشارة مختص' : 'Requires a professional'}
          </p>
        )}

        {m.meta?.type === 'KB_ANSWER' && (
          <div className="mt-3 pt-3 border-t border-hairline t-small text-ink-muted space-y-1 font-medium">
            <p>
              <span className="font-bold">{ar ? 'قوة الدليل: ' : 'Evidence tier: '}</span>
              <span className="font-mono">{m.meta.evidence_tier}</span>
            </p>
            <p>
              <span className="font-bold">{ar ? 'المصدر: ' : 'Source: '}</span>
              {m.meta.source}
            </p>
            <p>
              <span className="font-bold">{ar ? 'حالة المراجعة: ' : 'Review status: '}</span>
              <span className="font-mono">{m.meta.specialist_review_status}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
