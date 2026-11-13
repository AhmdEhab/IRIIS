import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reveal } from './LandingDecor';

/**
 * PersonalizedPaths — the centerpiece for "adaptive by design".
 *
 * Two illustrative children with the same age but different starting points
 * and different levels per skill. Selecting a child animates their ladder.
 * Labelled explicitly as an example — no real child data, no ranking between
 * the two, and the copy frames difference as normal, never as competition.
 */

type Skill = { ar: string; en: string; level: number };

const CHILDREN: {
  id: 'noor' | 'reem';
  name: { ar: string; en: string };
  note: { ar: string; en: string };
  color: string;
  skills: Skill[];
}[] = [
  {
    id: 'noor',
    name: { ar: 'نور', en: 'Noor' },
    note: { ar: 'بتحب الحروف والكلمات', en: 'Drawn to letters and words' },
    color: 'var(--brand-blue)',
    skills: [
      { ar: 'أصوات الحروف', en: 'Letter sounds', level: 4 },
      { ar: 'القراءة والكلمات', en: 'Reading and words', level: 3 },
      { ar: 'الأرقام والعدّ', en: 'Numbers and counting', level: 2 },
      { ar: 'الأنماط والمقارنة', en: 'Patterns and matching', level: 3 },
    ],
  },
  {
    id: 'reem',
    name: { ar: 'ريم', en: 'Reem' },
    note: { ar: 'بتحب الأرقام والأشكال', en: 'Drawn to numbers and shapes' },
    color: 'var(--brand-green)',
    skills: [
      { ar: 'أصوات الحروف', en: 'Letter sounds', level: 2 },
      { ar: 'القراءة والكلمات', en: 'Reading and words', level: 2 },
      { ar: 'الأرقام والعدّ', en: 'Numbers and counting', level: 4 },
      { ar: 'الأنماط والمقارنة', en: 'Patterns and matching', level: 5 },
    ],
  },
];

export function PersonalizedPaths() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const text = (a: string, e: string) => (ar ? a : e);
  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥'];
  const levelLabel = (n: number) => (ar ? `${AR_DIGITS[n]}/٥` : `${n}/5`);
  const [active, setActive] = useState<'noor' | 'reem'>('noor');
  const other = CHILDREN.find(c => c.id !== active)!;
  const current = CHILDREN.find(c => c.id === active)!;

  return (
    <div className="lp-paths">
      <div className="lp-paths-switch" role="tablist" aria-label={text('اختيار مثال', 'Choose an example')}>
        {CHILDREN.map(child => (
          <button
            key={child.id}
            role="tab"
            type="button"
            aria-selected={active === child.id}
            className={`lp-path-tab${active === child.id ? ' lp-path-tab--active' : ''}`}
            style={{ ['--lp-tab-color' as string]: child.color }}
            onClick={() => setActive(child.id)}
          >
            <span className="lp-path-avatar" aria-hidden="true">{ar ? child.name.ar[0] : child.name.en[0]}</span>
            <span>
              <strong>{text(child.name.ar, child.name.en)}</strong>
              <small>{text(child.note.ar, child.note.en)}</small>
            </span>
          </button>
        ))}
        <span className="lp-example-badge">{text('مثال توضيحي', 'Illustrative example')}</span>
      </div>

      <div className="lp-paths-grid" dir={ar ? 'rtl' : 'ltr'}>
        {[current, other].map((child, index) => (
          <Reveal key={child.id} className="lp-path-card" delay={index * 0.08} y={18}>
            <div className="lp-path-head">
              <span className="lp-path-avatar lp-path-avatar--lg" style={{ ['--lp-tab-color' as string]: child.color }} aria-hidden="true">
                {ar ? child.name.ar[0] : child.name.en[0]}
              </span>
              <div>
                <h3>{text(child.name.ar, child.name.en)}</h3>
                <p>{text(child.note.ar, child.note.en)}</p>
              </div>
              {index === 0 && <span className="lp-now-badge">{text('مسار النهارده', 'Today’s path')}</span>}
            </div>
            <ul className="lp-ladder-rows">
              {child.skills.map((skill, i) => (
                <li key={skill.en} className={index === 0 ? 'lp-path-live' : undefined} style={{ ['--lp-ladder-color' as string]: child.color }}>
                  <span className="lp-ladder-name">{text(skill.ar, skill.en)}</span>
                  <span className="lp-ladder-dots" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map(level => (
                      <i key={level} className={level <= skill.level ? 'lp-dot--on' : 'lp-dot--off'} style={{ animationDelay: `${i * 60 + level * 45}ms` }} />
                    ))}
                  </span>
                  <b>{levelLabel(skill.level)}</b>
                </li>
              ))}
            </ul>
            <p className="lp-path-foot">
              {index === 0
                ? text('IRIS بتكمّل من المستوى اللي هو عليها دلوقتي.', 'IRIS continues right from where they are now.')
                : text('مسار مختلف لنفس المهارة — وده طبيعي.', 'A different route for the same skills — and that’s normal.')}
            </p>
          </Reveal>
        ))}
      </div>
      <p className="lp-paths-caption">
        {text(
          'نفس السن، نفس المنصة — خطوات مختلفة. IRIS مش بتقارن الأطفال ببعض، بتلاقي لكل طفل نقطته اللي يبدأ منها.',
          'Same age, same platform — different steps. IRIS never ranks children against each other; it finds each child their own starting point.',
        )}
      </p>
    </div>
  );
}
