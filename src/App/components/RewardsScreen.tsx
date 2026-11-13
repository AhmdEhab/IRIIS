import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Heart, Sparkles, Medal } from 'lucide-react';
import { useApp, Badge } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from './ui/card';
import { BackButton } from './ui/BackButton';

export function RewardsScreen() {
    const { navigateTo, earnedBadges, childProfile, activeRules } = useApp();
    const { playSound, speak } = useAudio();
    const { t, language } = useLanguage();

    const allBadges: Badge[] = [
        {
            id: 'explorer',
            nameAr: 'المستكشف الشجاع',
            nameEn: 'Brave Explorer',
            emoji: '🌍',
            descriptionAr: 'لفتح جميع الأقسام والبدء في المغامرة!',
            descriptionEn: 'For opening all sections and starting the adventure!',
            unlocked: earnedBadges.includes('explorer')
        },
        {
            id: 'beginner',
            nameAr: 'المبتدئ الذكي',
            nameEn: 'Smart Beginner',
            emoji: '🧠',
            descriptionAr: 'لإكمال أول اختبار تقييم بالذكاء الاصطناعي.',
            descriptionEn: 'For completing the first AI assessment.',
            unlocked: earnedBadges.includes('beginner')
        },
        {
            id: 'artist',
            nameAr: 'الفنان الصغير',
            nameEn: 'Little Artist',
            emoji: '🎨',
            descriptionAr: 'لرسوماتك الرائعة في المرسم الصغير.',
            descriptionEn: 'For your amazing drawings in the Little Studio.',
            unlocked: earnedBadges.includes('artist')
        },
        {
            id: 'animal-lover',
            nameAr: 'صديق الحيوان',
            nameEn: 'Animal Friend',
            emoji: '🦁',
            descriptionAr: 'لتعلم الكثير عن أصدقائنا الحيوانات.',
            descriptionEn: 'For learning a lot about our animal friends.',
            unlocked: earnedBadges.includes('animal-lover')
        },
        {
            id: 'master-counter',
            nameAr: 'بطل الأرقام',
            nameEn: 'Numbers Hero',
            emoji: '🔟',
            descriptionAr: 'لإتقان العد من 1 إلى 10.',
            descriptionEn: 'For mastering counting from 1 to 10.',
            unlocked: earnedBadges.includes('master-counter')
        },
        {
            id: 'word-wizard',
            nameAr: 'ساحر الكلمات',
            nameEn: 'Word Wizard',
            emoji: '📚',
            descriptionAr: 'لحفظ الكثير من الحروف والكلمات الجديدة.',
            descriptionEn: 'For remembering many new letters and words.',
            unlocked: earnedBadges.includes('word-wizard')
        }
    ];

    const handleBack = () => {
        playSound('tap');
        navigateTo('child-mode');
    };

    const handleBadgeClick = (badge: Badge) => {
        if (!badge.unlocked) {
            speak(language === 'ar' ? 'هذا الوسام سيفتح قريباً! استمر في التعلم.' : 'This badge will unlock soon! Keep learning.', language);
            playSound('error');
            return;
        }

        playSound('celebration');
        speak(language === 'ar' ? `وسام: ${badge.nameAr}. ${badge.descriptionAr}` : `Badge: ${badge.nameEn}. ${badge.descriptionEn}`, language);
    };

    return (
        <div className={`min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal'
                ? 'bg-ground-tint'
                : 'bg-ground'
            }`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="w-24" />
                    <div className="text-center flex-1">
                        <h1 className={`text-6xl font-black drop-shadow-brand mb-2 ${activeRules?.sensoryProfile === 'low-arousal'
                                ? 'text-ink-muted'
                                : 'text-brand-yellow-ink'
                            }`}>
 {t.rewards} 
 </h1>
                        <p className="text-2xl text-ink-muted font-medium">
                            {language === 'ar' ? `فخورون بك جداً يا ${childProfile?.name || 'بطلنا'}` : `We're so proud of you, ${childProfile?.name || 'Hero'}`}! 🌟
                        </p>
                    </div>
                    <div className="w-24" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="p-8 bg-brand-yellow border-none flex items-center gap-6 shadow-brand rounded-brand-lg">
                        <div className="size-20 rounded-full bg-surface flex items-center justify-center shadow-brand">
                            <Trophy className="size-12 text-brand-yellow-ink" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-brand-yellow-ink">{earnedBadges.length}</p>
                            <p className="text-lg font-bold text-brand-yellow-ink uppercase">{t.rewards}</p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-brand-blue border-none flex items-center gap-6 shadow-brand rounded-brand-lg">
                        <div className="size-20 rounded-full bg-surface flex items-center justify-center shadow-brand">
                            <Star className="size-12 text-brand-blue-ink" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-brand-blue-ink">1,250</p>
                            <p className="text-lg font-bold text-brand-blue-ink uppercase">{t.iqPoints}</p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-brand-coral border-none flex items-center gap-6 shadow-brand rounded-brand-lg">
                        <div className="size-20 rounded-full bg-surface flex items-center justify-center shadow-brand">
                            <Heart className="size-12 text-brand-coral-ink" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-brand-coral-ink">5</p>
                            <p className="text-lg font-bold text-brand-coral-ink uppercase">{t.streak}</p>
                        </div>
                    </Card>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {allBadges.map((badge, index) => (
                        <motion.div
                            key={badge.id}
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: index * 0.1, type: 'spring' }}
                        >
                            <button
                                onClick={() => handleBadgeClick(badge)}
                                className={`
                  w-full group relative transition-all duration-500
                  ${!badge.unlocked ? 'opacity-40 grayscale' : 'hover:scale-105 active:scale-95'}
                `}
                            >
                                <Card className={`
                  p-10 rounded-brand-xl border-2 border-hairline shadow-brand-lg flex flex-col items-center text-center overflow-hidden
                  ${badge.unlocked ? 'bg-surface' : 'bg-surface-sunk'}
                `}>
                                    {/* Decorative background circle */}
                                    <div className={`
                    absolute -top-10 -right-10 size-40 rounded-full opacity-10 transition-transform group-hover:scale-150
                    ${badge.unlocked ? 'bg-brand-yellow' : 'bg-hairline'}
                  `} />

                                    <div className={`
                    size-40 rounded-brand-lg mb-6 flex items-center justify-center text-8xl  relative
                    ${badge.unlocked ? 'bg-brand-yellow-wash' : 'bg-surface-sunk'}
                  `}>
                                        {badge.unlocked ? (
                                            <>
                                                <Sparkles className="absolute -top-4 -right-4 size-10 text-brand-yellow-ink animate-pulse" />
                                                {badge.emoji}
                                            </>
                                        ) : (
                                            <Medal className="size-20 text-ink-muted" />
                                        )}
                                    </div>

                                    <h3 className={`text-2xl font-black mb-2 ${badge.unlocked ? 'text-ink' : 'text-ink-muted'}`}>
                                        {language === 'ar' ? badge.nameAr : badge.nameEn}
                                    </h3>
                                    <p className={`text-sm font-medium leading-tight ${badge.unlocked ? 'text-ink-muted' : 'text-ink-muted'}`}>
                                        {language === 'ar' ? badge.descriptionAr : badge.descriptionEn}
                                    </p>

                                    {!badge.unlocked && (
                                        <div className="mt-4 bg-surface-sunk px-4 py-1 rounded-full text-xs font-bold text-ink-muted uppercase tracking-widest">
                                            {language === 'ar' ? 'مقفل' : 'Locked'}
                                        </div>
                                    )}
                                </Card>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
