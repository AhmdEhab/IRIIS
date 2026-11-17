/**
 * Master Curriculum Data Repository
 * Central source of truth for all educational items
 */

export interface CurriculumItem {
    id: string;
    category: 'animals' | 'colors' | 'letters' | 'numbers' | 'fruits' | 'vehicles' | 'songs' | 'shapes' | 'body-parts' | 'emotions';
    nameAr: string;
    nameEn: string;
    emoji: string;
    color: string;
    difficulty: number; // 1-10
    soundEffect?: string;
    contextImage?: string;
    phoneticAr?: string; // For sound-out logic
    phoneticEn?: string;
    letterNameAr?: string; // Specifically for letters
    letterNameEn?: string;
    tags?: string[];
}

export const MASTER_CURRICULUM: CurriculumItem[] = [
    // ANIMALS
    {
        id: 'lion',
        category: 'animals',
        nameAr: 'أسد',
        nameEn: 'Lion',
        emoji: '🦁',
        color: ' ',
        difficulty: 2,
        soundEffect: 'success',
        contextImage: '/photos/lion.jpg',
        tags: ['mammal', 'visual-strong']
    },
    {
        id: 'elephant',
        category: 'animals',
        nameAr: 'فيل',
        nameEn: 'Elephant',
        emoji: '🐘',
        color: ' ',
        difficulty: 3,
        soundEffect: 'success',
        contextImage: '/photos/elephant.jpg'
    },
    {
        id: 'giraffe',
        category: 'animals',
        nameAr: 'زرافة',
        nameEn: 'Giraffe',
        emoji: '🦒',
        color: ' ',
        difficulty: 3,
        soundEffect: 'success',
        contextImage: '/photos/giraffe.jpg'
    },
    {
        id: 'panda',
        category: 'animals',
        nameAr: 'باندا',
        nameEn: 'Panda',
        emoji: '🐼',
        color: ' ',
        difficulty: 1,
        soundEffect: 'success',
        contextImage: '/photos/panda.jpg'
    },

    // COLORS
    {
        id: 'red',
        category: 'colors',
        nameAr: 'أحمر',
        nameEn: 'Red',
        emoji: '🍎',
        color: ' ',
        difficulty: 1,
        soundEffect: 'success',
        contextImage: '/photos/color-red.jpg'
    },
    {
        id: 'blue',
        category: 'colors',
        nameAr: 'أزرق',
        nameEn: 'Blue',
        emoji: '🐳',
        color: ' ',
        difficulty: 1,
        soundEffect: 'success',
        contextImage: '/photos/color-blue.jpg'
    },

    // SHAPES
    {
        id: 'circle',
        category: 'shapes',
        nameAr: 'دائرة',
        nameEn: 'Circle',
        emoji: '⚪',
        color: ' ',
        difficulty: 1,
        soundEffect: 'success'
    },
    {
        id: 'square',
        category: 'shapes',
        nameAr: 'مربع',
        nameEn: 'Square',
        emoji: '⬜',
        color: ' ',
        difficulty: 2,
        soundEffect: 'success'
    },

    // EMOTIONS
    {
        id: 'happy',
        category: 'emotions',
        nameAr: 'سعيد',
        nameEn: 'Happy',
        emoji: '😊',
        color: ' ',
        difficulty: 2,
        soundEffect: 'success'
    },
    {
        id: 'sad',
        category: 'emotions',
        nameAr: 'حزين',
        nameEn: 'Sad',
        emoji: '😢',
        color: ' ',
        difficulty: 3,
        soundEffect: 'success'
    },

    // ARABIC LETTERS (Complete)
    { id: 'alif', category: 'letters', nameAr: 'أرنب', nameEn: 'Rabbit', emoji: 'أ', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'ألف', letterNameEn: 'Alif', phoneticAr: 'أَ', contextImage: '/photos/rabbit.jpg' },
    { id: 'ba', category: 'letters', nameAr: 'بطة', nameEn: 'Duck', emoji: 'ب', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'باء', letterNameEn: 'Ba', phoneticAr: 'بَ', contextImage: '/photos/duck.jpg' },
    { id: 'ta', category: 'letters', nameAr: 'تفاحة', nameEn: 'Apple', emoji: 'ت', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'تاء', letterNameEn: 'Ta', phoneticAr: 'تَ', contextImage: '/photos/apple.jpg' },
    { id: 'tha', category: 'letters', nameAr: 'ثعلب', nameEn: 'Fox', emoji: 'ث', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'ثاء', letterNameEn: 'Tha', phoneticAr: 'ثَ', contextImage: '/photos/fox.jpg' },
    { id: 'jeem', category: 'letters', nameAr: 'جمل', nameEn: 'Camel', emoji: 'ج', color: 'bg-brand-purple', difficulty: 1, letterNameAr: 'جيم', letterNameEn: 'Jeem', phoneticAr: 'جَ', contextImage: '/photos/camel.jpg' },
    { id: 'ha_ar', category: 'letters', nameAr: 'حصان', nameEn: 'Horse', emoji: 'ح', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'حاء', letterNameEn: 'Ha', phoneticAr: 'حَ', contextImage: '/photos/horse.jpg' },
    { id: 'kha', category: 'letters', nameAr: 'خروف', nameEn: 'Sheep', emoji: 'خ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'خاء', letterNameEn: 'Kha', phoneticAr: 'خَ', contextImage: '/photos/sheep.jpg' },
    { id: 'dal', category: 'letters', nameAr: 'دب', nameEn: 'Bear', emoji: 'د', color: 'bg-brown-500', difficulty: 1, letterNameAr: 'دال', letterNameEn: 'Dal', phoneticAr: 'دَ', contextImage: '/photos/bear.jpg' },
    { id: 'thal', category: 'letters', nameAr: 'ذرة', nameEn: 'Corn', emoji: 'ذ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'ذال', letterNameEn: 'Thal', phoneticAr: 'ذَ', contextImage: '/photos/corn.jpg' },
    { id: 'ra', category: 'letters', nameAr: 'رمان', nameEn: 'Pomegranate', emoji: 'ر', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'راء', letterNameEn: 'Ra', phoneticAr: 'رَ', contextImage: '/photos/pomegranate.jpg' },
    { id: 'zay', category: 'letters', nameAr: 'زرافة', nameEn: 'Giraffe', emoji: 'ز', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'زاي', letterNameEn: 'Zay', phoneticAr: 'زَ', contextImage: '/photos/giraffe.jpg' },
    { id: 'seen', category: 'letters', nameAr: 'سمكة', nameEn: 'Fish', emoji: 'س', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'سين', letterNameEn: 'Seen', phoneticAr: 'سَ', contextImage: '/photos/fish.jpg' },
    { id: 'sheen', category: 'letters', nameAr: 'شمس', nameEn: 'Sun', emoji: 'ش', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'شين', letterNameEn: 'Sheen', phoneticAr: 'شَ', contextImage: '/photos/sun.jpg' },
    { id: 'sad_ar', category: 'letters', nameAr: 'صقر', nameEn: 'Falcon', emoji: 'ص', color: 'bg-hairline', difficulty: 1, letterNameAr: 'صاد', letterNameEn: 'Sad', phoneticAr: 'صَ', contextImage: '/photos/falcon.jpg' },
    { id: 'dad', category: 'letters', nameAr: 'ضفدع', nameEn: 'Frog', emoji: 'ض', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'ضاد', letterNameEn: 'Dad', phoneticAr: 'ضَ', contextImage: '/photos/frog.jpg' },
    { id: 'ta_ta', category: 'letters', nameAr: 'طائرة', nameEn: 'Plane', emoji: 'ط', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'طاء', letterNameEn: 'Ta', phoneticAr: 'طَ', contextImage: '/photos/plane.jpg' },
    { id: 'za', category: 'letters', nameAr: 'ظرف', nameEn: 'Envelope', emoji: 'ظ', color: 'bg-surface', difficulty: 1, letterNameAr: 'ظاء', letterNameEn: 'Za', phoneticAr: 'ظَ', contextImage: '/photos/envelope.jpg' },
    { id: 'ayn', category: 'letters', nameAr: 'عنب', nameEn: 'Grapes', emoji: 'ع', color: 'bg-brand-purple', difficulty: 1, letterNameAr: 'عين', letterNameEn: 'Ayn', phoneticAr: 'عَ', contextImage: '/photos/grapes.jpg' },
    { id: 'ghayn', category: 'letters', nameAr: 'غزال', nameEn: 'Gazelle', emoji: 'غ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'غين', letterNameEn: 'Ghayn', phoneticAr: 'غَ', contextImage: '/photos/gazelle.jpg' },
    { id: 'fa', category: 'letters', nameAr: 'فراشة', nameEn: 'Butterfly', emoji: 'ف', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'فاء', letterNameEn: 'Fa', phoneticAr: 'فَ', contextImage: '/photos/butterfly.jpg' },
    { id: 'qaf', category: 'letters', nameAr: 'قرد', nameEn: 'Monkey', emoji: 'ق', color: 'bg-brown-600', difficulty: 1, letterNameAr: 'قاف', letterNameEn: 'Qaf', phoneticAr: 'قَ', contextImage: '/photos/monkey.jpg' },
    { id: 'kaf', category: 'letters', nameAr: 'كتاب', nameEn: 'Book', emoji: 'ك', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'كاف', letterNameEn: 'Kaf', phoneticAr: 'كَ', contextImage: '/photos/book.jpg' },
    { id: 'lam', category: 'letters', nameAr: 'ليمون', nameEn: 'Lemon', emoji: 'ل', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'لام', letterNameEn: 'Lam', phoneticAr: 'لَ', contextImage: '/photos/lemon.jpg' },
    { id: 'meem', category: 'letters', nameAr: 'موز', nameEn: 'Banana', emoji: 'م', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'ميم', letterNameEn: 'Meem', phoneticAr: 'مَ', contextImage: '/photos/banana.jpg' },
    { id: 'noon', category: 'letters', nameAr: 'نحلة', nameEn: 'Bee', emoji: 'ن', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'نون', letterNameEn: 'Noon', phoneticAr: 'نَ', contextImage: '/photos/bee.jpg' },
    { id: 'ha_ha', category: 'letters', nameAr: 'هلال', nameEn: 'Moon', emoji: 'هـ', color: 'bg-brand-blue-wash', difficulty: 1, letterNameAr: 'هاء', letterNameEn: 'Ha', phoneticAr: 'هَ', contextImage: '/photos/moon.jpg' },
    { id: 'waw', category: 'letters', nameAr: 'وردة', nameEn: 'Flower', emoji: 'و', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'واو', letterNameEn: 'Waw', phoneticAr: 'وَ', contextImage: '/photos/rose.jpg' },
    { id: 'ya', category: 'letters', nameAr: 'يد', nameEn: 'Hand', emoji: 'ي', color: 'bg-peach-200', difficulty: 1, letterNameAr: 'ياء', letterNameEn: 'Ya', phoneticAr: 'يَ', contextImage: '/photos/hands.jpg' },

    // ENGLISH LETTERS (Complete)
    { id: 'en_a', category: 'letters', nameAr: 'تفاحة', nameEn: 'Apple', emoji: 'A', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ay', phoneticEn: '/æ/', contextImage: '/photos/apple.jpg' },
    { id: 'en_b', category: 'letters', nameAr: 'كرة', nameEn: 'Ball', emoji: 'B', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Bee', phoneticEn: '/b/', contextImage: '/photos/ball.jpg' },
    { id: 'en_c', category: 'letters', nameAr: 'قطة', nameEn: 'Cat', emoji: 'C', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'See', phoneticEn: '/k/', contextImage: '/photos/cat.jpg' },
    { id: 'en_d', category: 'letters', nameAr: 'كلب', nameEn: 'Dog', emoji: 'D', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Dee', phoneticEn: '/d/', contextImage: '/photos/dog.jpg' },
    { id: 'en_e', category: 'letters', nameAr: 'فيل', nameEn: 'Elephant', emoji: 'E', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'Ee', phoneticEn: '/e/', contextImage: '/photos/elephant.jpg' },
    { id: 'en_f', category: 'letters', nameAr: 'سمكة', nameEn: 'Fish', emoji: 'F', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Ef', phoneticEn: '/f/', contextImage: '/photos/fish.jpg' },
    { id: 'en_g', category: 'letters', nameAr: 'ماعز', nameEn: 'Goat', emoji: 'G', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Jee', phoneticEn: '/g/', contextImage: '/photos/goat.jpg' },
    { id: 'en_h', category: 'letters', nameAr: 'حصان', nameEn: 'Horse', emoji: 'H', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Aitch', phoneticEn: '/h/', contextImage: '/photos/horse.jpg' },
    { id: 'en_i', category: 'letters', nameAr: 'مكعب ثلج', nameEn: 'Ice', emoji: 'I', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Eye', phoneticEn: '/i/', contextImage: '/photos/ice.jpg' },
    { id: 'en_j', category: 'letters', nameAr: 'مربى', nameEn: 'Jam', emoji: 'J', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Jay', phoneticEn: '/j/', contextImage: '/photos/jam.jpg' },
    { id: 'en_k', category: 'letters', nameAr: 'طائرة ورقية', nameEn: 'Kite', emoji: 'K', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Kay', phoneticEn: '/k/', contextImage: '/photos/kite.jpg' },
    { id: 'en_l', category: 'letters', nameAr: 'أسد', nameEn: 'Lion', emoji: 'L', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'El', phoneticEn: '/l/', contextImage: '/photos/lion.jpg' },
    { id: 'en_m', category: 'letters', nameAr: 'قرد', nameEn: 'Monkey', emoji: 'M', color: 'bg-brown-500', difficulty: 1, letterNameEn: 'Em', phoneticEn: '/m/', contextImage: '/photos/monkey.jpg' },
    { id: 'en_n', category: 'letters', nameAr: 'عش', nameEn: 'Nest', emoji: 'N', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'En', phoneticEn: '/n/', contextImage: '/photos/nest.jpg' },
    { id: 'en_o', category: 'letters', nameAr: 'برتقالة', nameEn: 'Orange', emoji: 'O', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Oh', phoneticEn: '/ɒ/', contextImage: '/photos/color-orange.jpg' },
    { id: 'en_p', category: 'letters', nameAr: 'قلم', nameEn: 'Pen', emoji: 'P', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Pee', phoneticEn: '/p/', contextImage: '/photos/pencil.jpg' },
    { id: 'en_q', category: 'letters', nameAr: 'ملكة', nameEn: 'Queen', emoji: 'Q', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'Cue', phoneticEn: '/kw/', contextImage: '/photos/crown.jpg' },
    { id: 'en_r', category: 'letters', nameAr: 'أرنب', nameEn: 'Rabbit', emoji: 'R', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ar', phoneticEn: '/r/', contextImage: '/photos/rabbit.jpg' },
    { id: 'en_s', category: 'letters', nameAr: 'شمس', nameEn: 'Sun', emoji: 'S', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Ess', phoneticEn: '/s/', contextImage: '/photos/sun.jpg' },
    { id: 'en_t', category: 'letters', nameAr: 'نمر', nameEn: 'Tiger', emoji: 'T', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Tee', phoneticEn: '/t/', contextImage: '/photos/tiger.jpg' },
    { id: 'en_u', category: 'letters', nameAr: 'مظلة', nameEn: 'Umbrella', emoji: 'U', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'You', phoneticEn: '/ʌ/', contextImage: '/photos/umbrella.jpg' },
    { id: 'en_v', category: 'letters', nameAr: 'شاحنة', nameEn: 'Van', emoji: 'V', color: 'bg-hairline', difficulty: 1, letterNameEn: 'Vee', phoneticEn: '/v/', contextImage: '/photos/truck.jpg' },
    { id: 'en_w', category: 'letters', nameAr: 'ساعة', nameEn: 'Watch', emoji: 'W', color: 'bg-brand-blue-wash', difficulty: 1, letterNameEn: 'Double-U', phoneticEn: '/w/', contextImage: '/photos/clock.jpg' },
    { id: 'en_x', category: 'letters', nameAr: 'إكس بوكس', nameEn: 'Xylophone', emoji: 'X', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ex', phoneticEn: '/ks/', contextImage: '/photos/xylophone.jpg' },
    { id: 'en_y', category: 'letters', nameAr: 'ياك', nameEn: 'Yak', emoji: 'Y', color: 'bg-brown-300', difficulty: 1, letterNameEn: 'Wye', phoneticEn: '/j/', contextImage: '/photos/yak.jpg' },
    { id: 'en_z', category: 'letters', nameAr: 'حمار وحشي', nameEn: 'Zebra', emoji: 'Z', color: 'bg-hairline', difficulty: 1, letterNameEn: 'Zee', phoneticEn: '/z/', contextImage: '/photos/zebra.jpg' }
];

export function getItemsByCategory(category: CurriculumItem['category']): CurriculumItem[] {
    return MASTER_CURRICULUM.filter(item => item.category === category);
}

export function getItemById(id: string): CurriculumItem | undefined {
    return MASTER_CURRICULUM.find(item => item.id === id);
}
