import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SyndromeLearningCard } from './SyndromeLearningCard';
import { Button } from './ui/button';

/**
 * Demo Screen to showcase syndrome-specific teaching differences
 * This demonstrates the RADICALLY different approaches for each syndrome
 */
export function SyndromeTeachingDemoScreen() {
    const { navigateTo, childProfile } = useApp();
    const { language } = useLanguage();
    const [showDemo, setShowDemo] = useState(false);

    const demoAnimal = {
        mainVisual: '🦁',
        nameAr: 'أسد',
        nameEn: 'Lion',
        soundEffect: 'success',
    };

    const syndrome = childProfile?.syndrome || 'down-syndrome';

    const getSyndromeDescription = () => {
        switch (syndrome) {
            case 'down-syndrome':
                return {
                    titleAr: 'طريقة التعلم: البصر أولاً',
                    titleEn: 'Learning Method: Visual First',
                    descAr: '١. عرض الصورة بدون صوت (٣ ثواني)\n٢. ثم النطق مع الصورة\n٣. انتظار النقر للمتابعة\n٤. مكافأة بصرية',
                    descEn: '1. Show image silently (3 seconds)\n2. Then speak with image\n3. Wait for tap to continue\n4. Visual reward',
                    color: ' ',
                };
            case 'williams':
                return {
                    titleAr: 'طريقة التعلم: السمع والموسيقى أولاً',
                    titleEn: 'Learning Method: Auditory & Musical First',
                    descAr: '١. أغنية ترحيبية حماسية\n٢. سؤال اجتماعي\n٣. سماع الاسم أولاً\n٤. ثم رؤية الصورة\n٥. مدح لفظي حماسي',
                    descEn: '1. Enthusiastic welcome song\n2. Social question\n3. Hear name first\n4. Then see image\n5. Enthusiastic verbal praise',
                    color: ' ',
                };
            case 'fragile-x':
                return {
                    titleAr: 'طريقة التعلم: السياق الهادئ أولاً',
                    titleEn: 'Learning Method: Calm Context First',
                    descAr: '١. دعوة هادئة ومطمئنة\n٢. عرض المشهد الكامل (ضبابي)\n٣. تركيز بطيء على التفاصيل\n٤. وقت كافٍ للمعالجة\n٥. مكافأة هادئة',
                    descEn: '1. Calm, reassuring invitation\n2. Show whole scene (blurred)\n3. Slow focus on details\n4. Sufficient processing time\n5. Gentle reward',
                    color: ' ',
                };
            case 'autism':
                return {
                    titleAr: 'طريقة التعلم: منظم ومتوقع',
                    titleEn: 'Learning Method: Structured & Predictable',
                    descAr: '١. عرض الجدول البصري\n٢. صورة واضحة بدون تشتيت\n٣. معلومة واحدة فقط\n٤. خيارات واضحة\n٥. مكافأة متوقعة',
                    descEn: '1. Show visual schedule\n2. Clear image, no distractions\n3. One piece of information\n4. Clear choices\n5. Predictable reward',
                    color: ' ',
                };
            default:
                return {
                    titleAr: 'طريقة التعلم',
                    titleEn: 'Learning Method',
                    descAr: '',
                    descEn: '',
                    color: ' ',
                };
        }
    };

    const info = getSyndromeDescription();

    return (
        <div className="min-h-screen bg-brand-blue-wash via-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        onClick={() => navigateTo('child-mode')}
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                    >
                        <ArrowLeft className="size-6" />
                    </Button>
                    <h1 className="t-title text-ink">
 {language === 'ar' ? 'عرض توضيحي لطرق التدريس' : 'Teaching Methods Demo'}
 </h1>
                </div>

                {!showDemo ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Syndrome Info Card */}
                        <div className={`bg-surface-sunk ${info.color} rounded-brand-lg p-8 shadow-brand-lg border-2 border-hairline`}>
                            <h2 className="text-3xl font-bold text-white mb-4">
 {language === 'ar' ? info.titleAr : info.titleEn}
 </h2>
                            <div className="bg-surface rounded-brand p-6">
                                <pre className="text-xl text-white font-medium whitespace-pre-line leading-relaxed">
                                    {language === 'ar' ? info.descAr : info.descEn}
                                </pre>
                            </div>
                        </div>

                        {/* Scientific Basis */}
                        <div className="bg-surface rounded-brand-lg p-8 shadow-brand border-4 border-hairline-soft">
                            <h3 className="text-2xl font-bold text-ink mb-4">
                                {language === 'ar' ? '🔬 الأساس العلمي' : '🔬 Scientific Basis'}
                            </h3>
                            <div className="space-y-3 text-lg text-ink">
                                {syndrome === 'down-syndrome' && (
                                    <>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• قوة في التعلم البصري، ضعف في المعالجة السمعية'
                                                : '• Strong visual learning, weaker auditory processing'}
                                        </p>
                                        <p className="text-ink-muted">
                                            {language === 'ar'
                                                ? 'المرجع: Buckley & Bird (1993)'
                                                : 'Reference: Buckley & Bird (1993)'}
                                        </p>
                                    </>
                                )}
                                {syndrome === 'williams' && (
                                    <>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• قوة في المعالجة السمعية والمهارات اللفظية'
                                                : '• Strong auditory processing and verbal skills'}
                                        </p>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• تفاعل اجتماعي عالي وحب للموسيقى'
                                                : '• Hypersocial and musical ability'}
                                        </p>
                                        <p className="text-ink-muted">
                                            {language === 'ar'
                                                ? 'المرجع: Mervis & John (2010)'
                                                : 'Reference: Mervis & John (2010)'}
                                        </p>
                                    </>
                                )}
                                {syndrome === 'fragile-x' && (
                                    <>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• حساسية حسية عالية وقلق'
                                                : '• Sensory sensitivities and anxiety'}
                                        </p>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• حاجة للسياق الكامل قبل التفاصيل'
                                                : '• Need for whole context before details'}
                                        </p>
                                        <p className="text-ink-muted">
                                            {language === 'ar'
                                                ? 'المرجع: Cornish et al. (2004)'
                                                : 'Reference: Cornish et al. (2004)'}
                                        </p>
                                    </>
                                )}
                                {syndrome === 'autism' && (
                                    <>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• تفكير بصري قوي'
                                                : '• Strong visual thinking'}
                                        </p>
                                        <p className="font-semibold">
                                            {language === 'ar'
                                                ? '• حاجة للتنظيم والتوقع'
                                                : '• Need for structure and predictability'}
                                        </p>
                                        <p className="text-ink-muted">
                                            {language === 'ar'
                                                ? 'المرجع: Grandin (2006)'
                                                : 'Reference: Grandin (2006)'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Start Demo Button */}
                        <Button
                            onClick={() => setShowDemo(true)}
                            size="lg"
                            className="w-full py-8 text-3xl font-bold rounded-brand-lg bg-brand-green-solid hover:brightness-110 text-white shadow-brand-lg"
                        >
                            {language === 'ar' ? '🎯 ابدأ العرض التوضيحي' : '🎯 Start Demo'}
                        </Button>
                    </motion.div>
                ) : (
                    <div className="flex justify-center items-center min-h-[600px]">
                        <SyndromeLearningCard
                            {...demoAnimal}
                            itemId="demo-item"
                            language={language}
                            onComplete={() => {
                                setShowDemo(false);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
