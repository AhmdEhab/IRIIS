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
        contextImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=1000',
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
        contextImage: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1000'
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
        contextImage: 'https://images.unsplash.com/photo-1547721064-36202634a13b?auto=format&fit=crop&q=80&w=1000'
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
        contextImage: 'https://images.unsplash.com/photo-1564349683136-77e08bef1ef1?auto=format&fit=crop&q=80&w=1000'
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
        contextImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000'
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
        contextImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000'
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
    { id: 'alif', category: 'letters', nameAr: 'أرنب', nameEn: 'Rabbit', emoji: 'أ', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'ألف', letterNameEn: 'Alif', phoneticAr: 'أَ', contextImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ba', category: 'letters', nameAr: 'بطة', nameEn: 'Duck', emoji: 'ب', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'باء', letterNameEn: 'Ba', phoneticAr: 'بَ', contextImage: 'https://images.unsplash.com/photo-1555854817-cc01cf9dd002?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ta', category: 'letters', nameAr: 'تفاحة', nameEn: 'Apple', emoji: 'ت', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'تاء', letterNameEn: 'Ta', phoneticAr: 'تَ', contextImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b60d05?auto=format&fit=crop&q=80&w=1000' },
    { id: 'tha', category: 'letters', nameAr: 'ثعلب', nameEn: 'Fox', emoji: 'ث', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'ثاء', letterNameEn: 'Tha', phoneticAr: 'ثَ', contextImage: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&q=80&w=1000' },
    { id: 'jeem', category: 'letters', nameAr: 'جمل', nameEn: 'Camel', emoji: 'ج', color: 'bg-brand-purple', difficulty: 1, letterNameAr: 'جيم', letterNameEn: 'Jeem', phoneticAr: 'جَ', contextImage: 'https://images.unsplash.com/photo-1528148386185-bc9c09903968?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ha_ar', category: 'letters', nameAr: 'حصان', nameEn: 'Horse', emoji: 'ح', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'حاء', letterNameEn: 'Ha', phoneticAr: 'حَ', contextImage: 'https://images.unsplash.com/photo-1537751353102-ef30b3293e82?auto=format&fit=crop&q=80&w=1000' },
    { id: 'kha', category: 'letters', nameAr: 'خروف', nameEn: 'Sheep', emoji: 'خ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'خاء', letterNameEn: 'Kha', phoneticAr: 'خَ', contextImage: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=1000' },
    { id: 'dal', category: 'letters', nameAr: 'دب', nameEn: 'Bear', emoji: 'د', color: 'bg-brown-500', difficulty: 1, letterNameAr: 'دال', letterNameEn: 'Dal', phoneticAr: 'دَ', contextImage: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=1000' },
    { id: 'thal', category: 'letters', nameAr: 'ذرة', nameEn: 'Corn', emoji: 'ذ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'ذال', letterNameEn: 'Thal', phoneticAr: 'ذَ', contextImage: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ra', category: 'letters', nameAr: 'رمان', nameEn: 'Pomegranate', emoji: 'ر', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'راء', letterNameEn: 'Ra', phoneticAr: 'رَ', contextImage: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?auto=format&fit=crop&q=80&w=1000' },
    { id: 'zay', category: 'letters', nameAr: 'زرافة', nameEn: 'Giraffe', emoji: 'ز', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'زاي', letterNameEn: 'Zay', phoneticAr: 'زَ', contextImage: 'https://images.unsplash.com/photo-1547721064-36202634a13b?auto=format&fit=crop&q=80&w=1000' },
    { id: 'seen', category: 'letters', nameAr: 'سمكة', nameEn: 'Fish', emoji: 'س', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'سين', letterNameEn: 'Seen', phoneticAr: 'سَ', contextImage: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=1000' },
    { id: 'sheen', category: 'letters', nameAr: 'شمس', nameEn: 'Sun', emoji: 'ش', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'شين', letterNameEn: 'Sheen', phoneticAr: 'شَ', contextImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000' },
    { id: 'sad_ar', category: 'letters', nameAr: 'صقر', nameEn: 'Falcon', emoji: 'ص', color: 'bg-hairline', difficulty: 1, letterNameAr: 'صاد', letterNameEn: 'Sad', phoneticAr: 'صَ', contextImage: 'https://images.unsplash.com/photo-1534067783941-51c9c238bd73?auto=format&fit=crop&q=80&w=1000' },
    { id: 'dad', category: 'letters', nameAr: 'ضفدع', nameEn: 'Frog', emoji: 'ض', color: 'bg-brand-green', difficulty: 1, letterNameAr: 'ضاد', letterNameEn: 'Dad', phoneticAr: 'ضَ', contextImage: 'https://images.unsplash.com/photo-1559190394-df5a28aab5c5?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ta_ta', category: 'letters', nameAr: 'طائرة', nameEn: 'Plane', emoji: 'ط', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'طاء', letterNameEn: 'Ta', phoneticAr: 'طَ', contextImage: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=1000' },
    { id: 'za', category: 'letters', nameAr: 'ظرف', nameEn: 'Envelope', emoji: 'ظ', color: 'bg-surface', difficulty: 1, letterNameAr: 'ظاء', letterNameEn: 'Za', phoneticAr: 'ظَ', contextImage: 'https://images.unsplash.com/photo-1577563908411-5077b6ac7624?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ayn', category: 'letters', nameAr: 'عنب', nameEn: 'Grapes', emoji: 'ع', color: 'bg-brand-purple', difficulty: 1, letterNameAr: 'عين', letterNameEn: 'Ayn', phoneticAr: 'عَ', contextImage: 'https://images.unsplash.com/photo-1537640538966-79f369b41f8f?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ghayn', category: 'letters', nameAr: 'غزال', nameEn: 'Gazelle', emoji: 'غ', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'غين', letterNameEn: 'Ghayn', phoneticAr: 'غَ', contextImage: 'https://images.unsplash.com/photo-1540807891285-d601b092285e?auto=format&fit=crop&q=80&w=1000' },
    { id: 'fa', category: 'letters', nameAr: 'فراشة', nameEn: 'Butterfly', emoji: 'ف', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'فاء', letterNameEn: 'Fa', phoneticAr: 'فَ', contextImage: 'https://images.unsplash.com/photo-1551354020-fc6d31de2f5b?auto=format&fit=crop&q=80&w=1000' },
    { id: 'qaf', category: 'letters', nameAr: 'قرد', nameEn: 'Monkey', emoji: 'ق', color: 'bg-brown-600', difficulty: 1, letterNameAr: 'قاف', letterNameEn: 'Qaf', phoneticAr: 'قَ', contextImage: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000' },
    { id: 'kaf', category: 'letters', nameAr: 'كتاب', nameEn: 'Book', emoji: 'ك', color: 'bg-brand-blue', difficulty: 1, letterNameAr: 'كاف', letterNameEn: 'Kaf', phoneticAr: 'كَ', contextImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000' },
    { id: 'lam', category: 'letters', nameAr: 'ليمون', nameEn: 'Lemon', emoji: 'ل', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'لام', letterNameEn: 'Lam', phoneticAr: 'لَ', contextImage: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&q=80&w=1000' },
    { id: 'meem', category: 'letters', nameAr: 'موز', nameEn: 'Banana', emoji: 'م', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'ميم', letterNameEn: 'Meem', phoneticAr: 'مَ', contextImage: 'https://images.unsplash.com/photo-1571771894821-ad990241ec4a?auto=format&fit=crop&q=80&w=1000' },
    { id: 'noon', category: 'letters', nameAr: 'نحلة', nameEn: 'Bee', emoji: 'ن', color: 'bg-brand-yellow', difficulty: 1, letterNameAr: 'نون', letterNameEn: 'Noon', phoneticAr: 'نَ', contextImage: 'https://images.unsplash.com/photo-1559828589-72aa4fa1e2b5?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ha_ha', category: 'letters', nameAr: 'هلال', nameEn: 'Moon', emoji: 'هـ', color: 'bg-brand-blue-wash', difficulty: 1, letterNameAr: 'هاء', letterNameEn: 'Ha', phoneticAr: 'هَ', contextImage: 'https://images.unsplash.com/photo-1522030239044-f20387431038?auto=format&fit=crop&q=80&w=1000' },
    { id: 'waw', category: 'letters', nameAr: 'وردة', nameEn: 'Flower', emoji: 'و', color: 'bg-brand-coral', difficulty: 1, letterNameAr: 'واو', letterNameEn: 'Waw', phoneticAr: 'وَ', contextImage: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=1000' },
    { id: 'ya', category: 'letters', nameAr: 'يد', nameEn: 'Hand', emoji: 'ي', color: 'bg-peach-200', difficulty: 1, letterNameAr: 'ياء', letterNameEn: 'Ya', phoneticAr: 'يَ', contextImage: 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&q=80&w=1000' },

    // ENGLISH LETTERS (Complete)
    { id: 'en_a', category: 'letters', nameAr: 'تفاحة', nameEn: 'Apple', emoji: 'A', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ay', phoneticEn: '/æ/', contextImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b60d05?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_b', category: 'letters', nameAr: 'كرة', nameEn: 'Ball', emoji: 'B', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Bee', phoneticEn: '/b/', contextImage: 'https://images.unsplash.com/photo-1558230416-24874e4e963b?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_c', category: 'letters', nameAr: 'قطة', nameEn: 'Cat', emoji: 'C', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'See', phoneticEn: '/k/', contextImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_d', category: 'letters', nameAr: 'كلب', nameEn: 'Dog', emoji: 'D', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Dee', phoneticEn: '/d/', contextImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_e', category: 'letters', nameAr: 'فيل', nameEn: 'Elephant', emoji: 'E', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'Ee', phoneticEn: '/e/', contextImage: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_f', category: 'letters', nameAr: 'سمكة', nameEn: 'Fish', emoji: 'F', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Ef', phoneticEn: '/f/', contextImage: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_g', category: 'letters', nameAr: 'ماعز', nameEn: 'Goat', emoji: 'G', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'Jee', phoneticEn: '/g/', contextImage: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_h', category: 'letters', nameAr: 'حصان', nameEn: 'Horse', emoji: 'H', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Aitch', phoneticEn: '/h/', contextImage: 'https://images.unsplash.com/photo-1537751353102-ef30b3293e82?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_i', category: 'letters', nameAr: 'مكعب ثلج', nameEn: 'Ice', emoji: 'I', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Eye', phoneticEn: '/i/', contextImage: 'https://images.unsplash.com/photo-1473081556163-2a17de816133?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_j', category: 'letters', nameAr: 'مربى', nameEn: 'Jam', emoji: 'J', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Jay', phoneticEn: '/j/', contextImage: 'https://images.unsplash.com/photo-1582236814237-779cd20fc00a?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_k', category: 'letters', nameAr: 'طائرة ورقية', nameEn: 'Kite', emoji: 'K', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Kay', phoneticEn: '/k/', contextImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_l', category: 'letters', nameAr: 'أسد', nameEn: 'Lion', emoji: 'L', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'El', phoneticEn: '/l/', contextImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_m', category: 'letters', nameAr: 'قرد', nameEn: 'Monkey', emoji: 'M', color: 'bg-brown-500', difficulty: 1, letterNameEn: 'Em', phoneticEn: '/m/', contextImage: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_n', category: 'letters', nameAr: 'عش', nameEn: 'Nest', emoji: 'N', color: 'bg-brand-green', difficulty: 1, letterNameEn: 'En', phoneticEn: '/n/', contextImage: 'https://images.unsplash.com/photo-1548625361-94943f65e263?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_o', category: 'letters', nameAr: 'برتقالة', nameEn: 'Orange', emoji: 'O', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Oh', phoneticEn: '/ɒ/', contextImage: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b44?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_p', category: 'letters', nameAr: 'قلم', nameEn: 'Pen', emoji: 'P', color: 'bg-brand-blue', difficulty: 1, letterNameEn: 'Pee', phoneticEn: '/p/', contextImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_q', category: 'letters', nameAr: 'ملكة', nameEn: 'Queen', emoji: 'Q', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'Cue', phoneticEn: '/kw/', contextImage: 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_r', category: 'letters', nameAr: 'أرنب', nameEn: 'Rabbit', emoji: 'R', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ar', phoneticEn: '/r/', contextImage: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_s', category: 'letters', nameAr: 'شمس', nameEn: 'Sun', emoji: 'S', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Ess', phoneticEn: '/s/', contextImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_t', category: 'letters', nameAr: 'نمر', nameEn: 'Tiger', emoji: 'T', color: 'bg-brand-yellow', difficulty: 1, letterNameEn: 'Tee', phoneticEn: '/t/', contextImage: 'https://images.unsplash.com/photo-1508061461508-cb18c242f556?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_u', category: 'letters', nameAr: 'مظلة', nameEn: 'Umbrella', emoji: 'U', color: 'bg-brand-purple', difficulty: 1, letterNameEn: 'You', phoneticEn: '/ʌ/', contextImage: 'https://images.unsplash.com/photo-1533116432650-d46487e915f0?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_v', category: 'letters', nameAr: 'شاحنة', nameEn: 'Van', emoji: 'V', color: 'bg-hairline', difficulty: 1, letterNameEn: 'Vee', phoneticEn: '/v/', contextImage: 'https://images.unsplash.com/photo-1521743046049-39945bd0a61d?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_w', category: 'letters', nameAr: 'ساعة', nameEn: 'Watch', emoji: 'W', color: 'bg-brand-blue-wash', difficulty: 1, letterNameEn: 'Double-U', phoneticEn: '/w/', contextImage: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_x', category: 'letters', nameAr: 'إكس بوكس', nameEn: 'Xylophone', emoji: 'X', color: 'bg-brand-coral', difficulty: 1, letterNameEn: 'Ex', phoneticEn: '/ks/', contextImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_y', category: 'letters', nameAr: 'ياك', nameEn: 'Yak', emoji: 'Y', color: 'bg-brown-300', difficulty: 1, letterNameEn: 'Wye', phoneticEn: '/j/', contextImage: 'https://images.unsplash.com/photo-1563823251941-b9989d1e113a?auto=format&fit=crop&q=80&w=1000' },
    { id: 'en_z', category: 'letters', nameAr: 'حمار وحشي', nameEn: 'Zebra', emoji: 'Z', color: 'bg-hairline', difficulty: 1, letterNameEn: 'Zee', phoneticEn: '/z/', contextImage: 'https://images.unsplash.com/photo-1501705388883-4ed8a543392c?auto=format&fit=crop&q=80&w=1000' }
];

export function getItemsByCategory(category: CurriculumItem['category']): CurriculumItem[] {
    return MASTER_CURRICULUM.filter(item => item.category === category);
}

export function getItemById(id: string): CurriculumItem | undefined {
    return MASTER_CURRICULUM.find(item => item.id === id);
}
