import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Heart, GraduationCap, Brain, Activity, Book, Volume2, MessageCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'health' | 'education' | 'psychology' | 'behavior';
}

export function FamilyGuidanceScreen() {
  const { navigateTo } = useApp();
  const { speak, playSound } = useAudio();
  const { t, language } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const articles: Article[] = [
    {
      id: 'health-1',
      title: language === 'ar' ? 'التغذية الصحية للأطفال' : 'Healthy Nutrition for Children',
      summary: language === 'ar'
        ? 'نصائح مهمة حول التغذية المتوازنة'
        : 'Important tips about balanced nutrition',
      content: language === 'ar'
        ? 'التغذية السليمة تلعب دوراً أساسياً في نمو الطفل وتطوره. احرصي على تقديم وجبات متنوعة تحتوي على الفواكه والخضروات والبروتينات. تجنبي السكريات الزائدة والأطعمة المصنعة.'
        : 'Proper nutrition plays a fundamental role in child growth and development. Make sure to provide varied meals containing fruits, vegetables, and proteins. Avoid excess sugars and processed foods.',
      category: 'health'
    },
    {
      id: 'health-2',
      title: language === 'ar' ? 'النوم الصحي' : 'Healthy Sleep',
      summary: language === 'ar'
        ? 'أهمية النوم المنتظم للأطفال'
        : 'Importance of regular sleep for children',
      content: language === 'ar'
        ? 'النوم الكافي ضروري لنمو الطفل الجسدي والعقلي. احرصي على روتين نوم منتظم، وتجنبي الشاشات قبل النوم بساعة. خلق بيئة هادئة ومريحة في غرفة النوم.'
        : 'Adequate sleep is essential for physical and mental child development. Maintain a regular sleep routine, avoid screens one hour before bed. Create a calm and comfortable bedroom environment.',
      category: 'health'
    },
    {
      id: 'education-1',
      title: language === 'ar' ? 'التعلم باللعب' : 'Learning Through Play',
      summary: language === 'ar'
        ? 'كيف تستخدمين اللعب كوسيلة تعليمية'
        : 'How to use play as an educational tool',
      content: language === 'ar'
        ? 'اللعب ليس مجرد ترفيه، بل هو وسيلة فعالة للتعلم. استخدمي الألعاب التعليمية، الألغاز، والأنشطة اليدوية لتطوير مهارات طفلك. شجعي التعلم التفاعلي والاستكشاف.'
        : "Play isn't just entertainment, it's an effective learning tool. Use educational games, puzzles, and hands-on activities to develop your child's skills. Encourage interactive learning and exploration.",
      category: 'education'
    },
    {
      id: 'education-2',
      title: language === 'ar' ? 'تطوير المهارات اللغوية' : 'Developing Language Skills',
      summary: language === 'ar'
        ? 'أساليب تحسين التواصل اللفظي'
        : 'Methods to improve verbal communication',
      content: language === 'ar'
        ? 'تحدثي مع طفلك بشكل مستمر، اقرئي له القصص، غني معه الأغاني. استخدمي جمل بسيطة وواضحة. امنحيه الوقت للاستجابة وشجعي محاولاته للتواصل.'
        : 'Talk to your child continuously, read stories, sing songs together. Use simple and clear sentences. Give time to respond and encourage communication attempts.',
      category: 'education'
    },
    {
      id: 'psychology-1',
      title: language === 'ar' ? 'بناء الثقة بالنفس' : 'Building Self-Confidence',
      summary: language === 'ar'
        ? 'كيف تعززين ثقة طفلك بنفسه'
        : 'How to boost your child\'s self-confidence',
      content: language === 'ar'
        ? 'امدحي جهود طفلك وليس فقط النتائج. شجعيه على تجربة أشياء جديدة. احتفلي بالإنجازات الصغيرة. تجنبي المقارنات مع الآخرين وركزي على تقدمه الشخصي.'
        : "Praise your child's efforts, not just results. Encourage trying new things. Celebrate small achievements. Avoid comparisons with others and focus on personal progress.",
      category: 'psychology'
    },
    {
      id: 'psychology-2',
      title: language === 'ar' ? 'التعامل مع القلق' : 'Dealing with Anxiety',
      summary: language === 'ar'
        ? 'مساعدة طفلك على إدارة مشاعره'
        : 'Helping your child manage emotions',
      content: language === 'ar'
        ? 'علمي طفلك تقنيات التنفس العميق. كوني مستمعة جيدة لمخاوفه. ساعديه على التعبير عن مشاعره بطرق صحية. خلقي روتيناً يومياً مستقراً يشعره بالأمان.'
        : 'Teach your child deep breathing techniques. Be a good listener to their fears. Help express emotions in healthy ways. Create a stable daily routine for security.',
      category: 'psychology'
    },
    {
      id: 'behavior-1',
      title: language === 'ar' ? 'التعزيز الإيجابي' : 'Positive Reinforcement',
      summary: language === 'ar'
        ? 'استخدام المكافآت لتشجيع السلوك الجيد'
        : 'Using rewards to encourage good behavior',
      content: language === 'ar'
        ? 'استخدمي نظام المكافآت لتعزيز السلوك الإيجابي. يمكن أن تكون المكافآت معنوية (مدح، احتضان) أو مادية بسيطة. كوني متسقة في تطبيق القواعد والمكافآت.'
        : 'Use a reward system to reinforce positive behavior. Rewards can be emotional (praise, hugs) or simple material. Be consistent in applying rules and rewards.',
      category: 'behavior'
    },
    {
      id: 'behavior-2',
      title: language === 'ar' ? 'إدارة نوبات الغضب' : 'Managing Tantrums',
      summary: language === 'ar'
        ? 'كيفية التعامل مع نوبات الغضب بهدوء'
        : 'How to deal with tantrums calmly',
      content: language === 'ar'
        ? 'ابقي هادئة أثناء نوبة الغضب. تجنبي الصراخ أو العقاب. امنحي طفلك مساحة آمنة لتهدئة نفسه. بعد الهدوء، تحدثي معه عن مشاعره وعلميه طرقاً أفضل للتعبير.'
        : 'Stay calm during tantrums. Avoid yelling or punishment. Give your child a safe space to calm down. After calming, talk about feelings and teach better ways to express.',
      category: 'behavior'
    }
  ];

  const handleBack = () => {
    playSound('tap');
    navigateTo('parent-dashboard');
  };

  const handleArticleClick = (article: Article) => {
    playSound('tap');
    speak(article.title, language);
    setSelectedArticle(article.id);
  };

  const handleReadAloud = (article: Article) => {
    playSound('success');
    speak(article.content, language);
  };

  const categories = [
    { id: 'health', name: t.health, icon: Heart, color: 'text-brand-coral-ink' },
    { id: 'education', name: t.education, icon: GraduationCap, color: 'text-brand-blue-ink' },
    { id: 'psychology', name: t.psychology, icon: Brain, color: 'text-brand-purple-ink' },
    { id: 'behavior', name: t.behavior, icon: Activity, color: 'text-brand-green-ink' }
  ];

  if (selectedArticle) {
    const article = articles.find(a => a.id === selectedArticle);
    if (!article) return null;

    const categoryInfo = categories.find(c => c.id === article.category);
    const Icon = categoryInfo?.icon || Book;

    return (
      <div className="min-h-screen bg-ground p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Button
            onClick={() => {
              playSound('tap');
              setSelectedArticle(null);
            }}
            variant="outline"
            size="lg"
            className="mb-6 h-14 px-6 rounded-full text-lg font-bold bg-surface border-2 border-hairline text-ink hover:bg-ground-tint shadow-brand"
          >
            <ArrowLeft className="size-5 me-2" />
            {t.back}
          </Button>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="p-8 bg-surface rounded-brand-lg shadow-brand border border-brand-blue/10">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-4 rounded-full bg-brand-purple-wash`}>
                  <Icon className={`size-8 ${categoryInfo?.color}`} />
                </div>
                <div className="flex-1">
                  <h1 className="t-title text-ink mb-2">{article.title}</h1>
                  <p className="text-ink-muted">{article.summary}</p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-6">
                <p className="text-xl leading-relaxed">{article.content}</p>
              </div>

              <Button
                onClick={() => handleReadAloud(article)}
                size="lg"
                className="w-full h-14 rounded-full text-xl font-bold bg-brand-purple hover:bg-brand-purple text-surface shadow-brand"
              >
                <Volume2 className="size-6 me-2" />
                {language === 'ar' ? 'استماع للمقال' : 'Listen to Article'}
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground p-4">
      <div className="max-w-7xl mx-auto py-8">
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
 {t.familyGuidance}
 </h1>

          <div className="w-24" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 rounded-brand-lg">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="text-lg py-4">
                  <Icon className={`size-5 me-2 ${category.color}`} />
                  {category.name}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="chat" className="text-lg py-4">
              <MessageCircle className="size-5 me-2 text-brand-coral-ink" />
              {language === 'ar' ? 'المساعد الذكي' : 'Assistant'}
            </TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid md:grid-cols-2 gap-6">
                {articles
                  .filter(article => article.category === category.id)
                  .map((article, index) => {
                    const Icon = category.icon;
                    return (
                      <motion.div
                        key={article.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className="p-6 bg-surface rounded-brand-lg shadow-brand-sm border border-brand-blue/10 hover:shadow-brand transition-shadow cursor-pointer h-full"
                          onClick={() => handleArticleClick(article)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-brand-purple-wash">
                              <Icon className={`size-6 ${category.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="t-heading text-ink mb-2">{article.title}</h3>
                              <p className="text-ink-muted text-sm">{article.summary}</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="chat">
            <Card className="p-6 h-[600px] flex flex-col bg-surface rounded-brand-lg shadow-brand border border-brand-blue/10">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="p-3 rounded-full bg-brand-purple-wash">
                  <MessageCircle className="size-6 text-brand-purple-ink" />
                </div>
                <div>
                  <h2 className="t-heading text-ink">
 {language === 'ar' ? 'المساعد الذكي للأهل' : 'AI Parent Assistant'}
 </h2>
                  <p className="text-sm text-ink-muted">
                    {language === 'ar' ? 'اسأل عن أي شيء يخص طفلك' : 'Ask anything about your child'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                <div className="flex justify-start">
                  <div className="bg-surface-sunk rounded-brand p-4 max-w-[80%]">
                    <p className="text-ink">
                      {language === 'ar'
                        ? 'مرحباً! أنا هنا لمساعدتك في رحلة تربية طفلك. يمكنك سؤالي عن نصائح، أنشطة، أو كيفية التعامل مع مواقف معينة.'
                        : 'Hello! I am here to help you on your parenting journey. You can ask me for tips, activities, or how to handle specific situations.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
                  className="flex-1 h-14 rounded-brand border-2 border-brand-blue/20 focus:border-brand-blue text-lg px-5"
                />
                <Button className="h-14 rounded-full px-6 font-bold bg-brand-purple hover:bg-brand-purple text-surface">
                  {language === 'ar' ? 'إرسال' : 'Send'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
