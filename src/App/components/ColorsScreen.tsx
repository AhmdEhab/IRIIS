import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RealPhoto } from './ui/RealPhoto';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './ui/BackButton';
import { SyndromeLearningCard } from './SyndromeLearningCard';
import './learning-screens-landing.css';

interface ColorItem {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    hex: string;
    colorClass: string;
    soundEffect: string;
    contextImage?: string;
}

export function ColorsScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

    const colors: ColorItem[] = [
        {
            id: 'red',
            nameAr: 'أحمر',
            nameEn: 'Red',
            emoji: '🍎',
            hex: '#ef4444',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-red.jpg' // Apple orchard
        },
        {
            id: 'blue',
            nameAr: 'أزرق',
            nameEn: 'Blue',
            emoji: '🐳',
            hex: '#3b82f6',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-blue.jpg' // Sea
        },
        {
            id: 'green',
            nameAr: 'أخضر',
            nameEn: 'Green',
            emoji: '🌳',
            hex: '#22c55e',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-green.jpg' // Forest
        },
        {
            id: 'yellow',
            nameAr: 'أصفر',
            nameEn: 'Yellow',
            emoji: '☀️',
            hex: '#eab308',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-yellow.jpg' // Sunflowers
        },
        {
            id: 'color-orange',
            nameAr: 'برتقالي',
            nameEn: 'Orange',
            emoji: '🍊',
            hex: '#f97316',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-orange.jpg' // Oranges
        },
        {
            id: 'purple',
            nameAr: 'بنفسجي',
            nameEn: 'Purple',
            emoji: '🍇',
            hex: '#a855f7',
            colorClass: ' ',
            soundEffect: 'success',
            contextImage: '/photos/color-purple.jpg' // Lavender field
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedColorId) {
            setSelectedColorId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedColor = colors.find(c => c.id === selectedColorId);

    const handleColorSelect = (color: ColorItem) => {
        playSound('tap');
        setSelectedColorId(color.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('colors');
        setTimeout(() => setSelectedColorId(null), 1500);
    };

    return (
        <div className={`csl-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-coral-ink'}`}>
 {language === 'ar' ? 'تعلم الألوان' : 'Learn Colors'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedColorId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8"
                        >
                            {colors.map((color, index) => (
                                <motion.div
                                    key={color.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-full aspect-square rounded-brand-xl shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : color.colorClass} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <RealPhoto
                                            src={color.contextImage}
                                            alt={language === 'ar' ? color.nameAr : color.nameEn}
                                            fallback={color.emoji}
                                            className="h-28 w-28 md:h-32 md:w-32 rounded-brand-xl"
                                            wrapperClassName="group-hover:scale-110 transition-transform"
                                        />
                                        <h3 className={`text-2xl font-bold ${color.id === 'white' ? 'text-ink' : 'text-white'} drop-shadow-brand text-center`}>
                                            {language === 'ar' ? color.nameAr : color.nameEn}
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
                            {selectedColor && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedColor.id}
                                        mainVisual={selectedColor.emoji}
                                        nameAr={selectedColor.nameAr}
                                        nameEn={selectedColor.nameEn}
                                        soundEffect={selectedColor.soundEffect}
                                        contextImage={selectedColor.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedColorId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار لون آخر' : 'Choose another color'}
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
