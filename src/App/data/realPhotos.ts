/**
 * P73 — every child-facing learning visual is a genuine photograph.
 *
 * The photos live in `public/photos/` (downloaded by scripts/fetch-photos.mjs
 * and hand-picked by scripts/fetch-picked.mjs from Wikimedia Commons; the
 * license of each file is recorded next to them in ASSET_SOURCES.json).
 * This module is the single place that maps curriculum vocabulary to those
 * files, so no screen ever hotlinks a remote image again.
 */

/** Curriculum word (English name) -> photo file id under /photos. */
const WORD_PHOTO: Record<string, string> = {
    // animals
    cat: 'cat', dog: 'dog', lion: 'lion', tiger: 'tiger', zebra: 'zebra',
    elephant: 'elephant', giraffe: 'giraffe', monkey: 'monkey', panda: 'panda',
    rabbit: 'rabbit', duck: 'duck', fox: 'fox', camel: 'camel', horse: 'horse',
    sheep: 'sheep', bear: 'bear', bee: 'bee', falcon: 'falcon', frog: 'frog',
    gazelle: 'gazelle', butterfly: 'butterfly', fish: 'fish', goat: 'goat', yak: 'yak', bird: 'duck',
    // fruits & food
    apple: 'apple', banana: 'banana', orange: 'orange', grapes: 'grapes',
    strawberry: 'strawberry', watermelon: 'watermelon', lemon: 'lemon',
    pomegranate: 'pomegranate', corn: 'corn', honey: 'bee',
    // vehicles & objects
    car: 'car', plane: 'plane', airplane: 'plane', ship: 'ship', train: 'train',
    bicycle: 'bicycle', rocket: 'rocket', van: 'truck', bus: 'truck', truck: 'truck',
    clock: 'clock', watch: 'clock', book: 'book', pen: 'pencil', pencil: 'pencil',
    ball: 'ball', kite: 'kite', umbrella: 'umbrella',
    envelope: 'envelope', gamepad: 'gamepad', xylophone: 'xylophone',
    // nature & sky
    sun: 'sun', moon: 'moon', star: 'shape-star', rainbow: 'rainbow',
    flower: 'rose', rose: 'rose', tree: 'color-green', nest: 'nest',
    ice: 'ice', jam: 'jam', crown: 'crown', queen: 'crown',
        // body
    eye: 'eyes', eyes: 'eyes', ear: 'ears', ears: 'ears', nose: 'nose',
    mouth: 'mouth', hand: 'hands', hands: 'hands', foot: 'feet', feet: 'feet',
    heart: 'heart', brain: 'brain',
    // colors — real-world exemplars
    // colour words are resolved by colorPhoto(); the fruit 'Orange' stays a fruit
    // shapes — real-world objects of that shape
    // shape words are resolved by shapePhoto()
    // emotions — photographed faces
    happy: 'emo-happy', sad: 'emo-sad', angry: 'emo-angry',
    excited: 'emo-excited', surprised: 'emo-surprised', calm: 'emo-calm',
    // emotion words are resolved by emotionPhoto()
    // life skills
    'washing-hands': 'life-washing-hands', brushing: 'life-brushing-teeth',
    tidying: 'life-tidying', eating: 'life-eating-healthy',
};

/** Photo ids that stand for a color lesson. */
export function colorPhoto(name: string): string {
    return `/photos/color-${name.toLowerCase()}.jpg`;
}
/** Photo ids that stand for a shape lesson (kept distinct from body 'heart'). */
export function shapePhoto(name: string): string {
    return `/photos/shape-${name.toLowerCase()}.jpg`;
}
/** Photo ids that stand for an emotion lesson. */
export function emotionPhoto(name: string): string {
    return `/photos/emo-${name.toLowerCase()}.jpg`;
}

const COLOR_WORDS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const SHAPE_WORDS = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'];
const EMO_WORDS = ['happy', 'sad', 'angry', 'excited', 'surprised', 'calm'];

/** Resolve any curriculum word to a local photograph path (or null). */
export function photoForWord(word: string | undefined): string | null {
    if (!word) return null;
    const key = word.toLowerCase().trim();
    const id = WORD_PHOTO[key];
    if (id) return `/photos/${id}.jpg`;
    // curriculum also lists abstract lesson words (colors/shapes/emotions)
    if (COLOR_WORDS.includes(key)) return `/photos/color-${key}.jpg`;
    if (SHAPE_WORDS.includes(key)) return `/photos/shape-${key}.jpg`;
    if (EMO_WORDS.includes(key)) return `/photos/emo-${key}.jpg`;
    return null;
}

/** Direct photo-id lookup (already-curated ids like 'life-tidying'). */
export function photoPath(id: string): string {
    return `/photos/${id}.jpg`;
}

/**
 * Counting units: the number screen shows N thumbnails of ONE real object,
 * so the quantity stays unambiguous (never a busy scene with hidden counts).
 */
export const NUMBER_PHOTO_UNIT: Record<number, string> = {
    1: 'apple', 2: 'duck', 3: 'car', 4: 'butterfly', 5: 'lemon',
    6: 'bee', 7: 'sun', 8: 'ball', 9: 'shape-star', 10: 'pomegranate',
};
