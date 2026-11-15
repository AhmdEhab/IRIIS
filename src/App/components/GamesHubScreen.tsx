import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from './ui/card';
import { BackButton } from './ui/BackButton';
import './games-hub-landing.css';

export function GamesHubScreen() {
    const { navigateTo, activeRules } = useApp();
    const { playSound } = useAudio();
    const { t, language } = useLanguage();

    const games = [
        {
            id: 'memory-game',
            nameAr: 'لعبة الذاكرة',
            nameEn: 'Memory Match',
            descAr: 'اختبر قوة تركيزك وجد كل الصور المتشابهة!',
            descEn: 'Test your focus and find all matching pairs!',
            icon: '🧩',
            color: ' '
        },
        {
            id: 'balloon-pop',
            nameAr: 'فرقعة البالونات',
            nameEn: 'Balloon Pop',
            descAr: 'فرقع البالونات الملونة واجمع الكثير من النقاط!',
            descEn: 'Pop the colorful balloons and collect lots of points!',
            icon: '🎈',
            color: ' '
        },
        {
            id: 'shadow-match',
            nameAr: 'تطابق الظلال',
            nameEn: 'Shadow Match',
            descAr: 'هل يمكنك معرفة صاحب هذا الظل؟ اختر الصورة الصحيحة!',
            descEn: 'Can you recognize the shadow? Choose the correct image!',
            icon: '👤',
            color: ' '
        }
    ];

    const handleBack = () => {
        playSound('tap');
        navigateTo('child-mode');
    };

    const handleGameSelect = (game: any) => {
        playSound('tap');
        navigateTo(game.id);
    };

    return (
        <div className={`gh-landing min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal'
                ? 'bg-ground-tint'
                : 'bg-brand-purple-wash'
            }`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="w-24" />
                    <h1 className={`text-6xl font-black drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal'
                            ? 'text-ink-muted'
                            : 'text-brand-purple-ink'
                        }`}>
 {t.gamesHub} 
 </h1>
                    <div className="w-24" />
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring' }}
                        >
                            <button
                                onClick={() => handleGameSelect(game)}
                                className="w-full text-left group relative hover:scale-105 active:scale-95"
                            >
                                <Card className="p-0 overflow-hidden rounded-brand-xl border-2 border-hairline shadow-brand-lg h-full transition-shadow hover:shadow-brand">
                                    <div className={`h-48 bg-surface-sunk ${game.color} flex items-center justify-center relative overflow-hidden`} aria-hidden="true">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="text-9xl drop-shadow-brand-lg relative z-10"
                                        >
                                            {game.icon}
                                        </motion.div>

                                        {/* Decorative shapes — logical inset so the corner mirrors in RTL */}
                                        <div className="absolute top-0 end-0 p-4 opacity-20">
                                            <Sparkles className="size-20 text-white" />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-surface relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-3xl font-black text-ink">
                                                {language === 'ar' ? game.nameAr : game.nameEn}
                                            </h3>
                                            <div className={`p-2 rounded-brand-sm bg-surface-sunk ${game.color} text-white shadow-brand`}>
                                                <Zap className="size-6" aria-hidden="true" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-medium text-ink-muted leading-snug">
                                            {language === 'ar' ? game.descAr : game.descEn}
                                        </p>
                                    </div>
                                </Card>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
