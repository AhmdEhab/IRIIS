import React, { useState } from 'react';

/**
 * P73 — one real photograph everywhere the child used to see an emoji.
 *
 * Every learning screen shows genuine photographs (sourced by
 * scripts/fetch-photos.mjs into /public/photos). This component renders the
 * photo with the app's brand rounding and melts back to the item's emoji if
 * the file is missing or the network hiccups, so a child never sees a broken
 * image — at worst the old friendly icon.
 *
 * Intentionally dumb: no lazy lib, alt text is meaningful for screen readers
 * (children using magnifiers benefit), and `draggable={false}` stops the
 * browser ghost-image on the drag gestures the 3D/tactile layer relies on.
 */
interface RealPhotoProps {
    /** e.g. `/photos/apple.jpg` — the caller decides which photo this item has. */
    src?: string | null;
    /** Accessible name of the thing in the photograph (Arabic or English). */
    alt: string;
    /** Emoji fallback rendered when there is no photo or it failed to load. */
    fallback?: string;
    /** Tailwind size + rounding for the frame, e.g. 'h-28 w-28 rounded-brand-xl'. */
    className?: string;
    /** Extra classes for a hover scale wrapper (kept for parity with old tiles). */
    wrapperClassName?: string;
}

export function RealPhoto({ src, alt, fallback, className = 'h-28 w-28 rounded-brand-xl', wrapperClassName = '' }: RealPhotoProps) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <span
                aria-hidden="true"
                className={`grid place-items-center text-5xl md:text-6xl ${className} ${wrapperClassName} ${className.includes('rounded') ? '' : 'rounded-full bg-surface/60'}`}
            >
                {fallback}
            </span>
        );
    }
    return (
        <span className={`block overflow-hidden shadow-brand ring-2 ring-white/70 ${wrapperClassName} ${className}`}>
            <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setFailed(true)}
                className="h-full w-full object-cover"
            />
        </span>
    );
}

export default RealPhoto;
