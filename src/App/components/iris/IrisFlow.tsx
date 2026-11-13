/**
 * IRIS Child Mode flow — the end-to-end child journey.
 *
 *   Home → Assessment → Profile → Goals → Activity → Session result
 *        → Pathway decision → next Activity → Parent Mode
 *
 * Runs entirely locally. No backend call is required for the demo.
 *
 * IrisProvider now lives ABOVE this component (in App.tsx), not inside it,
 * so the child's engine state (profile, sessions, stars) survives a trip
 * out to a legacy "Free Play" game and back — it used to reset every time
 * this component remounted.
 */
import React, { useEffect, useState } from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { IrisAssessmentScreen } from './IrisAssessmentScreen';
import { IrisActivityScreen } from './IrisActivityScreen';
import { IrisParentDashboard } from './IrisParentDashboard';
import { IrisParentChat } from './IrisParentChat';
import { IrisChildHome } from './IrisChildHome';
import { BlindnessDemoScreen } from './BlindnessDemoScreen';
import { IrisCelebration } from './ui/IrisCelebration';
import { StageFeedback } from './ui/StageFeedback';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

type Step = 'intake' | 'home' | 'assessment' | 'profile' | 'activity' | 'result' | 'parent' | 'chat' | 'demo';

/** AppContext uses lower-case-hyphen condition ids; the engine uses the
 * upper-case tokens from spec.js. This is presentation-layer mapping only —
 * it never reaches any scoring/pathway function with anything but the
 * upper-case token, exactly like the manual intake selector already did. */
export function mapCondition(raw?: string): string {
  const table: Record<string, string> = {
    'down-syndrome': 'DOWN_SYNDROME',
    'williams': 'WILLIAMS_SYNDROME',
    'fragile-x': 'FRAGILE_X',
    'autism': 'AUTISM',
    'other': 'OTHER',
  };
  return table[raw || ''] || 'OTHER';
}

interface IrisFlowProps {
  onExit?: () => void;
  /** When Child Mode is entered from an already-registered parent profile,
   *  these skip the manual intake screen and start the child automatically. */
  prefillName?: string;
  prefillCondition?: string;
  /** Used only to shorten the calibration probe set for a very young child. */
  prefillAge?: number | null;
  onLegacyGame?: (gameId: string) => void;
  onGoParent?: () => void;
}

export function IrisFlow({ onExit, prefillName, prefillCondition, prefillAge, onLegacyGame, onGoParent }: IrisFlowProps) {
  const { language, setLanguage } = useLanguage() as any;
  const ar = language === 'ar';
  const iris = useIris();
  const audio = useAudio();

  const [step, setStep] = useState<Step>(iris.childName ? 'home' : 'intake');
  const [name, setName] = useState('');
  const [cond, setCond] = useState('DOWN_SYNDROME');
  const [lastResult, setLastResult] = useState<any>(null);
  // Parent-facing between-stage feedback (advisory only, never engine input).
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Auto-start from an already-registered parent/child profile (Phase 3/14).
  useEffect(() => {
    if (!iris.childName && prefillName) {
      iris.startChild(prefillName, mapCondition(prefillCondition), prefillAge ?? null);
      setStep('home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goParent = onGoParent ?? (() => setStep('parent'));

  if (step === 'assessment') return <IrisAssessmentScreen onDone={() => setStep('profile')} />;
  if (step === 'chat') return <IrisParentChat onBack={() => setStep('parent')} />;
  if (step === 'demo') return <BlindnessDemoScreen onBack={() => setStep(iris.childName ? 'home' : 'intake')} />;
  if (step === 'parent') {
    return (
      <IrisParentDashboard
        onOpenChat={() => setStep('chat')}
        onBack={() => setStep(iris.childName ? 'home' : 'intake')}
        onEnterChildMode={() => setStep(iris.profile ? 'activity' : (iris.childName ? 'home' : 'intake'))}
      />
    );
  }

  if (step === 'home') {
    return (
      <IrisChildHome
        onStartAdventure={() => setStep(iris.profile ? 'activity' : 'assessment')}
        onLegacyGame={onLegacyGame}
        onGoParent={goParent}
      />
    );
  }

  if (step === 'activity') {
    return (
      <div>
        <IrisActivityScreen
          onSessionDone={(r) => {
            setLastResult(r);
            setShowFeedback(false);
            setFeedbackSent(false);
            // Children applauding, from the supplied Sounds folder.
            audio.playCue('complete');
            setStep('result');
          }}
        />
        <IrisCelebration
          visible={iris.showCelebration}
          nameAr={iris.childName}
          nameEn={iris.childName}
          language={ar ? 'ar' : 'en'}
          onDone={iris.dismissCelebration}
        />
        <div className="fixed bottom-4 end-4 flex gap-2">
          <Button variant="outline" onClick={() => setStep('home')}>{ar ? '🏠 الرئيسية' : '🏠 Home'}</Button>
          <Button variant="outline" onClick={goParent}>{ar ? '👪 وضع الوالدين' : '👪 Parent Mode'}</Button>
        </div>
      </div>
    );
  }

  if (step === 'result' && lastResult) {
    const d = lastResult.decision;
    const s = lastResult.session;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground">
        <div className="max-w-2xl w-full bg-surface rounded-brand-lg border border-hairline p-8 space-y-5">
          <div className="text-center text-6xl">{s.band === 'HIGH' ? '🌟' : s.band === 'LOW' ? '💪' : '👍'}</div>
          <h2 className="text-2xl font-bold text-center text-ink">
            {ar ? 'أحسنت! انتهت الجولة' : 'Great job! Round complete'}
          </h2>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label={ar ? 'إجابات صحيحة' : 'Correct'} value={`${Math.round((s.accuracy ?? 0) * 100)}%`} />
            <Stat label={ar ? 'بدون مساعدة' : 'Unaided'} value={`${Math.round((s.independence ?? 0) * 100)}%`} />
            <Stat label={ar ? '⭐ النجوم' : '⭐ Stars'} value={`${iris.stars}`} />
          </div>

          <div className="rounded-brand bg-ground-tint p-4 space-y-2">
            <p className="font-semibold text-ink">{ar ? 'ماذا بعد؟' : "What's next?"}</p>
            <p className="text-ink-muted">{d.explanation_parent?.[language]}</p>
          </div>

          {/* Stage checkpoint — Continue, or practise this step again. The
              child's own choice, not a test, and neither option is "failing". */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => { iris.loadNextActivity(); setStep('activity'); }}>
              {ar ? 'كمّل ▶' : 'Continue ▶'}
            </Button>
            <Button variant="outline" onClick={() => { iris.loadNextActivity(); setStep('activity'); }}>
              {ar ? '🔁 نتمرّن تاني' : '🔁 Practice again'}
            </Button>
            <Button variant="outline" onClick={() => setStep('home')}>
              {ar ? '🏠 الرئيسية' : '🏠 Home'}
            </Button>
            <Button variant="outline" onClick={goParent}>
              {ar ? '👪 وضع الوالدين' : '👪 Parent Mode'}
            </Button>
          </div>

          {/* Parent-facing feedback. Advisory only — see StageFeedback's header
              for why it is deliberately kept out of the adaptive engine. */}
          {feedbackSent ? (
            <p className="text-center text-sm text-brand-green-ink font-semibold">
              {ar ? 'وصلتنا ملاحظتك — شكرًا لك 🌱' : 'Thanks — your note was recorded 🌱'}
            </p>
          ) : showFeedback ? (
            <StageFeedback
              onSubmit={(value) => {
                // Pilot signal only. Stored locally, never sent to the engine.
                try {
                  const key = 'iris_stage_feedback';
                  const prev = JSON.parse(localStorage.getItem(key) || '[]');
                  prev.push({ ...value, goal_id: d?.to_goal_id ?? null });
                  localStorage.setItem(key, JSON.stringify(prev.slice(-50)));
                } catch { /* storage unavailable — the note is simply not kept */ }
                setFeedbackSent(true);
              }}
              onSkip={() => setShowFeedback(false)}
            />
          ) : (
            <div className="text-center">
              <button
                onClick={() => setShowFeedback(true)}
                className="text-sm font-bold text-brand-purple-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue rounded"
              >
                {ar ? 'للأهل: النشاط كان عامل إزاي؟' : 'For parents: how did that activity feel?'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'profile') {
    const p = iris.profile;
    const lines = p ? iris.explainProfile(p, language) : [];
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground">
        <div className="max-w-2xl w-full bg-surface rounded-brand-lg border border-hairline p-8 space-y-4">
          <h2 className="text-2xl font-bold text-ink">{ar ? 'ما تعلّمناه اليوم' : 'What we learned today'}</h2>
          {lines.map((l: string, i: number) => (
            <p key={i} className={i === lines.length - 1 ? 'text-xs text-ink-muted border-t pt-3' : 'text-ink-muted'}>{l}</p>
          ))}

          <div className="rounded-brand-sm bg-brand-blue-wash p-4">
            <p className="font-semibold text-ink mb-1">{ar ? 'الأهداف المختارة' : 'Selected goals'}</p>
            {iris.assignments.map((a: any) => (
              <p key={a.goal_id} className="text-sm text-ink-muted">
                • {ar ? iris.GOAL_BY_ID[a.goal_id]?.nameAr : iris.GOAL_BY_ID[a.goal_id]?.nameEn} — {ar ? 'المستوى' : 'level'} {a.level}
              </p>
            ))}
          </div>

          <Button className="w-full" onClick={() => { iris.loadNextActivity(); setStep('activity'); }}>
            {ar ? 'ابدأ التدريب ▶' : 'Start practising ▶'}
          </Button>
        </div>
      </div>
    );
  }

  // intake — manual fallback path when Child Mode is opened without a
  // registered parent/child profile (e.g. a quick guest demo).
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ground">
      <div className="max-w-xl w-full bg-surface rounded-brand-lg border border-hairline p-8 space-y-5">
        <div className="text-center">
          <img src="/images/iris-logo-static.png" alt="IRIS" className="w-20 h-20 mx-auto object-contain mb-2" />
          <h1 className="text-3xl font-bold text-ink">IRIS</h1>
          <p className="text-ink-muted text-sm mt-1">
            {ar ? 'تدريب تعليمي يتكيّف مع أداء الطفل — لا مع تشخيصه' : "Educational practice that adapts to a child's performance — not their diagnosis"}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Button size="sm" variant={ar ? 'default' : 'outline'} onClick={() => setLanguage('ar')}>عربي</Button>
          <Button size="sm" variant={!ar ? 'default' : 'outline'} onClick={() => setLanguage('en')}>English</Button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink-muted">{ar ? 'اسم الطفل (تجربة سريعة)' : 'Child name (quick demo)'}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={ar ? 'مثال: سلمى' : 'e.g. Salma'} />

          <label className="block text-sm font-medium text-ink-muted">{ar ? 'التشخيص (يُستخدم للتسهيلات فقط)' : 'Diagnosis (used for accommodations only)'}</label>
          <select value={cond} onChange={(e) => setCond(e.target.value)}
            className="w-full rounded-brand-sm border border-hairline p-2">
            <option value="DOWN_SYNDROME">{ar ? 'متلازمة داون' : 'Down syndrome'}</option>
            <option value="WILLIAMS_SYNDROME">{ar ? 'متلازمة ويليامز' : 'Williams syndrome'}</option>
            <option value="OTHER">{ar ? 'أخرى / غير محدّد' : 'Other / not specified'}</option>
          </select>

          <div className="rounded-brand-sm bg-brand-yellow-wash border border-brand-yellow p-3 text-xs text-brand-yellow-ink">
            {ar
              ? 'التشخيص هنا يُفعّل التسهيلات فقط (وقت إضافي، إعادة الصوت، تقليل الحركة). لا يدخل في الدرجة، ولا في اختيار الأسئلة، ولا في المستوى، ولا في قرار المسار.'
              : 'The diagnosis here only enables accommodations (extra time, audio repeat, reduced animation). It never enters scoring, item selection, level, or the pathway decision.'}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => { iris.startChild(name || (ar ? 'طفل تجريبي' : 'Demo child'), cond, prefillAge ?? null); setStep('home'); }}>
            {ar ? 'ابدأ الرحلة ▶' : 'Start the journey ▶'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setStep('demo')}>
            {ar ? '🔬 عرض توضيحي للجنة (سيناريوهات أ/ب/ج)' : '🔬 Committee demo (scenarios A/B/C)'}
          </Button>
          {onExit && (
            <Button variant="ghost" className="w-full" onClick={onExit}>
              {ar ? 'رجوع' : 'Back'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand-sm bg-ground-tint p-3">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}
