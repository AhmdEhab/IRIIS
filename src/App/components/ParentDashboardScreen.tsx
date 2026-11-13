import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Clock, Brain, Heart, Book, Users, Activity, Settings, Sparkles, MessageSquare } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ParentChatModal } from './ParentChatModal';
import { BackButton } from './ui/BackButton';

export function ParentDashboardScreen() {
  const {
    navigateTo, childProfile, assessmentResult,
    moduleProgress, activities, getAiRecommendations,
    irisProfile, reconstructIrisProfile
  } = useApp();
  const { playSound } = useAudio();
  const { t, language } = useLanguage();
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [aiRecs, setAiRecs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      if (!irisProfile) {
        if (isMounted) {
          setLoading(false);
          setAiRecs([]);
        }
        return;
      }

      setLoading(true);
      try {
        const recs = await getAiRecommendations();
        if (isMounted) {
          setAiRecs(recs || []);
        }
      } catch (err) {
        console.error("IRIS Dashboard fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRecs();
    return () => { isMounted = false; };
  }, [getAiRecommendations, irisProfile]);

  const handleManualSync = async () => {
    playSound('tap');
    setLoading(true);

    if (!irisProfile && childProfile && assessmentResult) {
      await reconstructIrisProfile();
    }

    const recs = await getAiRecommendations();
    setAiRecs(recs || []);
    setLoading(false);
  };

  const handleBack = () => {
    playSound('tap');
    navigateTo('mode-selection');
  };

  const handleGuidance = () => {
    playSound('tap');
    navigateTo('family-guidance');
  };

  const handleCommunity = () => {
    playSound('tap');
    navigateTo('community-sessions');
  };

  const handleSettings = () => {
    playSound('tap');
    navigateTo('parent-settings');
  };

  // Calculate real time data for the last 7 days
  const timeData = (() => {
    const data = [];
    const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = language === 'ar' ? daysAr[d.getDay()] : daysEn[d.getDay()];
      data.push({
        day: dayName,
        minutes: childProfile?.dailyTimeSpent?.[dateStr] || 0
      });
    }
    return data;
  })();

  const skills = [
    { name: t.letters, progress: moduleProgress['letters'] || 0, color: 'bg-brand-blue' },
    { name: t.numbers, progress: moduleProgress['numbers'] || 0, color: 'bg-brand-purple' },
    { name: t.animals, progress: moduleProgress['animals'] || 0, color: 'bg-brand-green' },
    { name: t.colors, progress: moduleProgress['colors'] || 0, color: 'bg-brand-yellow' },
    { name: t.lifeSkills, progress: moduleProgress['life-skills'] || 0, color: 'bg-brand-coral' },
    { name: t.fruits, progress: moduleProgress['fruits'] || 0, color: 'bg-brand-green' },
    { name: t.vehicles, progress: moduleProgress['vehicles'] || 0, color: 'bg-brand-blue' },
    { name: t.shapes, progress: moduleProgress['shapes'] || 0, color: 'bg-brand-yellow' },
    { name: t.gamesHub, progress: moduleProgress['games-hub'] || 0, color: 'bg-brand-purple' },
  ];

  // Calculate real emotional trends from activities
  const emotions = (() => {
    const emotionActivities = activities.filter(a => a.type === 'emotion');
    if (emotionActivities.length === 0) {
      return [
        { emoji: '😊', label: language === 'ar' ? 'سعيد' : 'Happy', percentage: 0 },
        { emoji: '😐', label: language === 'ar' ? 'محايد' : 'Neutral', percentage: 0 },
        { emoji: '😢', label: language === 'ar' ? 'حزين' : 'Sad', percentage: 0 }
      ];
    }

    const counts: Record<string, number> = {
      'happy': 0, 'neutral': 0, 'sad': 0, 'excited': 0, 'surprised': 0, 'calm': 0
    };

    emotionActivities.forEach(a => {
      if (a.taskEn.includes('Happy')) counts['happy']++;
      else if (a.taskEn.includes('Sad')) counts['sad']++;
      else if (a.taskEn.includes('Excited')) counts['excited']++;
      else if (a.taskEn.includes('Surprised')) counts['surprised']++;
      else if (a.taskEn.includes('Calm')) counts['calm']++;
      else counts['neutral']++;
    });

    const total = emotionActivities.length;
    return [
      { emoji: '😊', label: language === 'ar' ? 'سعيد' : 'Happy', percentage: Math.round(((counts['happy'] + counts['excited'] + counts['calm']) / total) * 100) },
      { emoji: '😐', label: language === 'ar' ? 'محايد' : 'Neutral', percentage: Math.round(((counts['neutral'] + counts['surprised']) / total) * 100) },
      { emoji: '😢', label: language === 'ar' ? 'حزين' : 'Sad', percentage: Math.round((counts['sad'] / total) * 100) }
    ];
  })();

  return (
    <div className="min-h-screen bg-brand-blue-wash via-white p-4">
      <BackButton onClick={handleBack} />
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="w-24" /> {/* Spacer */}

          <div className="flex items-center gap-4">
            <h1 className="t-title text-ink">{t.dashboard}</h1>
            <Button onClick={handleSettings} variant="ghost" size="icon" className="rounded-full hover:bg-surface/50">
              <Settings className="size-6 text-ink-muted" />
            </Button>
          </div>

          <Button onClick={handleGuidance} size="lg" className="bg-brand-purple hover:bg-brand-purple">
            <Book className="size-5 me-2" />
            {t.familyGuidance}
          </Button>
        </div>

        {/* Child Info Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="p-6 mb-6 bg-brand-purple-wash text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">{childProfile?.name}</h2>
                <p className="text-xl opacity-90">
                  {language === 'ar' ? 'العمر' : 'Age'}: {childProfile?.age} {language === 'ar' ? 'سنوات' : 'years'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-6xl mb-2">🌟</div>
                <p className="text-2xl font-bold">
                  {language === 'ar' ? 'المستوى' : 'Level'} {assessmentResult?.level || 3}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Community Section */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
          <Card className="p-6 mb-6 bg-brand-blue-wash text-white cursor-pointer hover:shadow-brand-lg transition-all transform hover:scale-[1.02]" onClick={handleCommunity}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="size-10" />
                  <h2 className="text-3xl font-bold">{language === 'ar' ? 'معًا لنطمئن 💜' : 'Together We Feel Reassured 💜'}</h2>
                </div>
                <p className="text-lg opacity-95 mb-3">
                  {language === 'ar' ? 'انضم لمجتمع الأهل الداعم - شارك تجاربك واحجز جلسات مع أفضل المتخصصين' : 'Join our supportive parent community - Share experiences and book sessions with top specialists'}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="bg-surface/20 px-3 py-1 rounded-full">👥 {language === 'ar' ? 'مجتمع الأهل' : 'Parent Community'}</span>
                  <span className="bg-surface/20 px-3 py-1 rounded-full">👨‍⚕️ {language === 'ar' ? 'متخصصون' : 'Specialists'}</span>
                  <span className="bg-surface/20 px-3 py-1 rounded-full">📅 {language === 'ar' ? 'حجز جلسات' : 'Book Sessions'}</span>
                </div>
              </div>
              <div className="text-8xl animate-pulse">💜</div>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Time Spent */}
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="size-8 text-brand-blue-ink" />
                <h3 className="text-2xl font-bold">{t.timeSpent}</h3>
              </div>
              <div className="space-y-4">
                {timeData.map((day, index) => (
                  <div key={day.day} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{day.day}</span>
                      <span className="font-semibold">{day.minutes} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    </div>
                    <div className="bg-surface-sunk rounded-full h-2 overflow-hidden">
                      <motion.div className="bg-brand-blue h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(day.minutes / 70) * 100}%` }} transition={{ delay: 0.5 + index * 0.1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Skills Progress */}
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="size-8 text-brand-purple-ink" />
                <h3 className="text-2xl font-bold">{t.skillsProgress}</h3>
              </div>
              <div className="space-y-6">
                {skills.map((skill, index) => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{skill.name}</span>
                      <span className="font-bold">{skill.progress}%</span>
                    </div>
                    <div className="bg-surface-sunk rounded-full h-3 overflow-hidden">
                      <motion.div className={`${skill.color} h-full rounded-full`} initial={{ width: 0 }} animate={{ width: `${skill.progress}%` }} transition={{ delay: 0.8 + index * 0.1, duration: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Emotional Trends */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="size-8 text-brand-coral-ink" />
                <h3 className="text-2xl font-bold">{t.emotionalTrends}</h3>
              </div>
              <div className="space-y-4">
                {emotions.map((emotion) => (
                  <div key={emotion.label} className="flex items-center gap-4">
                    <span className="text-5xl">{emotion.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{emotion.label}</span>
                        <span className="font-bold">{emotion.percentage}%</span>
                      </div>
                      <div className="bg-surface-sunk rounded-full h-3 overflow-hidden">
                        <motion.div className="bg-brand-coral-wash h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${emotion.percentage}%` }} transition={{ delay: 1.5, duration: 1 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Summary */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="p-6 bg-brand-blue-wash">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="size-8 text-brand-blue-ink" />
                <h3 className="text-2xl font-bold">{t.aiSummary}</h3>
              </div>
              {!assessmentResult ? (
                <div className="text-center py-10 text-ink-muted italic">
                  {language === 'ar' ? 'يرجى إكمال التقييم أولاً' : 'Please complete the assessment first'}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-surface rounded-brand-sm p-4 shadow-brand-sm">
                    <h4 className="font-bold text-brand-green-ink mb-2">{language === 'ar' ? '✓ نقاط القوة' : '✓ Strengths'}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {assessmentResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-surface rounded-brand-sm p-4 shadow-brand-sm">
                    <h4 className="font-bold text-brand-yellow-ink mb-2">{language === 'ar' ? '→ مجالات التحسين' : '→ Areas to Improve'}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {assessmentResult.areasToImprove.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }} className="md:col-span-2">
            <Card className="p-8 border-2 border-brand-purple bg-surface overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-purple-wash p-2 rounded-brand-sm"><Sparkles className="size-8 text-brand-purple-ink" /></div>
                  <div>
                    <h3 className="text-2xl font-bold text-ink flex items-center gap-2">
                      {language === 'ar' ? 'المسار الذكي المقترح' : 'AI Suggested Smart Path'}
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`size-2 rounded-full ${irisProfile ? 'bg-brand-green' : 'bg-brand-yellow'}`} />
                    </h3>
                    <p className="text-ink-muted text-sm">{language === 'ar' ? 'توصيات مخصصة بناءً على مستوى طفلك' : 'Personalized recommendations based on your child\'s level'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleManualSync} disabled={loading} className="text-brand-purple-ink">
                  <Activity className={`size-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                  {language === 'ar' ? 'تحديث' : 'Sync AI'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-3 py-10 text-center text-ink-muted italic bg-surface-sunk rounded-brand">
                    {language === 'ar' ? 'جاري استخراج بيانات IRIS...' : 'Generating IRIS insights...'}
                  </div>
                ) : !irisProfile ? (
                  <div className="col-span-3 py-10 text-center space-y-4">
                    <p className="text-ink-muted">{language === 'ar' ? 'بانتظار تحليل البيانات.. اضغط تحديث' : 'Waiting for analysis.. Press Sync'}</p>
                    <Button onClick={handleManualSync} variant="outline" className="text-brand-purple-ink border-brand-purple">
                      {language === 'ar' ? 'تزامن الآن' : 'Sync Now'}
                    </Button>
                    <Button onClick={() => navigateTo('ai-assessment')} className="bg-brand-purple">
                      {language === 'ar' ? 'بدأ التقييم' : 'Start Assessment'}
                    </Button>
                  </div>
                ) : aiRecs.length === 0 ? (
                  <div className="col-span-3 py-10 text-center bg-surface-sunk rounded-brand">
                    <p className="text-ink-muted">{language === 'ar' ? 'لا توجد توصيات حالياً' : 'No recommendations available'}</p>
                    <Button onClick={handleManualSync} variant="ghost" className="mt-2 text-brand-purple-ink">Retry</Button>
                  </div>
                ) : (
                  aiRecs.slice(0, 3).map((rec) => (
                    <motion.div key={rec.id} whileHover={{ y: -5 }} className="bg-surface-sunk p-5 rounded-brand border border-hairline-soft flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="px-3 py-1 bg-surface rounded-full text-xs font-bold text-brand-purple-ink border border-brand-purple">{rec.type.toUpperCase()}</span>
                          <span className="text-ink-muted text-xs flex items-center gap-1"><Clock className="size-3" /> {rec.duration}m</span>
                        </div>
                        <h4 className="font-bold text-lg text-ink mb-2">{rec.title}</h4>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {rec.skills.slice(0, 2).map((skill: string) => (
                            <span key={skill} className="text-[10px] text-ink-muted bg-surface-sunk px-2 py-0.5 rounded-brand-sm">{skill}</span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" className="w-full text-xs py-1 h-8 rounded-brand-sm border-brand-purple text-brand-purple-ink">
                        {language === 'ar' ? 'عرض النشاط' : 'View Activity'}
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="md:col-span-2">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="size-8 text-brand-blue-ink" />
                <h3 className="text-2xl font-bold">{language === 'ar' ? 'آخر النشاطات' : 'Recent Activity'}</h3>
              </div>
              <div className="space-y-6">
                {activities.length === 0 ? (
                  <div className="text-center py-10 text-ink-muted">{language === 'ar' ? 'لا يوجد نشاط مؤخراً' : 'No recent activity'}</div>
                ) : (
                  activities.map((activity, i) => (
                    <div key={activity.id} className="flex gap-4 relative">
                      {i !== activities.length - 1 && <div className="absolute left-6 top-10 w-0.5 h-10 bg-surface-sunk" />}
                      <div className="size-12 rounded-full bg-brand-blue-wash flex items-center justify-center text-2xl z-10 shadow-brand-sm">{activity.icon}</div>
                      <div className="flex-1 pt-1">
                        <p className="text-lg font-bold text-ink">{language === 'ar' ? activity.taskAr : activity.taskEn}</p>
                        <p className="text-sm text-ink-muted">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="px-4 py-1 rounded-full text-xs font-black bg-brand-blue-wash text-brand-blue-ink self-start mt-2">{language === 'ar' ? 'تم' : 'Done'}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.button onClick={() => setIsChatOpen(true)} whileHover={{ scale: 1.1 }} className="fixed bottom-8 left-8 size-20 rounded-full bg-brand-blue-wash shadow-brand-lg flex flex-col items-center justify-center text-white z-[100]">
        <MessageSquare className="size-8" />
        <span className="text-[10px] font-bold mt-1">Chat</span>
      </motion.button>

      <ParentChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}