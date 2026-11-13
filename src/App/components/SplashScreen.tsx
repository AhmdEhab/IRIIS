import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, User, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Blob } from './iris/ui/brand/Decor';

export function SplashScreen() {
  const { navigateTo } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language } = useLanguage();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
      playSound('welcome');
      speak(t.welcomeMessage, language);
    }, 1000);
    return () => clearTimeout(timer);
  }, [language, t.welcomeMessage]);

  const handleStart = (mode: 'login' | 'register') => {
    playSound('tap');
    navigateTo(mode === 'login' ? 'login' : 'registration');
  };

  return (
    /* The two blurred, perpetually rotating discs that used to sit behind this
       screen are gone. They were the app's largest continuous animation, they
       were brand colours at 10% (which reads grey on cream, the same trap
       documented in ScreenFrame), and the frame's own corner colour does the
       job without moving. */
    <div className="min-h-screen bg-ground flex items-center justify-center relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Blob color="var(--brand-blue-wash)" opacity={1} className="absolute -top-24 -start-24 w-80 h-80" />
        <Blob color="var(--brand-yellow)" opacity={0.3} className="absolute -bottom-24 -end-24 w-96 h-96" />
      </div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="flex flex-col items-center gap-8">

          {/* Logo Section */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="relative p-2"
          >
            <div className="absolute inset-0 bg-surface/40 blur-2xl rounded-full scale-110" />
            <motion.img
              src="/images/iris-logo.gif"
              alt="IRIS Logo"
              style={{ mixBlendMode: 'multiply' }}
              className="w-full max-w-[380px] h-auto rounded-brand-lg relative z-10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Content Card */}
          {showContent && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full"
            >
              <Card className="p-8 rounded-brand-xl shadow-brand-lg border-2 border-hairline bg-surface text-center space-y-8">
                <div className="space-y-3">
                  <h1 className="t-title text-ink">
 {t.welcomeMessage} <span className="inline-block motion-safe:animate-bounce motion-reduce:animate-none"></span>
 </h1>
                  <p className="text-xl md:text-2xl text-brand-purple-ink font-bold max-w-2xl mx-auto">
                    {language === 'ar'
                      ? 'رحلتك إلى عالم التعلم الممتع تبدأ الآن! ✨'
                      : 'Your journey to fun learning starts now! ✨'
                    }
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  {/* Login Action */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "tween", ease: "circOut", duration: 0.15 }}
                    onClick={() => handleStart('login')}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-brand-blue rounded-brand-lg translate-y-1.5 group-hover:translate-y-2.5 transition-all duration-150" />
                    <div className="relative bg-surface border-4 border-brand-blue rounded-brand-lg p-6 flex flex-col items-center gap-3 hover:bg-brand-blue-wash/50 transition-colors duration-150">
                      <div className="size-16 rounded-brand-sm bg-brand-blue-wash flex items-center justify-center text-brand-blue-ink">
                        <User className="size-8" />
                      </div>
                      <span className="text-2xl font-black text-brand-blue-ink">
                        {language === 'ar' ? 'دخول الأبطال' : 'Hero Login'}
                      </span>
                    </div>
                  </motion.button>

                  {/* Register Action */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "tween", ease: "circOut", duration: 0.15 }}
                    onClick={() => handleStart('register')}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-brand-purple rounded-brand-lg translate-y-1.5 group-hover:translate-y-2.5 transition-all duration-150" />
                    <div className="relative bg-surface border-4 border-brand-purple rounded-brand-lg p-6 flex flex-col items-center gap-3 hover:bg-brand-purple-wash/50 transition-colors duration-150">
                      <div className="size-16 rounded-brand-sm bg-brand-purple-wash flex items-center justify-center text-brand-purple-ink">
                        <UserPlus className="size-8" />
                      </div>
                      <span className="text-2xl font-black text-brand-purple-ink">
                        {language === 'ar' ? 'حساب جديد' : 'New Hero'}
                      </span>
                    </div>
                  </motion.button>
                </div>

                <div className="pt-2 flex justify-center items-center gap-3 text-ink-muted font-bold uppercase tracking-widest text-xs">
                  <Sparkles className="size-4" />
                  {language === 'ar' ? 'التعلم بكل حب' : 'Learning with Love'}
                  <Sparkles className="size-4" />
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}