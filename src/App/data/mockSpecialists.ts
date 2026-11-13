/**
 * DEMO specialist directory.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  READ THIS BEFORE EDITING. THE RULES BELOW ARE NOT STYLE PREFERENCES.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * This project already shipped a screen with four invented practitioners —
 * "Dr. Sarah Ahmed, 4.9★, 127 reviews" — complete with availability slots and
 * a live booking POST. The Phase 1 audit named it the highest-risk item in the
 * repository, because fabricating a medical credential is the single most
 * harmful thing an app for disabled children can do. This file exists so that
 * a demo of the specialist pathway never becomes that again.
 *
 * FOUR RULES, ENFORCED BY qa-demo-data.mjs
 *
 *  1. NO HUMAN NAMES. Every profile is labelled "Demo Specialist A/B/C…",
 *     never a plausible person. A marked-as-demo human name survives exactly
 *     until someone screenshots the card; a label that reads "Demo Specialist"
 *     cannot be mistaken for a person in any crop.
 *
 *  2. NO CREDENTIALS. No "Dr.", no degrees, no licence or registration
 *     numbers, no institution names, no specialisms claimed as qualifications.
 *     `specialty` names the KIND OF SUPPORT a real practitioner would give,
 *     which is a category, not a claim about a person.
 *
 *  3. NO SOCIAL PROOF, EVER. No ratings, no review counts, no patient
 *     numbers, no "years of experience" as a figure. `experience` carries a
 *     descriptive placeholder, because a number there is a credential claim
 *     wearing a different hat.
 *
 *  4. NO MEDICAL CONTENT. Nothing in a bio or an area of support may read as
 *     advice, a treatment, or an outcome promise.
 *
 * Every record carries `is_demo: true` and `verification_status:
 * 'DEMO_NOT_VERIFIED'`, and the UI renders both. Replacing this file with the
 * real directory means real people whose credentials have actually been
 * checked — see directory.ts for the swap.
 */

export type VerificationStatus =
  /** A placeholder profile. Not a person. */
  | 'DEMO_NOT_VERIFIED'
  /** A real profile whose credentials have not yet been checked. */
  | 'PENDING_VERIFICATION'
  /** A real profile, credentials checked by a named process. */
  | 'VERIFIED';

export interface Specialist {
  id: string;
  /** Always a demo label while is_demo is true. Never a person's name. */
  name_ar: string;
  name_en: string;
  /** The kind of support offered — a category, not a qualification. */
  specialty_ar: string;
  specialty_en: string;
  bio_ar: string;
  bio_en: string;
  /** What a parent could bring to this kind of specialist. */
  areas_ar: string[];
  areas_en: string[];
  /** Descriptive placeholder. A number here would be a credential claim. */
  experience_ar: string;
  experience_en: string;
  /** Shape only — no real slots exist and nothing can be booked. */
  availability_ar: string;
  availability_en: string;
  /** Emoji stands in for a photograph. A stock face would imply a real person. */
  avatar_placeholder: string;
  /** Brand tone for the card, so the directory reads as one system. */
  tone: 'blue' | 'purple' | 'green' | 'yellow' | 'coral';
  verification_status: VerificationStatus;
  is_demo: boolean;
  /** Booking is off at the data layer, not just hidden in the UI. */
  accepts_bookings: boolean;
}

const demo = (o: Omit<Specialist, 'is_demo' | 'verification_status' | 'accepts_bookings'>): Specialist => ({
  is_demo: true,
  verification_status: 'DEMO_NOT_VERIFIED',
  accepts_bookings: false,
  ...o,
});

export const MOCK_SPECIALISTS: Specialist[] = [
  demo({
    id: 'DEMO-SPEC-A',
    name_ar: 'أخصائي تجريبي (أ)',
    name_en: 'Demo Specialist A',
    specialty_ar: 'تخاطب ولغة',
    specialty_en: 'Speech & language support',
    bio_ar:
      'الملف ده تجريبي وبيوضّح شكل الملف الحقيقي لما الخدمة تفتح. أخصائي التخاطب بيشتغل على الفهم والتواصل، مش على النطق بس.',
    bio_en:
      'A placeholder profile showing the shape a real one will take. Speech and language work covers understanding and communication, not only pronunciation.',
    areas_ar: ['فهم الكلام', 'التواصل بالإشارة والصور', 'بناء المفردات', 'أصوات الحروف'],
    areas_en: ['Understanding speech', 'Gesture and picture communication', 'Building vocabulary', 'Letter sounds'],
    experience_ar: 'الخبرة هتظهر هنا من الملف الموثّق — مفيش رقم متحطّ في النسخة التجريبية',
    experience_en: 'Experience will come from the verified profile — no figure is shown in the demo',
    availability_ar: 'المواعيد هتظهر هنا لما الخدمة تفتح',
    availability_en: 'Availability will appear here once the service opens',
    avatar_placeholder: '🗣️',
    tone: 'blue',
  }),
  demo({
    id: 'DEMO-SPEC-B',
    name_ar: 'أخصائي تجريبي (ب)',
    name_en: 'Demo Specialist B',
    specialty_ar: 'تربية خاصة',
    specialty_en: 'Special education support',
    bio_ar:
      'ملف تجريبي. الشغل هنا بيكون على أهداف التعلّم وطريقة التدريس والدعم جوّه المدرسة، بالتنسيق مع الأهل.',
    bio_en:
      'A placeholder profile. This kind of work covers learning goals, teaching approaches, and support inside school, alongside the family.',
    areas_ar: ['أهداف التعلّم', 'تبسيط المهام', 'الدعم داخل الفصل', 'التواصل مع المدرسة'],
    areas_en: ['Learning goals', 'Breaking tasks down', 'Support in the classroom', 'Working with the school'],
    experience_ar: 'الخبرة هتظهر هنا من الملف الموثّق — مفيش رقم متحطّ في النسخة التجريبية',
    experience_en: 'Experience will come from the verified profile — no figure is shown in the demo',
    availability_ar: 'المواعيد هتظهر هنا لما الخدمة تفتح',
    availability_en: 'Availability will appear here once the service opens',
    avatar_placeholder: '📘',
    tone: 'purple',
  }),
  demo({
    id: 'DEMO-SPEC-C',
    name_ar: 'أخصائي تجريبي (ج)',
    name_en: 'Demo Specialist C',
    specialty_ar: 'علاج وظيفي',
    specialty_en: 'Occupational therapy support',
    bio_ar:
      'ملف تجريبي. المجال ده بيتعامل مع المهارات الحركية والحواس ومهارات اليوم العادي زي الأكل واللبس.',
    bio_en:
      'A placeholder profile. This area covers motor skills, sensory needs, and everyday skills such as eating and dressing.',
    areas_ar: ['المهارات الحركية الدقيقة', 'الاحتياجات الحسية', 'مهارات الحياة اليومية', 'الجلسة والوضعية'],
    areas_en: ['Fine motor skills', 'Sensory needs', 'Everyday living skills', 'Seating and positioning'],
    experience_ar: 'الخبرة هتظهر هنا من الملف الموثّق — مفيش رقم متحطّ في النسخة التجريبية',
    experience_en: 'Experience will come from the verified profile — no figure is shown in the demo',
    availability_ar: 'المواعيد هتظهر هنا لما الخدمة تفتح',
    availability_en: 'Availability will appear here once the service opens',
    avatar_placeholder: '🤲',
    tone: 'green',
  }),
  demo({
    id: 'DEMO-SPEC-D',
    name_ar: 'أخصائي تجريبي (د)',
    name_en: 'Demo Specialist D',
    specialty_ar: 'دعم نفسي وسلوكي',
    specialty_en: 'Psychological & behavioural support',
    bio_ar:
      'ملف تجريبي. الشغل هنا على السلوك والمشاعر ودعم الأسرة، والتقييم المتخصص لما يكون محتاج.',
    bio_en:
      'A placeholder profile. This covers behaviour, emotions, family support, and specialist assessment where it is needed.',
    areas_ar: ['السلوك في البيت', 'القلق والتنظيم الانفعالي', 'دعم الأسرة', 'التقييم المتخصص'],
    areas_en: ['Behaviour at home', 'Anxiety and emotional regulation', 'Family support', 'Specialist assessment'],
    experience_ar: 'الخبرة هتظهر هنا من الملف الموثّق — مفيش رقم متحطّ في النسخة التجريبية',
    experience_en: 'Experience will come from the verified profile — no figure is shown in the demo',
    availability_ar: 'المواعيد هتظهر هنا لما الخدمة تفتح',
    availability_en: 'Availability will appear here once the service opens',
    avatar_placeholder: '🧠',
    tone: 'yellow',
  }),
];
