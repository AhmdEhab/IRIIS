import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
            contextImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b60d05?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'banana',
            nameAr: 'موز',
            nameEn: 'Banana',
            emoji: '🍌',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1571771894821-ad990241ec4a?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'orange',
            nameAr: 'برتقال',
            nameEn: 'Orange',
            emoji: '🍊',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b44?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'strawberry',
            nameAr: 'فراولة',
            nameEn: 'Strawberry',
            emoji: '🍓',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1464965911861-746a04b48ca6?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'grapes',
            nameAr: 'عنب',
            nameEn: 'Grapes',
            emoji: '🍇',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1537640538966-79f369b41f8f?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'watermelon',
            nameAr: 'بطيخ',
            nameEn: 'Watermelon',
            emoji: '🍉',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1587049352846-4a222e783137?auto=format&fit=crop&q=80&w=1000'
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
                                        <div className="text-8xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
                                            {food.emoji}
                                        </div>
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
