import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './ui/BackButton';
import { SyndromeLearningCard } from './SyndromeLearningCard';

interface Vehicle {
    id: string;
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    contextImage?: string;
}

export function VehiclesScreen() {
    const { navigateTo, incrementProgress, activeRules } = useApp();
    const { playSound, stopSpeaking } = useAudio();
    const { language } = useLanguage();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const vehicles: Vehicle[] = [
        {
            id: 'car',
            nameAr: 'سيارة',
            nameEn: 'Car',
            emoji: '🚗',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'plane',
            nameAr: 'طائرة',
            nameEn: 'Airplane',
            emoji: '✈️',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1436491865332-7a61a20fb2a5?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'train',
            nameAr: 'قطار',
            nameEn: 'Train',
            emoji: '🚂',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'ship',
            nameAr: 'سفينة',
            nameEn: 'Ship',
            emoji: '🚢',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1544654803-b69110bb8154?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'bicycle',
            nameAr: 'دراجة',
            nameEn: 'Bicycle',
            emoji: '🚲',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1000'
        },
        {
            id: 'rocket',
            nameAr: 'صاروخ',
            nameEn: 'Rocket',
            emoji: '🚀',
            color: ' ',
            contextImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1000'
        }
    ];

    const handleBack = () => {
        playSound('tap');
        stopSpeaking();
        if (selectedVehicleId) {
            setSelectedVehicleId(null);
        } else {
            navigateTo('child-mode');
        }
    };

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    const handleVehicleSelect = (vehicle: Vehicle) => {
        playSound('tap');
        setSelectedVehicleId(vehicle.id);
    };

    const handleLearningComplete = () => {
        incrementProgress('vehicles');
        setTimeout(() => setSelectedVehicleId(null), 1500);
    };

    return (
        <div className={`wld-landing cl-learn min-h-screen p-4 transition-colors duration-500 ${activeRules?.sensoryProfile === 'low-arousal' ? 'bg-surface-sunk' : 'bg-brand-blue-wash'}`}>
            <BackButton onClick={handleBack} />
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="w-24" />
                    <h1 className={`t-title text-5xl font-bold drop-shadow-brand text-center flex-1 ${activeRules?.sensoryProfile === 'low-arousal' ? 'text-ink-muted' : 'text-brand-blue-ink'}`}>
 {language === 'ar' ? 'وسائل المواصلات' : 'Vehicles'} 
 </h1>
                    <div className="w-24" />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedVehicleId ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8"
                        >
                            {vehicles.map((vehicle, index) => (
                                <motion.div
                                    key={vehicle.id}
                                    initial={{ scale: 0, rotate: index % 2 === 0 ? -5 : 5 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <button
                                        onClick={() => handleVehicleSelect(vehicle)}
                                        className={`w-full aspect-square rounded-brand-xl shadow-brand bg-surface-sunk ${activeRules?.sensoryProfile === 'low-arousal' ? ' ' : vehicle.color} flex flex-col items-center justify-center transition-all duration-300 hover:shadow-brand-lg border-2 border-hairline group`}
                                    >
                                        <div className="text-8xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
                                            {vehicle.emoji}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white drop-shadow-brand">
                                            {language === 'ar' ? vehicle.nameAr : vehicle.nameEn}
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
                            {selectedVehicle && (
                                <div className="space-y-8">
                                    <SyndromeLearningCard
                                        itemId={selectedVehicle.id}
                                        mainVisual={selectedVehicle.emoji}
                                        nameAr={selectedVehicle.nameAr}
                                        nameEn={selectedVehicle.nameEn}
                                        contextImage={selectedVehicle.contextImage}
                                        onComplete={handleLearningComplete}
                                        language={language}
                                    />

                                    <div className="flex justify-center">
                                        <Button
                                            onClick={() => setSelectedVehicleId(null)}
                                            variant="outline"
                                            size="lg"
                                            className="bg-surface text-2xl px-12 py-8 rounded-full shadow-brand border-2 border-hairline/50"
                                        >
                                            <RotateCcw className="size-8 me-3" aria-hidden="true" />
                                            {language === 'ar' ? 'اختيار وسيلة أخرى' : 'Choose another vehicle'}
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
