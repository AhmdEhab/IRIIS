import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Trophy, Check, HelpCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { BackButton } from './ui/BackButton';
import './learning-screens-landing.css';
import './final-screens-landing.css';

interface Item {
    id: string;
    emoji: string;
    nameAr: string;
    nameEn: string;
}

const ITEMS: Item[] = [
    { id: 'cat', emoji: '🐱', nameAr: 'قطة', nameEn: 'Cat' },
    { id: 'dog', emoji: '🐕', nameAr: 'كلب', nameEn: 'Dog' },
    { id: 'car', emoji: '🚗', nameAr: 'سيارة', nameEn: 'Car' },
    { id: 'apple', emoji: '🍎', nameAr: 'تفاحة', nameEn: 'Apple' },
    { id: 'lion', emoji: '🦁', nameAr: 'أسد', nameEn: 'Lion' },
    { id: 'elephant', emoji: '🐘', nameAr: 'فيل', nameEn: 'Elephant' },
    { id: 'plane', emoji: '✈️', nameAr: 'طائرة', nameEn: 'Plane' },
    { id: 'sun', emoji: '☀️', nameAr: 'شمس', nameEn: 'Sun' },
    { id: 'moon', emoji: '🌙', nameAr: 'قمر', nameEn: 'Moon' },
    { id: 'tree', emoji: '🌳', nameAr: 'شجرة', nameEn: 'Tree' },
];

export function ShadowMatchScreen() {
    const { navigateTo, unlockBadge, incrementProgress, activeRules } = useApp();
    const { playSound, speak } = useAudio();
    const { t, language } = useLanguage();

    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [options, setOptions] = useState<Item[]>([]);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
        generateRound();
    }, [round]);

    const generateRound = () => {
        const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
        const target = shuffled[0];
        const others = shuffled.slice(1, 4);
        const roundOptions = [target, ...others].sort(() => Math.random() - 0.5);

        setCurrentItem(target);
        setOptions(roundOptions);
        setSelectedId(null);
        setIsCorrect(null);

        // Williams Syndrome Strategy: Use auditory hook (verbally name the object as a clue)
        if (false) { /* auditoryHook removed: was a diagnosis-derived flag */
            const clue = language === 'ar'
                ? `هيا نجد ${target.nameAr}`
                : `Let's find the ${target.nameEn}`;
            speak(clue, language);
        } else {
            speak(language === 'ar' ? 'أين صاحب هذا الظل؟' : 'Where is the owner of this shadow?', language);
        }
    };

    const handleSelect = (item: Item) => {
        if (selectedId !== null || isGameOver) return;

        setSelectedId(item.id);
        const correct = item.id === currentItem?.id;
        setIsCorrect(correct);

        if (correct) {
            playSound('success');
            setScore(score + 10);
            speak(language === 'ar' ? `رائع! هذا الـ ${item.nameAr}` : `Awesome! That's the ${item.nameEn}`, language);
        } else {
            playSound('error');
            speak(language === 'ar' ? 'حاول مرة أخرى' : 'Try again', language);
        }

        setTimeout(() => {
            if (round < 10) {
                setRound(round + 1);
            } else {
                handleWin();
            }
        }, 2000);
    };

    const handleWin = () => {
        setIsGameOver(true);
        playSound('celebration');
        if (score >= 80) {
            unlockBadge('shadow-master');
            incrementProgress('games-hub');
        }
    };

    const handleBack = () => {
        playSound('tap');
        navigateTo('games-hub');
    };

    return (
        <div className="gam-landing cl-learn min-h-screen bg-brand-blue-wash p-4 overflow-hidden">
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className="t-title text-brand-blue-ink text-center flex-1">
 {t.shadowMatch} 
 </h1>
                    <div className="bg-surface px-6 py-2 rounded-full shadow-brand border-2 border-brand-blue">
                        <p className="text-xl font-black text-brand-blue-ink">
                            {language === 'ar' ? 'الجولة' : 'Round'} {round}/10
                        </p>
                    </div>
                </div>

                {!isGameOver ? (
                    <div className="grid lg:grid-cols-2 gap-6 items-center">
                        <motion.div key={round + 'shadow'} initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col items-center">
                            <Card className="w-full aspect-square max-w-md bg-surface border-2 border-hairline shadow-brand-lg rounded-brand-xl flex flex-col items-center justify-center p-12 relative overflow-hidden">
                                <div className="absolute top-6 start-6 opacity-10" aria-hidden="true">
                                    <HelpCircle className="size-20 text-brand-blue-ink" />
                                </div>
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        filter: activeRules?.gestaltInstruction ? 'brightness(1.2)' : 'brightness(0)'
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className={`text-[15rem] transition-all duration-500 ${activeRules?.gestaltInstruction ? 'opacity-100' : 'opacity-80'}`}
                                    aria-hidden="true"
                                >
                                    {currentItem?.emoji}
                                </motion.div>
                                <div className="mt-8 bg-brand-blue-wash px-8 py-3 rounded-full">
                                    <p className="text-2xl font-bold text-brand-blue-ink">
                                        {language === 'ar' ? 'من أنا؟' : 'Who am I?'}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-6">
                            {options.map((option, idx) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ scale: 0, y: 50 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => handleSelect(option)}
                                    disabled={selectedId !== null}
                                    whileHover={{ scale: selectedId === null ? 1.05 : 1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={language === 'ar' ? option.nameAr : option.nameEn}
                                    className={`
                                        aspect-square rounded-brand-xl border-8 shadow-brand relative flex items-center justify-center text-8xl transition-all duration-300 
                                        ${selectedId === option.id
                                            ? isCorrect ? 'border-brand-green bg-brand-green-wash' : 'border-brand-coral bg-brand-coral-wash'
                                            : selectedId === null
                                                ? 'border-hairline bg-surface hover:border-brand-blue'
                                                : option.id === currentItem?.id ? 'border-brand-green bg-brand-green-wash' : 'border-hairline bg-ground-tint opacity-50'
                                        }
                                        
                                    `}
                                >
                                    <span className={selectedId !== null && option.id !== currentItem?.id ? 'filter grayscale' : ''} aria-hidden="true">{option.emoji}</span>
                                    {selectedId === option.id && isCorrect && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-brand-green/20 rounded-brand-xl" aria-hidden="true"><Check className="size-24 text-brand-green-ink" /></motion.div>}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8">
                        <div className="relative inline-block">
                            <Trophy className="size-40 text-brand-yellow-ink mx-auto" aria-hidden="true" />
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-x-0 -top-4 text-4xl" aria-hidden="true">✨ ✨ ✨</motion.div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="t-title text-brand-blue-ink">{language === 'ar' ? 'عمل رائع يا محقق!' : 'Great Job Detective!'}</h2>
                            <p className="text-3xl font-bold text-brand-blue-ink">{language === 'ar' ? `نتيجتك: ${score}/100` : `Your Score: ${score}/100`}</p>
                        </div>
                        <div className="flex justify-center gap-6">
                            <Button onClick={() => { setScore(0); setRound(1); setIsGameOver(false); playSound('celebration'); }} size="lg" className="bg-brand-blue hover:bg-brand-blue text-2xl px-12 py-8 rounded-full shadow-brand-lg">
                                <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                {language === 'ar' ? 'العب ثانية' : 'Play Again'}
                            </Button>
                            <Button onClick={handleBack} variant="outline" size="lg" className="bg-surface text-2xl px-12 py-8 rounded-full border-4 shadow-brand">{language === 'ar' ? 'صالة الألعاب' : 'Games Hub'}</Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
