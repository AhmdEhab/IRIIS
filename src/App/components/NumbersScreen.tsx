import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './ui/BackButton';
import { SyndromeLearningCard } from './SyndromeLearningCard';
import './learning-screens-landing.css';

interface NumberItem {
    id: string;
    val: number;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
}

export function NumbersScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedNumId, setSelectedNumId] = useState<string | null>(null);

    const numbers: NumberItem[] = [
        { id: '1', val: 1, nameAr: 'واحد', nameEn: 'One', emoji: '🍎', color: ' ' },
        { id: '2', val: 2, nameAr: 'اثنان', nameEn: 'Two', emoji: '🐥🐥', color: ' ' },
        { id: '3', val: 3, nameAr: 'ثلاثة', nameEn: 'Three', emoji: '🚗🚗🚗', color: ' ' },
        { id: '4', val: 4, nameAr: 'أربعة', nameEn: 'Four', emoji: '🦋🦋🦋🦋', color: ' ' },
        { id: '5', val: 5, nameAr: 'خمسة', nameEn: 'Five', emoji: '🖐️', color: ' ' },
        { id: '6', val: 6, nameAr: 'ستة', nameEn: 'Six', emoji: '🐝🐝🐝🐝🐝🐝', color: ' ' },
        { id: '7', val: 7, nameAr: 'سبعة', nameEn: 'Seven', emoji: '🌈', color: ' ' },
        { id: '8', val: 8, nameAr: 'ثمانية', nameEn: 'Eight', emoji: '🐙', color: ' ' },
        { id: '9', val: 9, nameAr: 'تسعة', nameEn: 'Nine', emoji: '🎈🎈🎈🎈🎈🎈🎈🎈🎈', color: ' ' },
        { id: '10', val: 10, nameAr: 'عشرة', nameEn: 'Ten', emoji: '👐', color: ' ' }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedNumId) {
            setSelectedNumId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedNum = numbers.find(n => n.id === selectedNumId);

    const handleNumSelect = (num: NumberItem) => {
        playSound('tap');
        setSelectedNumId(num.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('numbers');
        setTimeout(() => setSelectedNumId(null), 1500);
    };

    return (
        <div className={`nsl-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-yellow-ink'}`}>
 {language === 'ar' ? 'تعلم الأرقام' : 'Learn Numbers'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedNumId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
                        >
                            {numbers.map((num, index) => (
                                <motion.div
                                    key={num.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleNumSelect(num)}
                                        className={`w-full aspect-square rounded-brand-lg shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : num.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <span className="text-7xl font-black text-white drop-shadow-brand-sm">
                                            {num.val}
                                        </span>
                                        <span className="text-xl font-bold text-white/90 mt-2">
                                            {language === 'ar' ? num.nameAr : num.nameEn}
                                        </span>
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
                            {selectedNum && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        mainVisual={selectedNum.val.toString()}
                                        nameAr={selectedNum.nameAr}
                                        nameEn={selectedNum.nameEn}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedNumId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" />
                                            {language === 'ar' ? 'اختيار رقم آخر' : 'Choose another number'}
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
