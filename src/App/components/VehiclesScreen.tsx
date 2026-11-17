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
            contextImage: '/photos/car.jpg'
        },
        {
            id: 'plane',
            nameAr: 'طائرة',
            nameEn: 'Airplane',
            emoji: '✈️',
            color: ' ',
            contextImage: '/photos/plane.jpg'
        },
        {
            id: 'train',
            nameAr: 'قطار',
            nameEn: 'Train',
            emoji: '🚂',
            color: ' ',
            contextImage: '/photos/train.jpg'
        },
        {
            id: 'ship',
            nameAr: 'سفينة',
            nameEn: 'Ship',
            emoji: '🚢',
            color: ' ',
            contextImage: '/photos/ship.jpg'
        },
        {
            id: 'bicycle',
            nameAr: 'دراجة',
            nameEn: 'Bicycle',
            emoji: '🚲',
            color: ' ',
            contextImage: '/photos/bicycle.jpg'
        },
        {
            id: 'rocket',
            nameAr: 'صاروخ',
            nameEn: 'Rocket',
            emoji: '🚀',
            color: ' ',
            contextImage: '/photos/rocket.jpg'
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
                                        <RealPhoto
                                            src={vehicle.contextImage}
                                            alt={language === 'ar' ? vehicle.nameAr : vehicle.nameEn}
                                            fallback={vehicle.emoji}
                                            className="h-28 w-28 md:h-32 md:w-32 rounded-brand-xl"
                                            wrapperClassName="group-hover:scale-110 transition-transform"
                                        />
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
