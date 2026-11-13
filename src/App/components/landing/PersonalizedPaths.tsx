import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reveal } from './LandingDecor';

/**
 * PersonalizedPaths — two illustrative children, same skills, different
 * levels. Static side-by-side cards (no tabs, no "active" child) so the
 * point reads at a glance. Labelled as an example; difference framed as
 * normal, never a ranking.
 */

type Skill = { ar: string; en: string; level: number };

const CHILDREN: {
  id: string;
  name: { ar: string; en: string };
  note: { ar: string; en: string };
  color: string;
  skills: Skill[];
}[] = [
  {
    id: 'noor',
    name: { ar: 'نور', en: 'Noor' },
    note: { ar: 'بتحب الحروف والكلمات', en: 'Loves letters and words' },
    color: 'var(--brand-blue)',
    skills: [
      { ar: 'أصوات الحروف', en: 'Letter sounds', level: 4 },
      { ar: 'القراءة والكلمات', en: 'Reading and words', level: 3 },
      { ar: 'الأرقام والعدّ', en: 'Numbers and counting', level: 2 },
    ],
  },
  {
    id: 'reem',
    name: { ar: 'ريم', en: 'Reem' },
    note: { ar: 'بتحب الأرقام والأشكال', en: 'Loves numbers and shapes' },
    color: 'var(--brand-green)',
    skills: [
      { ar: 'أصوات الحروف', en: 'Letter sounds', level: 2 },
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

  return (
    <div className="lp-paths" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lp-paths-grid">
        {CHILDREN.map((child, index) => (
          <Reveal key={child.id} className="lp-path-card" delay={index * 0.1} y={18}>
            <div className="lp-path-head" style={{ ['--lp-card-color' as string]: child.color }}>
              <span className="lp-path-avatar lp-path-avatar--lg" aria-hidden="true">
                {ar ? child.name.ar[0] : child.name.en[0]}
              </span>
              <div>
                <h3>{text(child.name.ar, child.name.en)}</h3>
                <p>{text(child.note.ar, child.note.en)}</p>
              </div>
            </div>
            <ul className="lp-ladder-rows" style={{ ['--lp-ladder-color' as string]: child.color }}>
              {child.skills.map((skill, i) => (
                <li key={skill.en}>
                  <span className="lp-ladder-name">{text(skill.ar, skill.en)}</span>
                  <span className="lp-ladder-dots" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map(level => (
                      <i key={level} className={level <= skill.level ? 'lp-dot--on' : 'lp-dot--off'} style={{ animationDelay: `${i * 70 + level * 50}ms` }} />
                    ))}
                  </span>
                  <b>{levelLabel(skill.level)}</b>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <p className="lp-paths-caption">
        <span className="lp-example-badge">{text('مثال توضيحي', 'Illustrative example')}</span>
        {text('IRIS مش بتقارن الأطفال — كل طفل بيبدأ من نقطته.', 'IRIS never ranks children — each one starts from their own point.')}
      </p>
    </div>
  );
}
