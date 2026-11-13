/**
 * IRIS — Diagnosis-Blindness Demonstration (Scenario C).
 *
 * This screen REPLACES the old "syndrome teaching demo", which demonstrated
 * exactly the diagnosis→learning-style logic the evidence base forbids.
 *
 * It runs the real engines live, in the browser, five times: identical
 * performance data, five different diagnoses. It then shows that every
 * output — scores, levels, goals, pathway decisions, next activity — is
 * identical. The only thing the diagnosis changed is the access accommodations.
 *
 * All data is synthetic. No network. No database. It cannot fail on stage.
 */
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { scenarioA, scenarioB, scenarioC } from '../../../iris/demo/scenarios.js';
import { Button } from '../ui/button';

export function BlindnessDemoScreen({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [tab, setTab] = useState<'C' | 'A' | 'B'>('C');

  const A = useMemo(() => scenarioA(), []);
  const B = useMemo(() => scenarioB(), []);
  const C = useMemo(() => scenarioC(), []);

  return (
    <div className="min-h-screen p-6 bg-ground-tint">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">
            {ar ? 'عرض توضيحي للجنة' : 'Committee demonstration'}
          </h1>
          <Button variant="outline" onClick={onBack}>{ar ? 'رجوع' : 'Back'}</Button>
        </div>

        <div className="flex gap-2">
          {([['C', ar ? 'ج — عمى التشخيص' : 'C — Diagnosis blindness'],
             ['A', ar ? 'أ — تقدّم ناجح' : 'A — Progression'],
             ['B', ar ? 'ب — طفل يواجه صعوبة' : 'B — Struggling']] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${tab === k ? 'bg-brand-blue-ink text-white' : 'bg-surface border border-hairline text-ink-muted'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'C' && (
          <div className="space-y-4">
            <div className={`rounded-brand p-5 border-2 ${C.identical_outcomes ? 'bg-brand-green-wash border-brand-green' : 'bg-brand-coral-wash border-brand-coral'}`}>
              <p className="text-lg font-bold text-ink">
                {C.identical_outcomes
                  ? (ar ? '✅ نفس الأداء + تشخيص مختلف ← نفس النتيجة تمامًا' : '✅ Same performance + different diagnosis → identical outcome')
                  : (ar ? '❌ فشل — اختلفت النتائج' : '❌ FAILED — outcomes differed')}
              </p>
              <p className="text-sm text-ink-muted mt-2">
                {ar
                  ? 'شُغّلت المحرّكات الحقيقية خمس مرات ببيانات أداء متطابقة تمامًا، وبتشخيص مختلف في كل مرة. الفرق الوحيد كان التسهيلات (وقت إضافي، إعادة الصوت، تقليل الحركة) — وهي لا تدخل في الدرجة ولا في المسار.'
                  : 'The real engines were run five times with identical performance data and a different diagnosis each time. The only difference was the access accommodations (extra time, audio repeat, reduced animation) — which never enter scoring or the pathway.'}
              </p>
            </div>

            <div className="overflow-x-auto bg-surface rounded-brand border border-hairline">
              <table className="w-full text-sm">
                <thead className="bg-surface-sunk">
                  <tr>
                    <th className="text-start p-3">{ar ? 'التشخيص' : 'Diagnosis'}</th>
                    <th className="text-start p-3">{ar ? 'الهدف المختار' : 'Goal selected'}</th>
                    <th className="text-start p-3">{ar ? 'المستوى' : 'Level'}</th>
                    <th className="text-start p-3">{ar ? 'قرارات المسار' : 'Pathway decisions'}</th>
                    <th className="text-start p-3">{ar ? 'النشاط التالي' : 'Next activity'}</th>
                    <th className="text-start p-3">{ar ? 'التسهيلات (الفرق الوحيد)' : 'Accommodations (only difference)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {C.runs.map((r: any) => (
                    <tr key={r.condition} className="border-t">
                      <td className="p-3 font-mono text-xs">{r.condition}</td>
                      <td className="p-3 font-mono text-xs">{r.assignments[0]?.goal_id}</td>
                      <td className="p-3">{r.assignments[0]?.level}</td>
                      <td className="p-3 font-mono text-xs">{r.decisions.map((d: any) => d.reason_code).join(' → ')}</td>
                      <td className="p-3 font-mono text-[10px]">{r.next_activity_id}</td>
                      <td className="p-3 text-xs text-brand-yellow-ink">{r.accommodations_only.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'A' && <ScenarioTable title={ar ? 'تقدّم ناجح: أداء مرتفع مرتين ← إتقان ← المستوى التالي' : 'Successful progression: two strong sessions → mastery → next level'} steps={A.steps} ar={ar} />}
        {tab === 'B' && <ScenarioTable title={ar ? 'طفل يواجه صعوبة: تبسيط أولًا، ثم تغيير طريقة العرض، ثم الرجوع خطوة' : 'Struggling child: simplify first, then change modality, then step back'} steps={B.steps} ar={ar} />}

        <p className="text-xs text-ink-muted text-center pb-6">
          {ar ? 'كل البيانات في هذه الشاشة تركيبية (is_synthetic = true) ولا تخص أي طفل حقيقي.'
              : 'All data on this screen is synthetic (is_synthetic = true) and belongs to no real child.'}
        </p>
      </div>
    </div>
  );
}

function ScenarioTable({ title, steps, ar }: { title: string; steps: any[]; ar: boolean }) {
  const sessions = steps.filter((s) => String(s.step).startsWith('SESSION'));
  return (
    <div className="space-y-3">
      <p className="font-semibold text-ink">{title}</p>
      <div className="overflow-x-auto bg-surface rounded-brand border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-sunk">
            <tr>
              <th className="text-start p-3">{ar ? 'الجلسة' : 'Session'}</th>
              <th className="text-start p-3">{ar ? 'الفئة' : 'Band'}</th>
              <th className="text-start p-3">{ar ? 'الدقة' : 'Accuracy'}</th>
              <th className="text-start p-3">{ar ? 'القاعدة' : 'Rule'}</th>
              <th className="text-start p-3">{ar ? 'القرار' : 'Decision'}</th>
              <th className="text-start p-3">{ar ? 'المستوى' : 'Level'}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    s.band === 'HIGH' ? 'bg-brand-green-wash text-brand-green-ink'
                    : s.band === 'LOW' ? 'bg-brand-yellow-wash text-brand-yellow-ink'
                    : 'bg-surface-sunk text-ink-muted'}`}>{s.band ?? '—'}</span>
                </td>
                <td className="p-3">{Math.round((s.accuracy ?? 0) * 100)}%</td>
                <td className="p-3 font-mono text-xs">{s.rule}</td>
                <td className="p-3 font-mono text-xs">{s.reason}</td>
                <td className="p-3">{s.from_level} → {s.to_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
