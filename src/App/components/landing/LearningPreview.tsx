import React, { lazy, Suspense, useState } from 'react';
import { Box, Rotate3D } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingButton } from './LandingPrimitives';

const Object3DViewer = lazy(() => import('../three/Object3DViewer'));
const models = [
  { id: 'apple', ar: 'تفاحة', en: 'Apple', emoji: '🍎' },
  { id: 'orange', ar: 'برتقالة', en: 'Orange', emoji: '🍊' },
  { id: 'fox', ar: 'ثعلب', en: 'Fox', emoji: '🦊' },
  { id: 'sphere', ar: 'كرة', en: 'Sphere', emoji: '🔵' },
  { id: 'cube', ar: 'مكعب', en: 'Cube', emoji: '🧊' },
  { id: 'star', ar: 'نجمة', en: 'Star', emoji: '⭐' },
  { id: 'heart', ar: 'قلب', en: 'Heart', emoji: '❤️' },
];

export function LearningPreview() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState(false);
  const model = models[selected];
  const name = ar ? model.ar : model.en;

  return (
    <div className="lp-demo" data-testid="learning-preview">
      <div className="lp-demo-bar">
        <span className="lp-demo-tag"><Box aria-hidden="true" />{ar ? 'تعلّم بالاستكشاف' : 'Learn by exploring'}</span>
        <span className="lp-demo-label">{ar ? 'تجربة مجانية بلا تسجيل' : 'Try it without signing up'}</span>
      </div>
      <div className="lp-demo-stage">
        {active ? (
          <Suspense fallback={<div className="lp-model-placeholder" role="status">{ar ? 'جارٍ تجهيز المجسّم…' : 'Loading the model…'}</div>}>
            <Object3DViewer
              key={model.id}
              src={`/models/${model.id}.glb`}
              alt={name}
              lang={language}
              fallbackEmoji={model.emoji}
              autoRotate={false}
              className="lp-live-model"
            />
          </Suspense>
        ) : (
          <div className="lp-model-placeholder">
            <span className="lp-object-symbol" role="img" aria-label={name}>{model.emoji}</span>
            <p>{ar ? 'شوفه من كل ناحية' : 'Discover every side'}</p>
            <LandingButton compact onClick={() => setActive(true)} data-testid="activate-3d"><Rotate3D aria-hidden="true" />{ar ? 'جرّب النموذج ثلاثي الأبعاد' : 'Try the 3D model'}</LandingButton>
          </div>
        )}
      </div>
      <div className="lp-object-picker" role="group" aria-label={ar ? 'اختيار المجسّم' : 'Choose a model'}>
        {models.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={index === selected}
            data-model={item.id}
            onClick={() => setSelected(index)}
          >
            <span aria-hidden="true">{item.emoji}</span>
            {ar ? item.ar : item.en}
          </button>
        ))}
      </div>
      <p className="lp-demo-help">{ar ? 'اختار مجسّم، وبعد تشغيله اسحب لتدويره. لو جهازك لا يدعم 3D، يفضل البديل الثابت ظاهرًا.' : 'Choose an object, then drag to rotate after starting. Devices without 3D support keep a static alternative.'}</p>
    </div>
  );
}
