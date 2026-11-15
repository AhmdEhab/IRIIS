import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './ui/BackButton';
import { SyndromeLearningCard } from './SyndromeLearningCard';

interface Animal {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    soundEffect: string;
    contextImage?: string;
}

export function AnimalsScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

    const animals: Animal[] = [
        {
            id: 'lion',
            nameAr: 'أسد',
            nameEn: 'Lion',
            emoji: '🦁',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'elephant',
            nameAr: 'فيل',
            nameEn: 'Elephant',
            emoji: '🐘',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'giraffe',
            nameAr: 'زرافة',
            nameEn: 'Giraffe',
            emoji: '🦒',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1547721064-36202634a13b?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'monkey',
            nameAr: 'قرد',
            nameEn: 'Monkey',
            emoji: '🐒',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'cat',
            nameAr: 'قطة',
            nameEn: 'Cat',
            emoji: '🐱',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'dog',
            nameAr: 'كلب',
            nameEn: 'Dog',
            emoji: '🐶',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'panda',
            nameAr: 'باندا',
            nameEn: 'Panda',
            emoji: '🐼',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1564349683136-77e08bef1ef1?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'tiger',
            nameAr: 'نمر',
            nameEn: 'Tiger',
            emoji: '🐯',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1500463959177-e0869687df26?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'zebra',
            nameAr: 'حمار وحشي',
            nameEn: 'Zebra',
            emoji: '🦓',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'rabbit',
            nameAr: 'أرنب',
            nameEn: 'Rabbit',
            emoji: '🐰',
            color: ' ',
            soundEffect: 'success',
            contextImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=1000'
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedAnimalId) {
            setSelectedAnimalId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedAnimal = animals.find(a => a.id === selectedAnimalId);

    const handleAnimalSelect = (animal: Animal) => {
        playSound('tap');
        setSelectedAnimalId(animal.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('animals');
        setTimeout(() => setSelectedAnimalId(null), 1500);
    };

    return (
        <div className={`wld-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-yellow-wash via-white '}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-yellow-ink'}`}>
 {language === 'ar' ? 'أصدقاؤنا الحيوانات' : 'Animal Friends'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedAnimalId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        >
                            {animals.map((animal, index) => (
                                <motion.div
                                    key={animal.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleAnimalSelect(animal)}
                                        className={`w-full aspect-square rounded-brand-xl shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : animal.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <div className="text-8xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
                                            {animal.emoji}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white drop-shadow-brand">
                                            {language === 'ar' ? animal.nameAr : animal.nameEn}
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
                            {selectedAnimal && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedAnimal.id}
                                        mainVisual={selectedAnimal.emoji}
                                        nameAr={selectedAnimal.nameAr}
                                        nameEn={selectedAnimal.nameEn}
                                        soundEffect={selectedAnimal.soundEffect}
                                        contextImage={selectedAnimal.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedAnimalId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار حيوان آخر' : 'Choose another animal'}
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
