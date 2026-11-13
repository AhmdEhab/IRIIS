import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reveal, Sparkle } from './LandingDecor';

/**
 * LearningAreas — the actual activity categories shipped in the app
 * (MasterCurriculum.ts + the child-facing screens). Bento rhythm so the
 * cards are deliberately not all identical; each carries its own brand
 * colour wash. Hover lifts the card and warms the glyph.
 */

type Area = {
  key: string;
  glyph: { ar: string; en: string };
  tone: 'yellow' | 'blue' | 'coral' | 'green' | 'purple';
  wide?: boolean;
  name: { ar: string; en: string };
  blurb: { ar: string; en: string };
};

const AREAS: Area[] = [
  {
    key: 'letters', glyph: { ar: 'أ', en: 'A' }, tone: 'blue', wide: true,
    name: { ar: 'الحروف والكلمات', en: 'Letters and words' },
    blurb: { ar: 'من صوت الحرف للكلمة — بصوت مسموع بالعربي والإنجليزي.', en: 'From letter sounds to first words, with spoken instructions in Arabic and English.' },
  },
  {
    key: 'numbers', glyph: { ar: '٧', en: '7' }, tone: 'green',
    name: { ar: 'الأرقام والعدّ', en: 'Numbers and counting' },
    blurb: { ar: 'عدّ ومقارنة وتعرّف على الأرقام.', en: 'Counting, comparing and getting to know numerals.' },
  },
  {
    key: 'patterns', glyph: { ar: '◆▲◆', en: '▲◆▲' }, tone: 'purple',
    name: { ar: 'الأنماط والمقارنة', en: 'Patterns and matching' },
    blurb: { ar: 'اكتشف الترتيب وكمله — منطق قبل القراءة.', en: 'Spot the sequence and complete it — logic before literacy.' },
  },
  {
    key: 'animals', glyph: { ar: '🦁', en: '🦁' }, tone: 'yellow',
    name: { ar: 'الحيوانات', en: 'Animals' },
    blurb: { ar: 'أسماء الحيوانات وأصواتها حول العالم.', en: 'Animal names and the sounds they make.' },
  },
  {
    key: 'fruits', glyph: { ar: '🍎', en: '🍎' }, tone: 'coral', wide: true,
    name: { ar: 'الفواكه والأشكال والألوان', en: 'Fruits, shapes and colors' },
    blurb: { ar: 'مفاهيم اليوم بتجربة حقيقية: لمس، تسمية، ومطابقة المجسّمات.', en: 'Everyday concepts through real interaction: touch, name and match the same 3D objects used in activities.' },
  },
  {
    key: 'emotions', glyph: { ar: '🙂', en: '🙂' }, tone: 'blue',
    name: { ar: 'المشاعر', en: 'Feelings' },
    blurb: { ar: 'أفرح زعلان خايف — نتعلم نسمّي اللي حاسين بيه.', en: 'Naming what we feel, one face at a time.' },
  },
  {
    key: 'songs', glyph: { ar: '🎵', en: '🎵' }, tone: 'green',
    name: { ar: 'الأغاني والحركات', en: 'Songs and movement' },
    blurb: { ar: 'إيقاع وكلام وحركة — تعلّم بقلّب الجسم.', en: 'Rhythm, words and motion — learning that moves.' },
  },
];

const TONE_CLASS: Record<Area['tone'], string> = {
  yellow: 'lp-area--yellow',
  blue: 'lp-area--blue',
  coral: 'lp-area--coral',
  green: 'lp-area--green',
  purple: 'lp-area--purple',
};

export function LearningAreas() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const text = (a: string, e: string) => (ar ? a : e);
  return (
    <ul className="lp-areas">
      {AREAS.map((area, index) => (
        <Reveal
          as="li"
          key={area.key}
          className={`lp-area ${TONE_CLASS[area.tone]}${area.wide ? ' lp-area--wide' : ''}`}
          delay={Math.min(index, 4) * 0.07}
          y={20}
        >
          <span className="lp-area-glyph" aria-hidden="true">{ar ? area.glyph.ar : area.glyph.en}</span>
          <div className="lp-area-copy">
            <h3>{text(area.name.ar, area.name.en)}</h3>
            <p>{text(area.blurb.ar, area.blurb.en)}</p>
          </div>
          {area.wide && <Sparkle className="lp-area-sparkle" />}
        </Reveal>
      ))}
    </ul>
  );
}
