import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Trash2, RotateCcw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandIcon } from './iris/ui/brand';
import { Blob, Sparkle } from './landing/LandingDecor';
import './landing-child.css';
import './parent-dashboard-landing.css';

/**
 * Parent settings — language, sensory comfort, child profile and data
 * management.
 *
 * Re-skinned in the landing / parent-home language: cream polka-dot ground,
 * glass header with the back control as the blue pill, white plates per
 * settings group, ghost pills that turn blue-filled when selected, and
 * rounded cream fields. State, persistence, sounds and navigation are
 * exactly as they were — styling only.
 */
export function ParentSettingsScreen() {
    const { navigateTo, childProfile, setChildProfile, resetProgress, updateUser, motionPreference, setMotionPreference } = useApp();
    const { playSound, speak, volume, setVolume } = useAudio();
    const { t, language, setLanguage } = useLanguage();

    const [isSaving, setIsSaving] = useState(false);
    /* cv2: display preference lives HERE (settings), not in the child's
     * Family File — stored apart from any assessment and changeable anytime. */
    const [displayPref, setDisplayPref] = useState<string>(() => {
        try { return localStorage.getItem('iris_display_pref') || 'both'; } catch { return 'both'; }
    });
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
        navigateTo('iris-parent');
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

    const ar = language === 'ar';

    return (
        <div className="lc-root pd-scope" dir={ar ? 'rtl' : 'ltr'}>
            <div className="lc-decor" aria-hidden="true">
                <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
                <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
                <Sparkle className="lc-spark lc-spark--1" />
                <Sparkle className="lc-spark lc-spark--2" />
                <Sparkle className="lc-spark lc-spark--3" />
            </div>

            <header className="lc-header">
                <div className="lc-header-inner">
                    <button type="button" className="lc-pill lc-pill--blue" onClick={handleBack}>
                        <ArrowLeft aria-hidden="true" style={{ transform: ar ? 'scaleX(-1)' : undefined }} />
                        <span>{t.back}</span>
                    </button>
                    <div className="lc-header-side">
                        <button
                            type="button"
                            className="lc-pill lc-pill--blue lc-pill--primary pd-header-save"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? '...' : <Save aria-hidden="true" />}
                            <span>{t.save}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="lc-main">
                {/* Title plate — the same hero the parent hub uses */}
                <section className="lc-hero">
                    <div className="lc-hero-dots" aria-hidden="true" />
                    <div className="lc-hero-copy">
                        <h1 className="lc-hero-title">
                            <span className="lc-hero-mark">{t.settings}</span>
                        </h1>
                    </div>
                </section>

                {/* Section: Language */}
                <section className="lc-section">
                    <div className="lc-section-head">
                        <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
                            <BrandIcon name="letters" className="w-7 h-7" tone="transparent" />
                        </span>
                        <h2 className="lc-section-title">{language === 'ar' ? 'اللغة' : 'Language'}</h2>
                    </div>
                    <div className="pd-plate">
                        <div className="ps-seg">
                            <button
                                type="button"
                                onClick={() => { setLanguage('ar'); playSound('tap'); }}
                                className={`lc-pill ps-choice ${language === 'ar' ? 'lc-pill--blue' : 'lc-pill--ghost'}`}
                            >
                                العربية 🇪🇬
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLanguage('en'); playSound('tap'); }}
                                className={`lc-pill ps-choice ${language === 'en' ? 'lc-pill--blue' : 'lc-pill--ghost'}`}
                            >
                                English 🇺🇸
                            </button>
                        </div>
                    </div>
                </section>

                {/* Section: Access & Comfort (parent-level, reversible,
                    never chosen from a diagnosis — it is the parent's view
                    of what helps their child; locks override the automatic
                    performance loop in AppContext). */}
                <section className="lc-section">
                    <div className="lc-section-head">
                        <span className="lc-bubble lc-bubble--purple lc-bubble--head" aria-hidden="true">
                            <BrandIcon name="settings" className="w-7 h-7" tone="transparent" />
                        </span>
                        <h2 className="lc-section-title">{language === 'ar' ? 'الراحة والحساسية' : 'Comfort & Sensory'}</h2>
                    </div>
                    <div className="pd-plate">
                        <p className="pd-muted ps-plate-sub">
                            {language === 'ar'
                                ? 'بتتحكم في الحركة والصوت في التطبيق كله. اختيارك هنا بيلغي أي تعديل تلقائي.'
                                : 'Controls motion and sound across the app. Your choice here overrides any automatic adjustment.'}
                        </p>
                        <label className="ps-label">{language === 'ar' ? 'مستوى الحركة' : 'Animation level'}</label>
                        <div className="ps-seg ps-seg--tight">
                            {([
                                ['auto', language === 'ar' ? 'تلقائي' : 'Automatic'],
                                ['calm', language === 'ar' ? 'هادئ' : 'Calm'],
                                ['lively', language === 'ar' ? 'نشط' : 'Lively'],
                            ] as const).map(([val, label]) => (
                                <button
                                    type="button"
                                    key={val}
                                    onClick={() => { setMotionPreference(val); playSound('tap'); }}
                                    className={`lc-pill ps-choice ${motionPreference === val ? 'lc-pill--blue' : 'lc-pill--ghost'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <label className="ps-label">{language === 'ar' ? `مستوى الصوت (${Math.round(volume * 100)}%)` : `Sound volume (${Math.round(volume * 100)}%)`}</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(volume * 100)}
                            onChange={(e) => setVolume(Number(e.target.value) / 100)}
                            className="ps-range"
                            aria-label={language === 'ar' ? 'مستوى الصوت' : 'Sound volume'}
                        />
                        <p className="ps-note">
                            {language === 'ar'
                                ? '"تلقائي" يعني التطبيق بيبصّ على علامات الإرهاق (إعادة نفس النشاط كتير) ويهدّى الحركة لوحده.'
                                : '"Automatic" means the app watches for fatigue signs (repeating the same activity a lot) and calms animation on its own.'}
                        </p>
                    </div>
                </section>

                {/* Section: How IRIS shows things (cv2 — outside the child assessment) */}
                <section className="lc-section">
                    <div className="pd-plate">
                        <label className="ps-label">{language === 'ar' ? 'IRIS يعرض إزاي' : 'How IRIS shows things'}</label>
                        <div className="ps-seg ps-seg--tight">
                            {([
                                ['text', language === 'ar' ? 'مكتوب بس' : 'Text only'],
                                ['audio', language === 'ar' ? 'مسموع بس' : 'Audio only'],
                                ['both', language === 'ar' ? 'الاتنين مع بعض' : 'Both'],
                            ] as const).map(([val, label]) => (
                                <button
                                    type="button"
                                    key={val}
                                    onClick={() => {
                                        setDisplayPref(val);
                                        try { localStorage.setItem('iris_display_pref', val); } catch { /* silent */ }
                                        playSound('tap');
                                    }}
                                    className={`lc-pill ps-choice ${displayPref === val ? 'lc-pill--blue' : 'lc-pill--ghost'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <p className="ps-note">
                            {language === 'ar'
                                ? 'ده تفضيل للعرض بس — مابيأثرش على ملف العيلة ولا على أي حاجة اتسجلت عن الطفل، وممكن يتغيّر في أي وقت.'
                                : 'This is only how the app displays things — it never changes the family file or anything recorded about the child, and it can change anytime.'}
                        </p>
                    </div>
                </section>
                {/* Section: Profile */}
                <section className="lc-section">
                    <div className="lc-section-head">
                        <span className="lc-bubble lc-bubble--green lc-bubble--head" aria-hidden="true">
                            <BrandIcon name="child" className="w-7 h-7" tone="transparent" />
                        </span>
                        <h2 className="lc-section-title">{t.childInfo}</h2>
                    </div>
                    <div className="pd-plate">
                        <div className="ps-grid2">
                            <div className="ps-field">
                                <label className="ps-label">{t.childName}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="ps-input"
                                />
                            </div>
                            <div className="ps-field">
                                <label className="ps-label">{t.age}</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    className="ps-input"
                                />
                            </div>
                            <div className="ps-field">
                                <label className="ps-label">{t.motherName}</label>
                                <input
                                    type="text"
                                    value={formData.motherName}
                                    onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                                    className="ps-input"
                                />
                            </div>
                            <div className="ps-field">
                                <label className="ps-label">{t.fatherName}</label>
                                <input
                                    type="text"
                                    value={formData.fatherName}
                                    onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                                    className="ps-input"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Security & Danger Zone */}
                <section className="lc-section">
                    <div className="lc-section-head">
                        <span className="lc-bubble lc-bubble--coral lc-bubble--head" aria-hidden="true">
                            <BrandIcon name="alert" className="w-7 h-7" tone="transparent" />
                        </span>
                        <h2 className="lc-section-title">
                            {language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
                        </h2>
                    </div>
                    <div className="pd-plate">
                        <div className="ps-danger-row">
                            <div>
                                <h3 className="ps-danger-title">
                                    {language === 'ar' ? 'تصفير التقدم' : 'Reset Progress'}
                                </h3>
                                <p className="ps-danger-desc">
                                    {language === 'ar' ? 'سيتم مسح جميع الإنجازات والتقدم وبدء التعلم من جديد' : 'Clear all achievements and start learning from scratch'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="lc-pill lc-pill--ghost ps-pill-reset"
                                onClick={() => setShowConfirmReset(true)}
                            >
                                <RotateCcw aria-hidden="true" />
                                <span>{language === 'ar' ? 'تصفير' : 'Reset'}</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Reset Confirmation Modal */}
            {showConfirmReset && (
                <div className="ps-modal-backdrop">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="ps-modal"
                    >
                        <div className="ps-modal-icon">
                            <Trash2 aria-hidden="true" />
                        </div>
                        <h2 className="ps-modal-title">
                            {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
                        </h2>
                        <p className="pd-muted ps-modal-desc">
                            {language === 'ar'
                                ? 'لا يمكن التراجع عن هذه الخطوة بعد تصفير التقدم.'
                                : 'This action cannot be undone. All progress will be lost.'}
                        </p>
                        <div className="ps-modal-actions">
                            <button
                                type="button"
                                className="lc-pill lc-pill--ghost ps-modal-btn"
                                onClick={() => setShowConfirmReset(false)}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                className="lc-pill ps-pill-danger ps-modal-btn"
                                onClick={handleReset}
                            >
                                {language === 'ar' ? 'نعم، تصفير' : 'Yes, Reset'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
