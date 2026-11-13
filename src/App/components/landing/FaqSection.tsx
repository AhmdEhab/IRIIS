import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * FaqSection — six honest answers built from what the product actually does.
 * No invented policies, no unsupported promises. Accordion height animation
 * collapses to none when the user asks for reduced motion.
 */

const QUESTIONS = [
  {
    q: { ar: 'هل IRIS أداة تشخيص؟', en: 'Is IRIS a diagnostic tool?' },
    a: {
      ar: 'لأ — IRIS منصة تعلّم مساعد بتعرّف على مستوى مهارات الطفل وبتبني له أنشطة على مقاسه. التشخيص الطبي بيفضل شغل المختصين دايماً، وIRIS بتشجع الأهل إنهم يسألوا المختص في الأسئلة الطبية.',
      en: 'No. IRIS is a supportive learning platform that discovers a child’s skill level and builds activities around it. Medical diagnosis always belongs to specialists, and IRIS encourages families to take medical questions to them.',
    },
  },
  {
    q: { ar: 'محتاجين تقرير طبي عشان نبدأ؟', en: 'Do we need a medical report to start?' },
    a: {
      ar: 'مش محتاجين أي تقرير. الأهل يعملوا حساب، يدخلوا بيانات بسيطة عن الطفل، وتبدأ أول جلسة — وهي أنشطة لعب قصيرة مش امتحان.',
      en: 'No report needed. Parents create an account, share a few simple details about their child, and the first session begins — short playful activities, not an exam.',
    },
  },
  {
    q: { ar: 'إيه اللي بيحصل في أول جلسة؟', en: 'What happens in the first session?' },
    a: {
      ar: 'جلسة تعريفية على شكل "سلّم": أسئلة قصيرة وألعاب صغيرة بتبدأ سهلة وتبقي أصعب شوية حسب إجابات الطفل. في آخرها IRIS بتلاقي مستوى مبدئي في كل مهارة — من غير درجات ولا مقارنات.',
      en: 'A playful "ladder" session: short items that start easy and step up with the child’s answers. At the end IRIS has an initial level for each skill — no scores, no ranking.',
    },
  },
  {
    q: { ar: 'إيه اللغات اللي التطبيق بيستخدمها؟', en: 'Which languages does the app use?' },
    a: {
      ar: 'العربي والإنجليزي، مع تعليمات صوتية في الأنشطة — ف الطفل يقدر يشتغل حتى قبل ما يتعلم القراءة. الأهل يختاروا لغة الواجهة من أي شاشة.',
      en: 'Arabic and English, with spoken instructions inside activities — so a child can take part even before reading. Families can switch the interface language from any screen.',
    },
  },
  {
    q: { ar: 'أقدر أتابع تقدّم ابني إزاي؟', en: 'How can I follow my child’s progress?' },
    a: {
      ar: 'وضع الوالدين بيعرض لمحة التعلّم: المهارات اللي اتبنت، واللي لسه محتاجة دعم، وأفكار بسيطة تكملوا بيها في البيت. كل جلسة بتتخزن في حسابك.',
      en: 'Parent Mode shows the learning snapshot: skills that grew, skills still needing support, and simple ideas to carry into the day at home. Every session is saved to your account.',
    },
  },
  {
    q: { ar: 'بيانات طفلي في أمان؟', en: 'Is my child’s data safe?' },
    a: {
      ar: 'بيانات التعلّم مرتبطة بحساب الأهل وبتُستخدم لبناء مسار الطفل ومتابعته بس. IRIS نموذج أولي — والأهل يقدروا يطلبوا حذف بياناتهم من فريق المنصة.',
      en: 'Learning data lives with the parent account and is used only to build and follow the child’s path. IRIS is a prototype, and families can request deletion of their data from the team.',
    },
  },
];

export function FaqSection() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  return (
    <div className="lp-faq">
      {QUESTIONS.map((item, index) => {
        const isOpen = open === index;
        return (
          <div className={`lp-faq-item${isOpen ? ' lp-faq-item--open' : ''}`} key={item.q.en}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span>{ar ? item.q.ar : item.q.en}</span>
              <ChevronDown className="lp-faq-chevron" aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={reduce ? { opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                  className="lp-faq-panel"
                >
                  <p>{ar ? item.a.ar : item.a.en}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
