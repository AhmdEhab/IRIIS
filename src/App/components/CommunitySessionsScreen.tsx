import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Video, Users, Heart, MessageCircle, Star } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { API_URL } from '../config';

// ... (Specialist interface and specialists array remain unchanged)

interface Specialist {
  id: number;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  image: string;
  rating: number;
  reviews: number;
  specialties: string[];
  specialtiesAr: string[];
  availability: string[];
}

const specialists: Specialist[] = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    nameAr: 'د. سارة أحمد',
    role: 'Child Psychologist',
    roleAr: 'أخصائية نفسية للأطفال',
    image: '👩‍⚕️',
    rating: 4.9,
    reviews: 127,
    specialties: ['Down Syndrome', 'Behavioral Therapy', 'Social Skills'],
    specialtiesAr: ['متلازمة داون', 'العلاج السلوكي', 'المهارات الاجتماعية'],
    availability: ['Mon 10:00 AM', 'Wed 2:00 PM', 'Fri 11:00 AM']
  },
  {
    id: 2,
    name: 'Dr. Mohamed Hassan',
    nameAr: 'د. محمد حسن',
    role: 'Speech Therapist',
    roleAr: 'أخصائي تخاطب',
    image: '👨‍⚕️',
    rating: 4.8,
    reviews: 95,
    specialties: ['Speech Development', 'Language Skills', 'Communication'],
    specialtiesAr: ['تطوير النطق', 'مهارات اللغة', 'التواصل'],
    availability: ['Tue 9:00 AM', 'Thu 3:00 PM', 'Sat 10:00 AM']
  },
  {
    id: 3,
    name: 'Dr. Layla Ibrahim',
    nameAr: 'د. ليلى إبراهيم',
    role: 'Occupational Therapist',
    roleAr: 'أخصائية علاج وظيفي',
    image: '👩‍⚕️',
    rating: 5.0,
    reviews: 143,
    specialties: ['Motor Skills', 'Daily Activities', 'Sensory Integration'],
    specialtiesAr: ['المهارات الحركية', 'الأنشطة اليومية', 'التكامل الحسي'],
    availability: ['Mon 1:00 PM', 'Wed 10:00 AM', 'Fri 2:00 PM']
  },
  {
    id: 4,
    name: 'Dr. Ahmed Khalil',
    nameAr: 'د. أحمد خليل',
    role: 'Autism Specialist',
    roleAr: 'أخصائي توحد',
    image: '👨‍⚕️',
    rating: 4.7,
    reviews: 88,
    specialties: ['ASD Assessment', 'Early Intervention', 'Parent Training'],
    specialtiesAr: ['تقييم التوحد', 'التدخل المبكر', 'تدريب الأهل'],
    availability: ['Tue 11:00 AM', 'Thu 1:00 PM', 'Sat 3:00 PM']
  }
];

interface CommunityPost {
  id: number;
  author: string;
  authorAr: string;
  time: string;
  content: string;
  contentAr: string;
  likes: number;
  comments: number;
  type: 'question' | 'story' | 'tip';
}

const communityPosts: CommunityPost[] = [
  {
    id: 1,
    author: 'Fatima M.',
    authorAr: 'فاطمة م.',
    time: '2h ago',
    content: 'My son just learned to tie his shoes! After 6 months of practice. Never give up! 💪',
    contentAr: 'ابني تعلم ربط حذائه! بعد 6 أشهر من التدريب. لا تستسلموا أبداً! 💪',
    likes: 45,
    comments: 12,
    type: 'story'
  },
  {
    id: 2,
    author: 'Ahmed K.',
    authorAr: 'أحمد ك.',
    time: '5h ago',
    content: 'Any tips for dealing with sensory overload in public places? Looking for advice.',
    contentAr: 'أي نصائح للتعامل مع الحمل الحسي في الأماكن العامة؟ أبحث عن نصائح.',
    likes: 23,
    comments: 18,
    type: 'question'
  },
  {
    id: 3,
    author: 'Maryam S.',
    authorAr: 'مريم س.',
    time: '1d ago',
    content: 'Visual schedules have been a game changer for our morning routine! Highly recommend.',
    contentAr: 'الجداول المرئية غيرت روتين الصباح تماماً! أنصح بها بشدة.',
    likes: 67,
    comments: 24,
    type: 'tip'
  }
];

export function CommunitySessionsScreen() {
  const { navigateTo, childProfile } = useApp();
  const { playSound, speak } = useAudio();
  const { t, language } = useLanguage();
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // State for booking form
  const [bookingTime, setBookingTime] = useState('');
  const [childName, setChildName] = useState(childProfile?.name || '');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleBack = () => {
    playSound('tap');
    navigateTo('parent-dashboard');
  };


  const handleBookSession = (specialist: Specialist) => {
    setSelectedSpecialist(specialist);
    setBookingTime(specialist.availability[0]); // Default to first slot
    setBookingOpen(true);
    playSound('tap');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSpecialist || !childProfile) return;

    setIsBooking(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId: selectedSpecialist.id,
          specialistName: selectedSpecialist.name,
          childName: childName,
          parentEmail: childProfile.email,
          date: new Date().toLocaleDateString(), // Simplification: assume today/soon
          time: bookingTime,
          notes: bookingNotes,
          status: 'pending'
        })
      });

      if (response.ok) {
        playSound('success');
        setBookingOpen(false);
        speak(language === 'ar'
          ? 'تم حجز الجلسة بنجاح! سنرسل لك التفاصيل قريباً.'
          : 'Session booked successfully! We will send you details soon.',
          language);
      } else {
        throw new Error('Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      playSound('error');
      alert('Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handlePublishPost = async () => {
    if (!newPostContent.trim() || !childProfile) return;

    setIsPosting(true);
    playSound('tap');

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: childProfile.name,
          authorEmail: childProfile.email,
          content: newPostContent,
          type: 'story' // Default for now
        }),
      });

      if (response.ok) {
        setNewPostContent('');
        fetchPosts();
        playSound('success');
        speak(language === 'ar' ? 'تم النشر بنجاح!' : 'Posted successfully!', language);
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'PUT',
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
        playSound('tap');
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue-wash via-white p-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleBack}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="size-5 me-2" />
            {t.back}
          </Button>

          <div className="flex-1 text-center">
            <h1 className="t-title text-brand-purple-ink mb-2">
 {language === 'ar' ? 'معًا لنطمئن 💜' : 'Together We Feel Reassured 💜'}
 </h1>
            <p className="text-lg text-ink-muted">
              {language === 'ar'
                ? 'مجتمع الأهل الداعم - شارك، تعلم، واحجز جلسات مع المتخصصين'
                : 'Supportive Parent Community - Share, Learn, and Book Sessions with Specialists'
              }
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Specialists */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Card className="p-6 bg-brand-purple-wash text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="size-8" />
                  <h2 className="text-3xl font-bold">
 {language === 'ar' ? 'احجز جلسة مع متخصص' : 'Book a Session with a Specialist'}
 </h2>
                </div>
                <p className="text-lg opacity-90">
                  {language === 'ar'
                    ? 'جلسات تفاعلية عبر الإنترنت مع أفضل الأخصائيين في مجالاتهم'
                    : 'Interactive online sessions with top specialists in their fields'
                  }
                </p>
              </Card>
            </motion.div>

            {/* Specialists Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {specialists.map((specialist, index) => (
                <motion.div
                  key={specialist.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-brand transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-6xl">{specialist.image}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-ink">
                          {language === 'ar' ? specialist.nameAr : specialist.name}
                        </h3>
                        <p className="text-brand-purple-ink font-medium">
                          {language === 'ar' ? specialist.roleAr : specialist.role}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="size-4 fill-brand-yellow text-brand-yellow-ink" />
                          <span className="font-semibold">{specialist.rating}</span>
                          <span className="text-sm text-ink-muted">
                            ({specialist.reviews} {language === 'ar' ? 'تقييم' : 'reviews'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-ink mb-2">
                          {language === 'ar' ? 'التخصصات:' : 'Specialties:'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(language === 'ar' ? specialist.specialtiesAr : specialist.specialties).map((spec, i) => (
                            <span key={i} className="text-xs bg-brand-purple-wash text-brand-purple-ink px-2 py-1 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-ink mb-2">
                          {language === 'ar' ? 'مواعيد متاحة:' : 'Available Times:'}
                        </p>
                        <div className="space-y-1">
                          {specialist.availability.slice(0, 2).map((time, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-ink-muted">
                              <Clock className="size-3" />
                              <span>{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleBookSession(specialist)}
                        className="w-full bg-brand-purple-ink text-white hover:brightness-110"
                      >
                        <Calendar className="size-4 me-2" />
                        {language === 'ar' ? 'احجز جلسة' : 'Book Session'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column - Community Feed */}
          <div className="space-y-6">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Card className="p-6 bg-brand-blue-wash text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="size-8" />
                  <h2 className="text-2xl font-bold">
 {language === 'ar' ? 'مجتمع الأهل' : 'Parent Community'}
 </h2>
                </div>
                <p className="opacity-90">
                  {language === 'ar'
                    ? 'شارك تجاربك واستفد من تجارب الآخرين'
                    : 'Share your experiences and learn from others'
                  }
                </p>
              </Card>
            </motion.div>

            {/* Community Posts */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingPosts ? (
                <div className="text-center py-10 text-ink-muted">
                  <div className="animate-spin size-8 border-4 border-brand-purple border-t-transparent rounded-full mx-auto mb-2" />
                  {language === 'ar' ? 'جاري تحميل المنشورات...' : 'Loading posts...'}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 text-ink-muted bg-surface rounded-brand border-2 border-dashed border-hairline-soft">
                  <MessageCircle className="size-12 mx-auto mb-2 opacity-20" />
                  <p>{language === 'ar' ? 'لا توجد منشورات بعد. كن أول من يشارك!' : 'No posts yet. Be the first to share!'}</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Card className="p-4 hover:shadow-brand transition-shadow">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="size-10 rounded-full bg-brand-purple-wash flex items-center justify-center text-white font-bold uppercase">
                            {post.authorName ? post.authorName[0] : 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink text-lg">
                                {post.authorName}
                              </span>
                              <span className="text-[10px] text-ink-muted font-medium px-2 py-0.5 bg-surface-sunk rounded-full">
                                {new Date(post.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-brand-sm ${post.type === 'question' ? 'bg-brand-blue-wash text-brand-blue-ink' :
                                post.type === 'story' ? 'bg-brand-green-wash text-brand-green-ink' :
                                  'bg-brand-yellow-wash text-brand-yellow-ink'
                                }`}>
                                {language === 'ar'
                                  ? (post.type === 'question' ? 'سؤال' : post.type === 'story' ? 'قصة نجاح' : 'نصيحة')
                                  : post.type
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-ink text-lg leading-relaxed mb-4 font-medium">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-6 pt-3 border-t border-hairline-soft text-ink-muted">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className="flex items-center gap-2 hover:text-brand-coral-ink transition-colors group"
                          >
                            <div className="p-2 rounded-full group-hover:bg-brand-coral-wash transition-colors">
                              <Heart className={`size-5 ${post.likes > 0 ? 'fill-brand-coral text-brand-coral-ink' : ''}`} />
                            </div>
                            <span className="font-bold">{post.likes}</span>
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Post Something */}
            <Card className="p-4">
              <Textarea
                placeholder={language === 'ar'
                  ? 'شارك تجربتك أو اطرح سؤالاً للمجتمع...'
                  : 'Share your experience or ask a question...'
                }
                className="mb-3"
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-ink-muted">
                  {language === 'ar' ? 'ينشر باسم: ' : 'Posting as: '}
                  <span className="font-bold">{childProfile?.name}</span>
                </div>
                <Button
                  onClick={handlePublishPost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="bg-brand-blue-wash"
                >
                  {isPosting ? '...' : (language === 'ar' ? 'نشر' : 'Post')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {language === 'ar' ? 'حجز جلسة' : 'Book a Session'}
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-muted">
              {language === 'ar' ? 'اختر موعدًا وقم بتعبئة المعلومات أدناه للحجز' : 'Select a time and fill in the details below to book'}
            </DialogDescription>
          </DialogHeader>
          {selectedSpecialist && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedSpecialist.image}</div>
                <div>
                  <h3 className="font-bold text-lg">
                    {language === 'ar' ? selectedSpecialist.nameAr : selectedSpecialist.name}
                  </h3>
                  <p className="text-brand-purple-ink">
                    {language === 'ar' ? selectedSpecialist.roleAr : selectedSpecialist.role}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'اختر الموعد' : 'Select Time'}
                  </label>
                  <select
                    className="w-full border rounded-brand-sm p-2"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  >
                    {selectedSpecialist.availability.map((time, i) => (
                      <option key={i} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'اسم الطفل' : 'Child Name'}
                  </label>
                  <Input
                    placeholder={language === 'ar' ? 'أدخل الاسم' : 'Enter name'}
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
                  </label>
                  <Textarea
                    placeholder={language === 'ar'
                      ? 'أي معلومات تود مشاركتها...'
                      : 'Any information you would like to share...'
                    }
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="w-full bg-brand-purple-ink text-white hover:brightness-110 text-lg py-6"
                >
                  {isBooking ? '...' : (language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}