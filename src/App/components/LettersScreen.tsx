import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './ui/BackButton';
import { getItemsByCategory } from '../data/MasterCurriculum';
import { SyndromeLearningCard } from './SyndromeLearningCard';
import './learning-screens-landing.css';

/* ── Readable tile text ───────────────────────────────────────────────────
   Tiles paint `letter.color` (a brand utility class, or ' ' meaning the
   light bg-surface-sunk plate) behind the text, and the old code always
   used text-white — unreadable on light brand washes and on the cream
   plate. Rule per the audit: for a colour value, compute relative
   luminance (WCAG) — white only when luminance < 0.45, else ink #1c2b3a.
   Class names are resolved to their iris.css token hex first; anything
   unresolvable (washes, the empty ' ' placeholder → surface-sunk cream)
   is treated as light → ink. */
const BRAND_CLASS_HEX: Record<string, string> = {
    'bg-brand-coral': '#f45b63',
    'bg-brand-blue': '#1f67b1',
    'bg-brand-green': '#49b87a',
    'bg-brand-yellow': '#feca34',
    'bg-brand-purple': '#8060b4',
    'bg-brand-coral-solid': '#c84b51',
    'bg-brand-blue-solid': '#1f67b1',
    'bg-brand-green-solid': '#358458',
    'bg-brand-purple-solid': '#8060b4',
    'bg-brand-yellow-solid': '#feca34',
};
const INK_TEXT = '#1c2b3a';
function relativeLuminance(hex: string): number {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const chan = (i: number) => {
        const v = parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * chan(0) + 0.7152 * chan(1) + 0.0722 * chan(2);
}
function tileTextColor(color: string | undefined): string {
    const c = (color || '').trim();
    if (!c) return INK_TEXT; // falls back to the light bg-surface-sunk plate
    if (c.includes('wash')) return INK_TEXT; // brand washes are always light
    const hex = c.startsWith('#') ? c : BRAND_CLASS_HEX[c];
    if (!hex) return INK_TEXT;
    return relativeLuminance(hex) < 0.45 ? '#ffffff' : INK_TEXT;
}

export function LettersScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);

    const letters = React.useMemo(() => {
        const allLetters = getItemsByCategory('letters');
        // Filter by language (English letters start with en_)
        if (language === 'ar') {
            return allLetters.filter(l => !l.id.startsWith('en_'));
        } else {
            return allLetters.filter(l => l.id.startsWith('en_'));
        }
    }, [language]);

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedLetterId) {
            setSelectedLetterId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedLetter = letters.find(l => l.id === selectedLetterId);

    const handleLetterSelect = (letter: any) => {
        playSound('tap');
        setSelectedLetterId(letter.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('letters');
        setTimeout(() => setSelectedLetterId(null), 1500);
    };

    return (
        <div className={`lsl-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-blue-ink'}`}>
 {language === 'ar' ? 'تعلم الحروف' : 'Learn Letters'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedLetterId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"
                        >
                            {letters.map((letter, index) => (
                                <motion.div
                                    key={letter.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleLetterSelect(letter)}
                                        className={`w-full aspect-square rounded-brand-lg shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : letter.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <span className="text-6xl font-black drop-shadow-brand-sm" dir="ltr" style={{ color: tileTextColor(activeRules?.sensoryProfile === 'low-arousal' ? ' ' : letter.color) }}>
                                            {letter.emoji}
                                        </span>
                                        <h3 className="text-lg font-bold text-center drop-shadow-brand-sm mt-2" style={{ color: tileTextColor(activeRules?.sensoryProfile === 'low-arousal' ? ' ' : letter.color), opacity: 0.92 }}>
                                            {language === 'ar' ? letter.nameAr : letter.nameEn}
                                        </h3>
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="max-w-4xl mx-auto pt-10"
                        >
                            {selectedLetter && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedLetter.id}
                                        mainVisual={selectedLetter.emoji}
                                        nameAr={selectedLetter.nameAr}
                                        nameEn={selectedLetter.nameEn}
                                        soundEffect="success"
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedLetterId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" />
                                            {language === 'ar' ? 'اختيار حرف آخر' : 'Choose another letter'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
