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
// The 3D layer: Explore3D is the safe half (no three.js at module scope) and
// lazy-loads Object3DViewer only when a child opens the toggle.
import { Explore3D } from './three/Explore3D';
import { modelFor } from './three/modelLibrary';

interface FoodItem {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    contextImage?: string;
}

export function FruitsScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const foods: FoodItem[] = [
        {
            id: 'apple',
            nameAr: 'تفاحة',
            nameEn: 'Apple',
            emoji: '🍎',
            color: ' ',
            contextImage: '/photos/apple.jpg'
        },
        {
            id: 'banana',
            nameAr: 'موز',
            nameEn: 'Banana',
            emoji: '🍌',
            color: ' ',
            contextImage: '/photos/banana.jpg'
        },
        {
            id: 'orange',
            nameAr: 'برتقال',
            nameEn: 'Orange',
            emoji: '🍊',
            color: ' ',
            contextImage: '/photos/color-orange.jpg'
        },
        {
            id: 'strawberry',
            nameAr: 'فراولة',
            nameEn: 'Strawberry',
            emoji: '🍓',
            color: ' ',
            contextImage: '/photos/strawberry.jpg'
        },
        {
            id: 'grapes',
            nameAr: 'عنب',
            nameEn: 'Grapes',
            emoji: '🍇',
            color: ' ',
            contextImage: '/photos/grapes.jpg'
        },
        {
            id: 'watermelon',
            nameAr: 'بطيخ',
            nameEn: 'Watermelon',
            emoji: '🍉',
            color: ' ',
            contextImage: '/photos/watermelon.jpg'
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedItemId) {
            setSelectedItemId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedItem = foods.find(f => f.id === selectedItemId);

    const handleItemSelect = (item: FoodItem) => {
        playSound('tap');
        setSelectedItemId(item.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('fruits');
        setTimeout(() => setSelectedItemId(null), 1500);
    };

    return (
        <div className={`wld-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-coral-wash via-white '}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-coral-ink'}`}>
 {language === 'ar' ? 'تعلم الفواكه' : 'Learn Fruits'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedItemId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8"
                        >
                            {foods.map((food, index) => (
                                <motion.div
                                    key={food.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleItemSelect(food)}
                                        className={`w-full aspect-square rounded-brand-xl shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : food.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <RealPhoto
                                            src={food.contextImage}
                                            alt={language === 'ar' ? food.nameAr : food.nameEn}
                                            fallback={food.emoji}
                                            className="h-28 w-28 md:h-32 md:w-32 rounded-brand-xl"
                                            wrapperClassName="group-hover:scale-110 transition-transform"
                                        />
                                        <h3 className="text-2xl font-bold text-white drop-shadow-brand">
                                            {language === 'ar' ? food.nameAr : food.nameEn}
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
                            {selectedItem && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedItem.id}
                                        mainVisual={selectedItem.emoji}
                                        nameAr={selectedItem.nameAr}
                                        nameEn={selectedItem.nameEn}
                                        contextImage={selectedItem.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                   />

                                    {/* Visual layer only. The learning card above keeps
                                        its emoji, its photograph and its timed sequence
                                        untouched; this adds an optional, draggable 3D
                                        object below it for the items the library actually
                                        has a model for. Fruits with no accurate model get
                                        no button at all. */}
                                    <Explore3D
                                        src={modelFor(selectedItem.id)?.src ?? null}
                                        emoji={selectedItem.emoji}
                                        alt={language === 'ar' ? selectedItem.nameAr : selectedItem.nameEn}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedItemId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار فاكهة أخرى' : 'Choose another fruit'}
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
import './learning-screens-landing.css';
import './world-screens-landing.css';
