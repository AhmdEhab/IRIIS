import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Sparkles, Brain, Settings } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function TransitionScreen() {
    const { transitionState, activeRules } = useApp();
    const { t, language } = useLanguage();

    /* Purely cosmetic branch (blue Brain vs purple Gear). IRIS never
       computes an IQ — the old variable name was flagged in the audit. */
    const isJourneyPrep = transitionState.message === t.preparingJourney;

    return createPortal((
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="flex flex-col items-center space-y-12 max-w-2xl text-center"
            >
                {/* Animated Icon Container */}
                <div className="relative">
                    {/* Background Glow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className={`absolute inset-0 rounded-full blur-3xl ${isJourneyPrep ? 'bg-brand-blue' : 'bg-brand-purple'}`}
                    />

                    {/* Main Icon */}
                    <motion.div
                        animate={{
                            rotate: isJourneyPrep ? [0, 360] : 0,
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: isJourneyPrep ? 3 : 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10 bg-surface p-12 rounded-brand-xl shadow-brand-lg border-2 border-hairline"
                    >
                        {isJourneyPrep ? (
                            <Brain className={`size-32 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-blue-ink'}`} />
                        ) : (
                            <Settings className={`size-32 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-purple-ink'} motion-safe:animate-spin-slow motion-reduce:animate-none`} />
                        )}
                    </motion.div>

                    {/* Floating Sparkles */}
                    <motion.div
                        animate={{
                            y: [-10, 10, -10],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.5
                        }}
                        className="absolute -top-4 -right-4"
                    >
                        <Sparkles className="size-12 text-brand-yellow-ink fill-brand-yellow drop-shadow-brand" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <div className="space-y-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`t-title text-4xl md:text-5xl font-black ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink' : 'text-ink'}`}
                    >
                        {transitionState.message}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`text-2xl font-bold ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-ink-muted'}`}
                    >
                        {t.pleaseWait}
                    </motion.p>
                </div>

                {/* Loading Bar */}
                <div className="w-full max-w-md h-4 bg-surface rounded-full overflow-hidden border border-hairline-soft">
                    {/* transform, not width: the old width animation
                        re-laid-out the bar every frame (audit perf). */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        style={{ transformOrigin: document.dir === 'rtl' ? 'right' : 'left' }}
                        transition={{
                            duration: transitionState.duration / 1000,
                            ease: "linear"
                        }}
                        className={`h-full rounded-full ${isJourneyPrep ? 'bg-brand-blue' : 'bg-brand-purple'}`}
                    />
                </div>
            </motion.div>
        </div>
    ), document.body);
}
