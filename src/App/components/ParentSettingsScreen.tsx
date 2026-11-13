import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Trash2, Globe, User, Shield, CheckCircle2, RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';

export function ParentSettingsScreen() {
    const { navigateTo, childProfile, setChildProfile, resetProgress, updateUser, motionPreference, setMotionPreference } = useApp();
    const { playSound, speak, volume, setVolume } = useAudio();
    const { t, language, setLanguage } = useLanguage();

    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const [formData, setFormData] = useState({
        name: childProfile?.name || '',
        age: childProfile?.age.toString() || '',
        motherName: childProfile?.motherName || '',
        fatherName: childProfile?.fatherName || '',
        email: childProfile?.email || '',
    });

    const handleBack = () => {
        playSound('tap');
        navigateTo('parent-dashboard');
    };

    const handleSave = async () => {
        if (!childProfile?.email) return;
        setIsSaving(true);
        playSound('tap');

        const success = await updateUser(childProfile.email, {
            name: formData.name,
            age: Number(formData.age),
            motherName: formData.motherName,
            fatherName: formData.fatherName,
        });

        if (success) {
            setIsSaving(false);
            playSound('success');
            speak(language === 'ar' ? 'تم حفظ التغييرات' : 'Settings saved successfully', language);
        } else {
            setIsSaving(false);
            playSound('error');
            speak(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings', language);
        }
    };

    const handleReset = () => {
        resetProgress();
        setShowConfirmReset(false);
        playSound('celebration');
        speak(language === 'ar' ? 'تم تصفير التقدم بنجاح' : 'Progress reset successfully', language);
    };

    return (
        <div className="min-h-screen bg-ground p-4">
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        size="lg"
                        className="h-14 px-6 rounded-full text-lg font-bold bg-surface border-2 border-hairline text-ink hover:bg-ground-tint shadow-brand"
                    >
                        <ArrowLeft className="size-5 me-2" />
                        {t.back}
                    </Button>

                    <h1 className="t-title text-ink">
 {t.settings} 
 </h1>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="lg"
                        className="h-14 px-6 rounded-full text-lg font-bold bg-brand-green-solid hover:bg-brand-green-solid text-surface shadow-brand"
                    >
                        {isSaving ? '...' : <Save className="size-5 me-2" />}
                        {t.save}
                    </Button>
                </div>

                <div className="grid gap-8">
                    {/* Section: Language */}
                    <Card className="p-6 bg-surface rounded-brand-lg shadow-brand border border-brand-blue/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="size-6 text-brand-blue-ink" />
                            <h2 className="t-heading text-ink">{language === 'ar' ? 'اللغة' : 'Language'}</h2>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => { setLanguage('ar'); playSound('tap'); }}
                                variant={language === 'ar' ? 'default' : 'outline'}
                                className="flex-1 h-16 text-xl font-bold rounded-full"
                            >
                                العربية 🇪🇬
                            </Button>
                            <Button
                                onClick={() => { setLanguage('en'); playSound('tap'); }}
                                variant={language === 'en' ? 'default' : 'outline'}
                                className="flex-1 h-16 text-xl font-bold rounded-full"
                            >
                                English 🇺🇸
                            </Button>
                        </div>
                    </Card>

                    {/* Section: Access & Comfort (parent-level, reversible,
                        never chosen from a diagnosis — it is the parent's view
                        of what helps their child; locks override the automatic
                        performance loop in AppContext). */}
                    <Card className="p-6 bg-surface rounded-brand-lg shadow-brand border border-brand-blue/10">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="size-6 text-brand-blue-ink" />
                            <h2 className="t-heading text-ink">{language === 'ar' ? 'الراحة والحساسية' : 'Comfort & Sensory'}</h2>
                        </div>
                        <p className="text-sm text-ink-muted mb-6">
                            {language === 'ar'
                                ? 'بتتحكم في الحركة والصوت في التطبيق كله. اختيارك هنا بيلغي أي تعديل تلقائي.'
                                : 'Controls motion and sound across the app. Your choice here overrides any automatic adjustment.'}
                        </p>
                        <Label className="block mb-3 text-lg font-bold">{language === 'ar' ? 'مستوى الحركة' : 'Animation level'}</Label>
                        <div className="flex gap-3 mb-6">
                            {([
                                ['auto', language === 'ar' ? 'تلقائي' : 'Automatic'],
                                ['calm', language === 'ar' ? 'هادئ' : 'Calm'],
                                ['lively', language === 'ar' ? 'نشط' : 'Lively'],
                            ] as const).map(([val, label]) => (
                                <Button
                                    key={val}
                                    onClick={() => { setMotionPreference(val); playSound('tap'); }}
                                    variant={motionPreference === val ? 'default' : 'outline'}
                                    className="flex-1 h-14 text-lg font-bold rounded-full"
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <Label className="block mb-2 text-lg font-bold">{language === 'ar' ? `مستوى الصوت (${Math.round(volume * 100)}%)` : `Sound volume (${Math.round(volume * 100)}%)`}</Label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(volume * 100)}
                            onChange={(e) => setVolume(Number(e.target.value) / 100)}
                            className="w-full h-3 accent-brand-blue cursor-pointer"
                            aria-label={language === 'ar' ? 'مستوى الصوت' : 'Sound volume'}
                        />
                        <p className="text-xs text-ink-muted mt-3">
                            {language === 'ar'
                                ? '"تلقائي" يعني التطبيق بيبصّ على علامات الإرهاق (إعادة نفس النشاط كتير) ويهدّى الحركة لوحده.'
                                : '"Automatic" means the app watches for fatigue signs (repeating the same activity a lot) and calms animation on its own.'}
                        </p>
                    </Card>

                    {/* Section: Profile */}
                    <Card className="p-6 bg-surface rounded-brand-lg shadow-brand border border-brand-blue/10">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="size-6 text-brand-purple-ink" />
                            <h2 className="t-heading text-ink">{t.childInfo}</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>{t.childName}</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5 bg-surface-sunk"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.age}</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5 bg-surface-sunk"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.motherName}</Label>
                                <Input
                                    value={formData.motherName}
                                    onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                                    className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5 bg-surface-sunk"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.fatherName}</Label>
                                <Input
                                    value={formData.fatherName}
                                    onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                                    className="h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5 bg-surface-sunk"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Section: Security & Danger Zone */}
                    <Card className="p-6 rounded-brand-lg shadow-brand border-2 border-brand-coral bg-brand-coral-wash/30">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="size-6 text-brand-coral-ink" />
                            <h2 className="t-heading text-brand-coral-ink">
 {language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
 </h2>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-surface rounded-brand border border-brand-coral shadow-brand-sm">
                            <div>
                                <h3 className="font-bold text-lg text-brand-coral-ink">
                                    {language === 'ar' ? 'تصفير التقدم' : 'Reset Progress'}
                                </h3>
                                <p className="text-brand-coral-ink text-sm">
                                    {language === 'ar' ? 'سيتم مسح جميع الإنجازات والتقدم وبدء التعلم من جديد' : 'Clear all achievements and start learning from scratch'}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                className="h-14 px-6 rounded-full text-lg font-bold"
                                onClick={() => setShowConfirmReset(true)}
                            >
                                <RotateCcw className="size-4 me-2" />
                                {language === 'ar' ? 'تصفير' : 'Reset'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showConfirmReset && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-surface rounded-brand-lg p-8 max-w-sm w-full text-center shadow-brand-lg"
                    >
                        <div className="size-20 bg-brand-coral-wash text-brand-coral-ink rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="size-10" />
                        </div>
                        <h2 className="t-heading text-ink mb-4">
 {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
 </h2>
                        <p className="text-ink-muted mb-8">
                            {language === 'ar'
                                ? 'لا يمكن التراجع عن هذه الخطوة بعد تصفير التقدم.'
                                : 'This action cannot be undone. All progress will be lost.'}
                        </p>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                className="flex-1 h-14 rounded-full font-bold"
                                onClick={() => setShowConfirmReset(false)}
                            >
                                {t.cancel}
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1 h-14 rounded-full font-bold"
                                onClick={handleReset}
                            >
                                {language === 'ar' ? 'نعم، تصفير' : 'Yes, Reset'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
