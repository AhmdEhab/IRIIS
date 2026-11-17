/**
 * ObjectStudy — the unified "Touch, Explore & Learn" block.
 *
 * P73: every picture a child sees here is a genuine photograph.
 * ALWAYS a two-cell grid so every lesson screen looks the same:
 *   cell 1: an interactive 3D model when the concept has one, otherwise the
 *           real photograph itself, otherwise a pastel hero tile.
 *   cell 2: for numbers — N thumbnails of ONE real object (the quantity
 *           stays countable and photographic); for 3D items — the matching
 *           real photograph; otherwise the brand name card. Never emoji as
 *           a content image; emoji only survive as error fallbacks.
 * A reset pill returns the camera, one hint line sits under the grid.
 * All pointer events are contained: exploring never advances the card.
 */
import React, { Suspense, lazy, useCallback, useState } from 'react';
import type { Object3DEntry } from '../../data/object3d';

const ViewerLazy = lazy(() => import('./Object3DViewer'));
const OrbLazy = lazy(() => import('./ProceduralOrb'));

interface ObjectStudyProps {
    entry?: Object3DEntry;
    nameAr: string;
    nameEn: string;
    language: 'ar' | 'en';
    /** the item's visual emoji, used only when there is no photograph */
    mainVisual?: string;
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

/** pastel washes cycled deterministically by the item name */
const WASHES = [
    ['#FDEBEC', '#FBD5DC'], // coral wash
    ['#E7F1FA', '#D3E6F8'], // blue wash
    ['#FDF3E0', '#FBE7C3'], // yellow wash
    ['#E9F6EE', '#D2EDDC'], // green wash
    ['#EFEAFB', '#DFD5F6'], // purple wash
];
function washFor(text: string): [string, string] {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return WASHES[h % WASHES.length] as [string, string];
}

export function ObjectStudy({ entry, nameAr, nameEn, language, mainVisual, compact }: ObjectStudyProps) {
    const ar = language === 'ar';
    const [resetKey, setResetKey] = useState(0);
    const [photoFailed, setPhotoFailed] = useState(false);
    const name = ar ? nameAr : nameEn;
    const visual = mainVisual || (ar ? nameAr.slice(0, 1) : nameEn.slice(0, 1).toUpperCase());

    const reset = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setResetKey(k => k + 1);
    }, []);

    const contain = (e: React.SyntheticEvent) => e.stopPropagation();

    const hasModel = Boolean(entry?.glb || entry?.proc);
    const photo = entry?.photo && !photoFailed;
    const [washA, washB] = washFor(name);
    const heroBg = { background: `linear-gradient(160deg, ${washA}, ${washB})` };

    const PhotoCell = (
        <div className="os-cell os-photo">
            <div className="os-tag">{ar ? 'صورة حقيقية' : 'Real photo'}</div>
            <img
                src={entry!.photo}
                alt={ar ? `صورة حقيقية ${nameAr}` : `Real photograph of ${nameEn}`}
                loading="lazy"
                onError={() => setPhotoFailed(true)}
            />
        </div>
    );

    return (
        <div
            className={`os-study${compact ? ' os-compact' : ''}`}
            dir={ar ? 'rtl' : 'ltr'}
            onClick={contain}
            onPointerDown={contain}
        >
            <div className="os-grid">
                {hasModel ? (
                    <div className="os-cell os-3d">
                        <div className="os-tag">{ar ? 'مجسم تفاعلي 3D' : 'Interactive 3D'}</div>
                        <Suspense fallback={<div className="os-loading">{ar ? 'بتحمّل المجسم…' : 'Loading model…'}</div>}>
                            <StudyBoundary fallback={<div className="os-emoji">{entry!.fallbackEmoji ?? '✨'}</div>}>
                                {entry!.glb ? (
                                    <ViewerLazy
                                        key={`glb-${resetKey}`}
                                        src={entry!.glb!}
                                        alt={name}
                                        lang={language}
                                        fallbackEmoji={entry!.fallbackEmoji}
                                    />
                                ) : (
                                    <OrbLazy key={`orb-${resetKey}`} color={entry!.proc?.color ?? '#3E7BFA'} alt={name} />
                                )}
                            </StudyBoundary>
                        </Suspense>
                        <button
                            type="button"
                            className="os-reset"
                            onClick={reset}
                            aria-label={ar ? 'إرجاع المجسم لبدايته' : 'Reset view'}
                        >
                            ↺ {ar ? 'من الأول' : 'Reset'}
                        </button>
                    </div>
                ) : photo ? (
                    PhotoCell
                ) : (
                    <div className="os-cell os-hero" style={heroBg}>
                        <div className="os-tag">{ar ? 'نظرة أولى' : 'First look'}</div>
                        <span className="os-hero-emoji" aria-hidden="true">{visual}</span>
                    </div>
                )}

                {entry?.count ? (
                    <div className="os-cell os-count" style={heroBg}>
                        <div className="os-tag">{ar ? 'نعدّ سوا' : 'Count with me'}</div>
                        <div className="os-dots" role="img" aria-label={`${entry.count}`}>
                            {Array.from({ length: entry.count }).map((_, i) => (
                                photo ? (
                                    <img
                                        key={i}
                                        src={entry!.photo}
                                        alt=""
                                        aria-hidden="true"
                                        loading="lazy"
                                        className="os-dot-img"
                                        style={{ animationDelay: `${i * 90}ms` }}
                                    />
                                ) : (
                                    <span key={i} className="os-dot" style={{ animationDelay: `${i * 90}ms` }}>
                                        {entry.fallbackEmoji ?? '⭐'}
                                    </span>
                                )
                            ))}
                        </div>
                    </div>
                ) : hasModel && photo ? (
                    PhotoCell
                ) : (
                    <div className="os-cell os-name" style={heroBg}>
                        <div className="os-tag">{ar ? 'بطاقة الاسم' : 'Name card'}</div>
                        {!photo && <span className="os-hero-emoji" aria-hidden="true">{visual}</span>}
                        <span className="os-name-word">{name}</span>
                    </div>
                )}
            </div>
            {hasModel && (
                <p className="os-hint">
                    {ar
                        ? '👆 حرّك بإصبعك ولفّه من كل ناحية، وقرّب وشوف التفاصيل!'
                        : '👆 Drag to spin it, pinch or scroll to zoom in!'}
                </p>
            )}
        </div>
    );
}

export default ObjectStudy;
