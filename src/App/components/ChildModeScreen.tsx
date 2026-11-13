import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Lock, Award, Home, Play, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { BackButton } from './ui/BackButton';

interface Level {
  id: string;
  name: string;
  icon: string;
  color: string;
  locked: boolean;
  progress: number;
  category: string;
}

export function ChildModeScreen() {
  const { navigateTo, childProfile, moduleProgress, activeRules, startDailySession } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language, dir } = useLanguage();

  const categories = [
    { id: 'recommended', name: language === 'ar' ? 'رحلتك المقترحة' : 'Your Journey', icon: '✨', color: ' ' },
    { id: 'basics', name: t.basics, icon: '🧩', color: ' ' },
    { id: 'world', name: t.world, icon: '🌍', color: ' ' },
    { id: 'creative', name: t.creative, icon: '🎨', color: ' ' },
  ];

  const levels: Level[] = React.useMemo(() => {
    const rawLevels: Level[] = [
      // Basics
      { id: 'letters', name: t.letters, icon: '📝', color: ' ', locked: false, progress: moduleProgress['letters'] || 0, category: 'basics' },
      { id: 'numbers', name: t.numbers, icon: '🔢', color: ' ', locked: false, progress: moduleProgress['numbers'] || 0, category: 'basics' },
      { id: 'shapes', name: t.shapes, icon: '🔺', color: ' ', locked: false, progress: moduleProgress['shapes'] || 0, category: 'basics' },
      { id: 'colors', name: t.colors, icon: '🎨', color: ' ', locked: false, progress: moduleProgress['colors'] || 0, category: 'basics' },

      // World
      { id: 'animals', name: t.animals, icon: '🦁', color: ' ', locked: false, progress: moduleProgress['animals'] || 0, category: 'world' },
      { id: 'fruits', name: t.fruits, icon: '🍎', color: ' ', locked: false, progress: moduleProgress['fruits'] || 0, category: 'world' },
      { id: 'body-parts', name: t.bodyParts, icon: '🧒', color: ' ', locked: false, progress: moduleProgress['body-parts'] || 0, category: 'world' },
      { id: 'life-skills', name: t.lifeSkills, icon: '🏠', color: ' ', locked: false, progress: moduleProgress['life-skills'] || 0, category: 'world' },
      { id: 'vehicles', name: t.vehicles, icon: '🚀', color: ' ', locked: false, progress: moduleProgress['vehicles'] || 0, category: 'world' },

      // Creative
      { id: 'stories', name: t.stories, icon: '📚', color: ' ', locked: false, progress: moduleProgress['stories'] || 0, category: 'creative' },
      { id: 'drawing', name: t.drawing, icon: '🎨', color: ' ', locked: false, progress: moduleProgress['drawing'] || 0, category: 'creative' },
      { id: 'emotions', name: t.emotions, icon: '😊', color: ' ', locked: false, progress: moduleProgress['emotions'] || 0, category: 'creative' },
      { id: 'songs', name: t.songs, icon: '🎵', color: ' ', locked: false, progress: moduleProgress['songs'] || 0, category: 'creative' },
      { id: 'games-hub', name: t.gamesHub, icon: '🎮', color: ' ', locked: false, progress: moduleProgress['games-hub'] || 0, category: 'creative' },
    ];

    if (!activeRules?.moduleOrder) return rawLevels;

    // Create a specialized "Recommended" category based on the scientific order
    const orderedIds = activeRules.moduleOrder;
    const recommendedLevels = orderedIds
      .map(id => rawLevels.find(l => l.id === id))
      .filter((l): l is Level => l !== undefined)
      .map(l => ({ ...l, category: 'recommended' }));

    return [...recommendedLevels, ...rawLevels];
  }, [moduleProgress, t, activeRules, language]);

  const handleLevelClick = (level: Level) => {
    if (level.locked) {
      playSound('error');
      speak(language === 'ar' ? 'هذا المستوى مقفل' : 'This level is locked', language);
      return;
    }
    playSound('tap');
    speak(level.name, language);
    setTimeout(() => navigateTo(level.id as any), 500);
  };

  const handleBackToMenu = () => {
    playSound('tap');
    navigateTo('mode-selection');
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 overflow-x-hidden">
      {/* Premium Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-surface border-b-4 border-hairline-soft px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button
            onClick={handleBackToMenu}
            variant="outline"
            size="lg"
            className="rounded-brand border-2 border-hairline-soft hover:bg-surface-sunk text-ink-muted font-black h-14"
          >
            <Home className="size-6 me-2" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>

          <div className="flex items-center gap-6">
            <Button
              onClick={() => { playSound('celebration'); navigateTo('rewards'); }}
              className="bg-brand-yellow-wash text-ink rounded-brand h-14 px-6 border-b-4 border-brand-yellow active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-brand"
            >
              <Award className="size-6 animate-pulse" />
              <span className="font-black text-xl">
                {language === 'ar' ? 'جوائزي' : 'Awards'}
              </span>
            </Button>

            <div className="bg-brand-purple-wash text-brand-purple-ink px-6 py-3 rounded-brand font-black text-xl border-2 border-brand-purple">
              {childProfile?.name || 'Explorer'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32 space-y-16">
        {/* Welcome Hero Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative"
        >
          <Card className="bg-brand-purple-wash text-white p-12 rounded-brand-xl shadow-brand-lg border-2 border-hairline overflow-hidden relative group">
            {/* Decorative Elements */}
            <Sparkles className="absolute top-10 right-10 size-20 opacity-20 group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -bottom-10 -left-10 size-40 bg-surface opacity-5 rounded-full blur-3xl" />

            <div className="grid md:grid-cols-2 items-center gap-12 relative z-10">
              <div className="space-y-6">
                <motion.h1
                  initial={{ x: -50 }}
                  animate={{ x: 0 }}
                  className="text-6xl font-black leading-tight drop-shadow-brand"
                >
                  {language === 'ar' ? `أهلاً بك يا ${childProfile?.name || 'بطلنا'}! ✨` : `Welcome back, ${childProfile?.name || 'Hero'}! ✨`}
                </motion.h1>
                <p className="text-2xl text-brand-purple-ink font-bold leading-relaxed max-w-md">
                  {language === 'ar' ? 'مستعد لمغامرة تعليمية جديدة اليوم؟ لقد حضرنا لك أشياء ممتعة!' : "Ready for a new learning adventure today? We've prepared some fun things for you!"}
                </p>
                <Button
                  size="lg"
                  className="bg-surface text-brand-purple-ink hover:bg-brand-purple-wash rounded-brand px-10 py-8 text-2xl font-black shadow-brand-lg flex items-center gap-4 transition-all hover:scale-110 active:scale-95 h-20"
                  onClick={() => {
                    playSound('celebration');
                    startDailySession();
                  }}
                >
                  <Sparkles className="size-8 text-brand-yellow-ink group-hover:rotate-12 transition-transform" />
                  {language === 'ar' ? 'ابدأ مغامرة اليوم' : 'Start Daily Adventure'}
                </Button>
              </div>
              <div className="hidden md:flex justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[15rem] filter drop-shadow-brand-lg"
                >
                  🧸
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sectioned Content */}
        {categories.map((category, catIdx) => (
          <section key={category.id} className="space-y-8 pb-10">
            <div className="flex items-center gap-4 px-2">
              <div className={`size-16 rounded-brand bg-surface-sunk ${category.color} flex items-center justify-center text-4xl shadow-brand border-2 border-hairline`}>
                {category.icon}
              </div>
              <h2 className="t-title text-ink tracking-tight">
 {category.name}
 </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {levels.filter(l => l.category === category.id).map((level, idx) => (
                <motion.div
                  key={level.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <button
                    onClick={() => handleLevelClick(level)}
                    disabled={level.locked}
                    className={`
                                    w-full group relative
                                    ${level.locked ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95'}
                                `}
                  >
                    <Card className={`
                                    p-8 rounded-brand-xl border-2 border-hairline shadow-brand-lg flex flex-col items-center text-center overflow-hidden transition-all duration-200
                                    bg-surface hover:shadow-brand-lg hover:-translate-y-2 active:scale-95
                                    relative
                                `}>
                      {/* Gradient Background Hint */}
                      <div className={`absolute top-0 inset-x-0 h-4 bg-surface-sunk ${level.color} opacity-80`} />

                      <div className="size-28 rounded-brand bg-surface-sunk mb-6 flex items-center justify-center text-7xl relative group-hover:scale-110 transition-transform">
                        {level.icon}
                        {level.locked && <Lock className="absolute -top-2 -right-2 size-8 text-brand-coral-ink fill-white" />}
                      </div>

                      <h3 className="text-2xl font-black text-ink mb-2">{level.name}</h3>

                      <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-surface-sunk text-ink-muted font-black text-sm uppercase tracking-widest border border-hairline-soft">
                        <Sparkles className="size-4" />
                        {level.progress > 0
                          ? (language === 'ar' ? 'أكمل' : 'Continue')
                          : (language === 'ar' ? 'ابدأ' : 'Start')
                        }
                        <ChevronRight className={`size-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                      </div>
                    </Card>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
