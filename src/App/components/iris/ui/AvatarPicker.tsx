/**
 * AvatarPicker — optional child avatar selection (Phase 11).
 *
 * Purely cosmetic. Avatars are a fixed, inclusive, non-stereotypical set of
 * emoji faces/creatures with NO link whatsoever to diagnosis or condition —
 * they are not passed to, read by, or derived from anything in src/iris/.
 * Stored client-side only (IrisContext), for the child's experience only.
 */
import React from 'react';

export const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐨', '🐧', '🦋', '🐢', '🌟', '🚀'];

export function AvatarPicker({
  value,
  onChange,
  language = 'ar',
}: {
  value: string;
  onChange: (avatar: string) => void;
  language?: 'ar' | 'en';
}) {
  return (
    <div>
      <p className="text-sm font-bold text-ink-muted mb-2 text-center">
        {language === 'ar' ? 'اختر شخصيتك المفضّلة' : 'Pick your favourite character'}
      </p>
      <div
        className="flex flex-wrap justify-center gap-3"
        role="group"
        aria-label={language === 'ar' ? 'اختيار الشخصية' : 'Character choice'}
      >
        {AVATARS.map((a, i) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            aria-pressed={value === a}
            aria-label={
              language === 'ar' ? `الشخصية رقم ${i + 1}` : `Character ${i + 1}`
            }
            className={`relative w-14 h-14 rounded-brand text-3xl flex items-center justify-center border-4 transition-all
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue ${
              value === a
                ? 'border-brand-purple bg-brand-purple-wash scale-110 shadow-brand-sm'
                : 'border-hairline bg-surface hover:border-hairline'
            }`}
          >
            <span aria-hidden="true">{a}</span>
            {/* Selection shown by a glyph as well as colour/scale (WCAG 1.4.1). */}
            {value === a && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -end-1.5 text-sm bg-brand-blue-ink text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
