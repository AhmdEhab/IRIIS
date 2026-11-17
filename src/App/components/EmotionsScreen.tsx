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

interface Emotion {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    contextImage?: string;
}

export function EmotionsScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedEmotionId, setSelectedEmotionId] = useState<string | null>(null);

    const emotions: Emotion[] = [
        {
            id: 'happy',
            nameAr: 'سعيد',
            nameEn: 'Happy',
            emoji: '😊',
            color: ' ',
            contextImage: '/photos/emo-happy.jpg' // Happy kids playing
        },
        {
            id: 'sad',
            nameAr: 'حزين',
            nameEn: 'Sad',
            emoji: '😢',
            color: ' ',
            contextImage: '/photos/emo-sad.jpg' // Child feeling sad/lonely
        },
        {
            id: 'angry',
            nameAr: 'غاضب',
            nameEn: 'Angry',
            emoji: '😠',
            color: ' ',
            contextImage: '/photos/emo-angry.jpg' // Angry stance/expression
        },
        {
            id: 'excited',
            nameAr: 'متحمس',
            nameEn: 'Excited',
            emoji: '🤩',
            color: ' ',
            contextImage: '/photos/emo-excited.jpg' // Excited celebration
        },
        {
            id: 'surprised',
            nameAr: 'متفاجئ',
            nameEn: 'Surprised',
            emoji: '😲',
            color: ' ',
            contextImage: '/photos/emo-surprised.jpg' // Surprised expression
        },
        {
            id: 'calm',
            nameAr: 'هادئ',
            nameEn: 'Calm',
            emoji: '😌',
            color: ' ',
            contextImage: '/photos/emo-calm.jpg' // Calm/Peaceful scene
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedEmotionId) {
            setSelectedEmotionId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedEmotion = emotions.find(e => e.id === selectedEmotionId);

    const handleEmotionSelect = (emotion: Emotion) => {
        playSound('tap');
        setSelectedEmotionId(emotion.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('emotions');
        setTimeout(() => setSelectedEmotionId(null), 1500);
    };

    return (
        <div className={`crd-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-coral-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-coral-ink'}`}>
 {language === 'ar' ? 'مشاعري الجميلة' : 'My Emotions'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedEmotionId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-8"
                        >
                            {emotions.map((emotion, index) => (
                                <motion.div
                                    key={emotion.id}
                                    initial={{ scale: 0, scaleZ: 0.5 }}
                                    animate={{ scale: 1, scaleZ: 1 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleEmotionSelect(emotion)}
                                        className={`w-full aspect-square rounded-full shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : emotion.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <RealPhoto
                                            src={emotion.contextImage}
                                            alt={language === 'ar' ? emotion.nameAr : emotion.nameEn}
                                            fallback={emotion.emoji}
                                            className="h-28 w-28 md:h-32 md:w-32 rounded-full"
                                            wrapperClassName="group-hover:scale-110 transition-transform"
                                        />
                                        <h3 className="text-3xl font-bold text-white drop-shadow-brand">
                                            {language === 'ar' ? emotion.nameAr : emotion.nameEn}
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
                            {selectedEmotion && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedEmotion.id}
                                        mainVisual={selectedEmotion.emoji}
                                        nameAr={selectedEmotion.nameAr}
                                        nameEn={selectedEmotion.nameEn}
                                        contextImage={selectedEmotion.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedEmotionId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار شعور آخر' : 'Choose another emotion'}
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
import './creative-screens-landing.css';
