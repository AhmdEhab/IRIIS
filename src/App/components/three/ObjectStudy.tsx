/**
 * ObjectStudy — the interactive "Touch, Explore & Learn" block.
 *
 * One cell: a genuine, draggable 3D model (the same Object3DViewer the
 * landing page uses, or a real-geometry R3F orb for colors). Second cell:
 * an authentic photograph of the same object. A reset pill returns the
 * camera to its starting position, an Arabic hint chip tells the child
 * what to do. All pointer events are contained: dragging the model never
 * advances the surrounding lesson card.
 *
 * Assets come from src/App/data/object3d.ts. Nothing here fakes 3D with
 * CSS: if WebGL is missing, the viewer shows its own emoji fallback.
 */
import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { Object3DEntry } from '../../data/object3d';

// code-split: the three.js bundle is only fetched when a study block mounts
const ViewerLazy = lazy(() => import('./Object3DViewer'));
const OrbLazy = lazy(() => import('./ProceduralOrb'));

interface ObjectStudyProps {
    entry: Object3DEntry;
    nameAr: string;
    nameEn: string;
    language: 'ar' | 'en';
    compact?: boolean;
}

class StudyBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { failed: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { failed: false };
    }
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export function ObjectStudy({ entry, nameAr, nameEn, language, compact }: ObjectStudyProps) {
    const ar = language === 'ar';
    const [resetKey, setResetKey] = useState(0);
    const [photoFailed, setPhotoFailed] = useState(false);
    const name = ar ? nameAr : nameEn;

    const reset = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setResetKey(k => k + 1);
    }, []);

    const contain = (e: React.SyntheticEvent) => e.stopPropagation();

    const hasModel = Boolean(entry.glb || entry.proc);
    const showPhoto = Boolean(entry.photo && !photoFailed);

    return (
        <div
            className={`os-study${compact ? ' os-compact' : ''}`}
            dir={ar ? 'rtl' : 'ltr'}
            onClick={contain}
            onPointerDown={contain}
        >
            {hasModel && (
                <div className="os-cell os-3d">
                    <div className="os-tag">{ar ? 'مجسم تفاعلي 3D' : 'Interactive 3D'}</div>
                    <Suspense fallback={<div className="os-loading">{ar ? 'بتحمّل المجسم…' : 'Loading model…'}</div>}>
                        <StudyBoundary fallback={<div className="os-emoji">{entry.fallbackEmoji ?? '✨'}</div>}>
                            {entry.glb ? (
                                <ViewerLazy
                                    key={`glb-${resetKey}`}
                                    src={entry.glb}
                                    alt={name}
                                    lang={language}
                                    fallbackEmoji={entry.fallbackEmoji}
                                />
                            ) : (
                                <OrbLazy key={`orb-${resetKey}`} color={entry.proc?.color ?? '#3E7BFA'} alt={name} />
                            )}
                        </StudyBoundary>
                    </Suspense>
                    <button type="button" className="os-reset" onClick={reset} aria-label={ar ? 'إرجاع المجسم لبدايته' : 'Reset view'}>
                        ↺ {ar ? 'من الأول' : 'Reset'}
                    </button>
                    <p className="os-hint">
                        {ar
                            ? '👆 حرّك بإصبعك ولفّه من كل ناحية، وقرّب وشوف التفاصيل!'
                            : '👆 Drag to spin it, pinch or scroll to zoom in!'}
                    </p>
                </div>
            )}
            {showPhoto && (
                <div className="os-cell os-photo">
                    <div className="os-tag">{ar ? 'صورة حقيقية' : 'Real photo'}</div>
                    <img
                        src={entry.photo}
                        alt={ar ? `صورة حقيقية ${nameAr}` : `Real photograph of ${nameEn}`}
                        loading="lazy"
                        onError={() => setPhotoFailed(true)}
                    />
                </div>
            )}
            {!hasModel && !showPhoto && <div className="os-emoji">{entry.fallbackEmoji ?? '✨'}</div>}
        </div>
    );
}

export default ObjectStudy;
