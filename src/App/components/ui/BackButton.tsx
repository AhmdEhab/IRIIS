import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBackSlot } from '../iris/ui/ChildShell';

interface BackButtonProps {
    onClick: () => void;
    className?: string;
}

/**
 * The legacy back control — now a SLOT, not a floating button.
 *
 * ── WHAT IT USED TO BE ────────────────────────────────────────────────────
 * `fixed top-6 left-6 z-[100]` with a glass background. Twenty-two screens
 * rendered one. Because it was fixed and physically left-anchored it:
 *   - sat on top of whatever the screen put in that corner,
 *   - stayed on the LEFT in Arabic, where "back" is on the right,
 *   - and used a glass treatment that appears nowhere else in the identity.
 *
 * ── WHAT IT IS NOW ────────────────────────────────────────────────────────
 * It hands its `onClick` to the surrounding `ChildShell`, which draws one real
 * back control inside the top bar — in the layout, correct under RTL, and
 * styled like every other control in the product. This component renders
 * nothing in that case.
 *
 * Doing it this way means twenty-two screens got a corrected back button
 * without twenty-two edits, and a screen that is later moved outside the frame
 * still works: with no slot to register with, it falls back to drawing itself.
 */
export function BackButton({ onClick, className = '' }: BackButtonProps) {
    const { t, language } = useLanguage() as any;
    const slot = useBackSlot();
    const ar = language === 'ar';

    // Register with the frame. The handler is re-registered when it changes,
    // and cleared on unmount so a stale screen's back action can never linger
    // in the bar after navigation.
    React.useEffect(() => {
        if (!slot) return;
        slot.set(onClick);
        return () => slot.set(null);
    }, [slot, onClick]);

    if (slot) return null;

    // Fallback for any future use outside ChildShell. Solid surface, logical
    // positioning, brand radius — not the old glass pill.
    return (
        <button
            type="button"
            onClick={onClick}
            className={`absolute top-4 start-4 z-30 inline-flex items-center gap-2 h-11 px-4
                rounded-brand-pill bg-surface border-2 border-hairline text-ink font-bold
                hover:bg-ground-tint transition-colors ${className}`}
        >
            {ar ? <ArrowRight className="size-5" /> : <ArrowLeft className="size-5" />}
            <span className="hidden md:inline text-sm">{t.back}</span>
        </button>
    );
}
