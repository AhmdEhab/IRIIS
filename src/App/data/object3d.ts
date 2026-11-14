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
    glb?: string;
    proc?: ProceduralSpec;
    photo?: string;
    /** emoji shown when WebGL is unavailable or the asset fails */
    fallbackEmoji?: string;
}

const M = (id: string) => `/models/${id}.glb`;
const P = (id: string) => `/photos/${id}.jpg`;

export const OBJECT3D: Record<string, Object3DEntry> = {
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
    circle: { glb: M('sphere'), fallbackEmoji: '⭕' },
    square: { glb: M('cube'), fallbackEmoji: '🟦' },
    triangle: { glb: M('prism'), fallbackEmoji: '🔺' },
    rectangle: { glb: M('box'), fallbackEmoji: '▭' },
    star: { glb: M('star'), fallbackEmoji: '⭐' },
    // ── colors → glossy 3D orbs (true geometry, brand-safe hues) ─
    red: { proc: { kind: 'sphere', color: '#E5484D' }, fallbackEmoji: '🍎' },
    blue: { proc: { kind: 'sphere', color: '#3E7BFA' }, fallbackEmoji: '🐳' },
    green: { proc: { kind: 'sphere', color: '#3FA96B' }, fallbackEmoji: '🌳' },
    yellow: { proc: { kind: 'sphere', color: '#F2B93B' }, fallbackEmoji: '☀️' },
    purple: { proc: { kind: 'sphere', color: '#8D6AE0' }, fallbackEmoji: '🍇' },
};

export function object3dFor(id: string | undefined): Object3DEntry | undefined {
    return id ? OBJECT3D[id] : undefined;
}
