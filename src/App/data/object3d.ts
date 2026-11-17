/**
 * object3d — map of curriculum item ids to their real 3D assets and
 * genuine photographs, for the interactive Touch-Explore-Learn experience.
 *
 * glb  : path under public/models (real glTF binary, orbit/zoom/resettable)
 * proc : procedural real-3D primitive (used for color orbs)
 * photo: path under public/photos (authentic photograph of the same object)
 *
 * Items with no entry keep their legacy presentation — nothing is faked.
 */
export type ProceduralSpec = { kind: 'sphere'; color: string };

export interface Object3DEntry {
    /** for numbers: how many dots the counting tile shows */
    count?: number;
    glb?: string;
    proc?: ProceduralSpec;
    photo?: string;
    /** emoji shown when WebGL is unavailable or the asset fails */
    fallbackEmoji?: string;
}

import { NUMBER_PHOTO_UNIT } from './realPhotos';
const M = (id: string) => `/models/${id}.glb`;
const P = (id: string) => `/photos/${id}.jpg`;

export const OBJECT3D: Record<string, Object3DEntry> = {
    // numbers: counting tile shows N thumbnails of ONE real object
    '1': { count: 1, photo: P(NUMBER_PHOTO_UNIT[1]), fallbackEmoji: '🎈' },
    '2': { count: 2, photo: P(NUMBER_PHOTO_UNIT[2]), fallbackEmoji: '🎈' },
    '3': { count: 3, photo: P(NUMBER_PHOTO_UNIT[3]), fallbackEmoji: '🎈' },
    '4': { count: 4, photo: P(NUMBER_PHOTO_UNIT[4]), fallbackEmoji: '🎈' },
    '5': { count: 5, photo: P(NUMBER_PHOTO_UNIT[5]), fallbackEmoji: '🎈' },
    '6': { count: 6, photo: P(NUMBER_PHOTO_UNIT[6]), fallbackEmoji: '🎈' },
    '7': { count: 7, photo: P(NUMBER_PHOTO_UNIT[7]), fallbackEmoji: '🎈' },
    '8': { count: 8, photo: P(NUMBER_PHOTO_UNIT[8]), fallbackEmoji: '🎈' },
    '9': { count: 9, photo: P(NUMBER_PHOTO_UNIT[9]), fallbackEmoji: '🎈' },
    '10': { count: 10, photo: P(NUMBER_PHOTO_UNIT[10]), fallbackEmoji: '🎈' },
    // ── animals ────────────────────────────────────────────────
    lion: { glb: M('lion'), photo: P('lion'), fallbackEmoji: '🦁' },
    elephant: { glb: M('elephant'), photo: P('elephant'), fallbackEmoji: '🐘' },
    giraffe: { glb: M('giraffe'), photo: P('giraffe'), fallbackEmoji: '🦒' },
    monkey: { glb: M('monkey'), photo: P('monkey'), fallbackEmoji: '🐒' },
    cat: { glb: M('cat'), photo: P('cat'), fallbackEmoji: '🐱' },
    dog: { glb: M('dog'), photo: P('dog'), fallbackEmoji: '🐶' },
    panda: { glb: M('panda'), photo: P('panda'), fallbackEmoji: '🐼' },
    tiger: { glb: M('tiger'), photo: P('tiger'), fallbackEmoji: '🐯' },
    zebra: { glb: M('zebra'), photo: P('zebra'), fallbackEmoji: '🦓' },
    rabbit: { glb: M('rabbit'), photo: P('rabbit'), fallbackEmoji: '🐰' },
    // ── fruits ─────────────────────────────────────────────────
    apple: { glb: M('apple'), photo: P('apple'), fallbackEmoji: '🍎' },
    banana: { glb: M('banana'), photo: P('banana'), fallbackEmoji: '🍌' },
    orange: { glb: M('orange'), photo: P('orange'), fallbackEmoji: '🍊' },
    strawberry: { glb: M('strawberry'), photo: P('strawberry'), fallbackEmoji: '🍓' },
    grapes: { glb: M('grapes'), photo: P('grapes'), fallbackEmoji: '🍇' },
    watermelon: { glb: M('watermelon'), photo: P('watermelon'), fallbackEmoji: '🍉' },
    // ── vehicles ───────────────────────────────────────────────
    car: { glb: M('car'), photo: P('car'), fallbackEmoji: '🚗' },
    plane: { glb: M('plane'), photo: P('plane'), fallbackEmoji: '✈️' },
    train: { glb: M('train'), photo: P('train'), fallbackEmoji: '🚂' },
    ship: { glb: M('ship'), photo: P('ship'), fallbackEmoji: '🚢' },
    bicycle: { glb: M('bicycle'), photo: P('bicycle'), fallbackEmoji: '🚲' },
    rocket: { glb: M('rocket'), photo: P('rocket'), fallbackEmoji: '🚀' },
    // ── body parts ─────────────────────────────────────────────
    heart: { glb: M('heart'), photo: P('heart'), fallbackEmoji: '❤️' },
    brain: { glb: M('brain'), photo: P('brain'), fallbackEmoji: '🧠' },
    eyes: { photo: P('eyes'), fallbackEmoji: '👀' },
    ears: { photo: P('ears'), fallbackEmoji: '👂' },
    nose: { photo: P('nose'), fallbackEmoji: '👃' },
    mouth: { photo: P('mouth'), fallbackEmoji: '👄' },
    hands: { photo: P('hands'), fallbackEmoji: '🙌' },
    feet: { photo: P('feet'), fallbackEmoji: '👣' },
    // ── shapes → real solids ───────────────────────────────────
    circle: { glb: M('sphere'), photo: P('shape-circle'), fallbackEmoji: '⭕' },
    square: { glb: M('cube'), photo: P('shape-square'), fallbackEmoji: '🟦' },
    triangle: { glb: M('prism'), photo: P('shape-triangle'), fallbackEmoji: '🔺' },
    rectangle: { glb: M('box'), photo: P('shape-rectangle'), fallbackEmoji: '▭' },
    star: { glb: M('star'), photo: P('shape-star'), fallbackEmoji: '⭐' },
    // ShapesScreen 'heart' is the VALENTINE shape (a heart-shaped shell in a
    // photo), not the anatomy card of BodyParts, whose id is also 'heart'.
    // The shapes screen passes itemId='shape-heart' to keep them apart.
    'shape-heart': { photo: P('shape-heart'), fallbackEmoji: '❤️' },
    // ── colors → glossy 3D orbs (true geometry, brand-safe hues) ─
    red: { proc: { kind: 'sphere', color: '#E5484D' }, photo: P('color-red'), fallbackEmoji: '🍎' },
    blue: { proc: { kind: 'sphere', color: '#3E7BFA' }, photo: P('color-blue'), fallbackEmoji: '🐳' },
    green: { proc: { kind: 'sphere', color: '#3FA96B' }, photo: P('color-green'), fallbackEmoji: '🌳' },
    yellow: { proc: { kind: 'sphere', color: '#F2B93B' }, photo: P('color-yellow'), fallbackEmoji: '☀️' },
    purple: { proc: { kind: 'sphere', color: '#8D6AE0' }, photo: P('color-purple'), fallbackEmoji: '🍇' },
    // ColorsScreen passes itemId 'color-orange' so it does not collide
    // with the fruit 'orange' entry above.
    'color-orange': { proc: { kind: 'sphere', color: '#F07C1F' }, photo: P('color-orange'), fallbackEmoji: '🍊' },
    // emotions — photographed children's faces (never cartoons)
    happy: { photo: P('emo-happy'), fallbackEmoji: '😊' },
    sad: { photo: P('emo-sad'), fallbackEmoji: '😢' },
    angry: { photo: P('emo-angry'), fallbackEmoji: '😠' },
    excited: { photo: P('emo-excited'), fallbackEmoji: '🤩' },
    surprised: { photo: P('emo-surprised'), fallbackEmoji: '😲' },
    calm: { photo: P('emo-calm'), fallbackEmoji: '😌' },
};

export function object3dFor(id: string | undefined): Object3DEntry | undefined {
    return id ? OBJECT3D[id] : undefined;
}
