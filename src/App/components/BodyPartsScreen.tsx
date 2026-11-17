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

interface BodyPart {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    contextImage?: string;
}

export function BodyPartsScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

    const bodyParts: BodyPart[] = [
        {
            id: 'eyes',
            nameAr: 'العينان',
            nameEn: 'Eyes',
            emoji: '👀',
            color: ' ',
            contextImage: '/photos/eyes.jpg' // Eye close up
        },
        {
            id: 'ears',
            nameAr: 'الأذنان',
            nameEn: 'Ears',
            emoji: '👂',
            color: ' ',
            contextImage: '/photos/ears.jpg' // Listening to music
        },
        {
            id: 'nose',
            nameAr: 'الأنف',
            nameEn: 'Nose',
            emoji: '👃',
            color: ' ',
            contextImage: '/photos/nose.jpg' // Smelling flowers
        },
        {
            id: 'mouth',
            nameAr: 'الفم',
            nameEn: 'Mouth',
            emoji: '👄',
            color: ' ',
            contextImage: '/photos/mouth.jpg' // Eating/Smiling
        },
        {
            id: 'hands',
            nameAr: 'اليدان',
            nameEn: 'Hands',
            emoji: '🙌',
            color: ' ',
            contextImage: '/photos/hands.jpg' // Child painting with hands
        },
        {
            id: 'feet',
            nameAr: 'القدمان',
            nameEn: 'Feet',
            emoji: '👣',
            color: ' ',
            contextImage: '/photos/feet.jpg' // Child feet in colors
        },
        {
            id: 'heart',
            nameAr: 'القلب',
            nameEn: 'Heart',
            emoji: '❤️',
            color: ' ',
            contextImage: '/photos/shape-heart.jpg' // Heart bokeh/light
        },
        {
            id: 'brain',
            nameAr: 'الدماغ',
            nameEn: 'Brain',
            emoji: '🧠',
            color: ' ',
            contextImage: '/photos/brain.jpg' // Thinking child/Brain concept
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedPartId) {
            setSelectedPartId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedPart = bodyParts.find(p => p.id === selectedPartId);

    const handlePartSelect = (part: BodyPart) => {
        playSound('tap');
        setSelectedPartId(part.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('body-parts');
        setTimeout(() => setSelectedPartId(null), 1500);
    };

    return (
        <div className={`wld-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-coral-ink'}`}>
 {language === 'ar' ? 'أعضاء جسمي' : 'My Body Parts'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedPartId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-6"
                        >
                            {bodyParts.map((part, index) => (
                                <motion.div
                                    key={part.id}
                                    initial={{ scale: 0, scaleZ: index % 2 === 0 ? 0.9 : 1.1 }}
                                    animate={{ scale: 1, scaleZ: 1 }}
                                    transition={{ delay: index * 0.05, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handlePartSelect(part)}
                                        className={`w-full aspect-square rounded-brand-xl shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : part.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <RealPhoto
                                            src={part.contextImage}
                                            alt={language === 'ar' ? part.nameAr : part.nameEn}
                                            fallback={part.emoji}
                                            className="h-28 w-28 md:h-32 md:w-32 rounded-brand-xl"
                                            wrapperClassName="group-hover:scale-110 transition-transform"
                                        />
                                        <h3 className="text-xl font-bold text-white drop-shadow-brand-sm">
                                            {language === 'ar' ? part.nameAr : part.nameEn}
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
                            {selectedPart && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedPart.id}
                                        mainVisual={selectedPart.emoji}
                                        nameAr={selectedPart.nameAr}
                                        nameEn={selectedPart.nameEn}
                                        contextImage={selectedPart.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedPartId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار عضو آخر' : 'Choose another part'}
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
