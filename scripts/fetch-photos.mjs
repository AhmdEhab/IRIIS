/* Downloads genuine photographs from Wikimedia Commons for the 3D learning items.
   v2: backoff on API errors + title keyword validation to avoid wrong species.
   Usage: node scripts/fetch-photos.mjs [--only id1,id2] */
import { writeFile, mkdir } from 'node:fs/promises';

const OUT = 'public/photos';
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;

const QUERIES = {
  lion: ['Lion (Panthera leo) portrait', 'lion|panthera'],
  elephant: ['Loxodonta africana elephant', 'elephant|Loxodonta'],
  giraffe: ['Reticulated giraffe standing', 'giraffe'],
  monkey: ['Rhesus macaque sitting', 'macaque|monkey'],
  cat: ['Domestic cat sitting portrait', 'cat|felis'],
  dog: ['Dog sitting portrait', 'dog|canis'],
  panda: ['Giant panda sitting', 'panda'],
  tiger: ['Bengal tiger walking', 'tiger|panthera tigris'],
  zebra: ['Plains zebra standing', 'zebra'],
  rabbit: ['Domestic rabbit sitting', 'rabbit|oryctolagus'],
  apple: ['Red apple fruit', 'apple|malus'],
  banana: ['Banana fruit yellow ripe', 'banana'],
  orange: ['Orange (fruit) cut', 'orange|citrus'],
  strawberry: ['Strawberries fruit', 'strawberr'],
  grapes: ['Grape (fruit) bunch', 'grape|vitis'],
  watermelon: ['Watermelon fruit', 'watermelon|citrullus'],
  car: ['Automobile (car) sedan side', 'car|automobile|sedan|vehicle'],
  plane: ['Airliner in flight', 'airliner|airplane|aircraft|boeing|airbus'],
  train: ['Steam locomotive', 'locomotive|train'],
  ship: ['Ship vessel ocean', 'ship|vessel|boat|steamer'],
  bicycle: ['Bicycle vehicle', 'bicycle|bike|cycle'],
  rocket: ['Saturn V rocket launch', 'rocket|Saturn|Space_Shuttle|Falcon'],
  eyes: ['Human eye close-up', 'eye'],
  ears: ['Human ear close-up', 'ear'],
  nose: ['Nose human', 'nose'],
  mouth: ['Smiling child face close-up', 'smil|child|mouth|face'],
  hands: ['Human hands', 'hand'],
  feet: ['Human feet', 'foot'],
  heart: ['Heart shaped object symbol red photo', 'heart|Herz'],
  brain: ['Brain model anatomy education', 'brain'],

  // ── P73: everything the child sees becomes a genuine photograph ──────────
  duck: ['Domestic duck Anas platyrhynchos', 'duck|anas'],
  fox: ['Red fox sitting vulpes', 'fox|vulpes'],
  camel: ['Dromedary camel standing', 'camel'],
  horse: ['Horse standing portrait', 'horse|equus'],
  sheep: ['Domestic sheep Ovis aries', 'sheep|ovis'],
  bear: ['Brown bear Ursus arctos', 'bear|ursus'],
  corn: ['Maize cob ears Zea mays', 'maize|corn|zea'],
  pomegranate: ['Pomegranate fruit open', 'pomegranate'],
  fish: ['Goldfish aquarium orange', 'goldfish|fish'],
  sun: ['The Sun in space', 'Sun'],
  falcon: ['Peregrine falcon perched', 'falcon'],
  frog: ['Tree frog green sitting', 'frog'],
  gazelle: ['Gazelle standing savanna', 'gazelle'],
  butterfly: ['Butterfly on flower', 'butterfly'],
  book: ['Stack of books closed', 'book'],
  lemon: ['Lemon fruit yellow', 'lemon'],
  bee: ['Honey bee on flower apis', 'bee|apis'],
  moon: ['Waxing crescent Moon', 'moon'],
  rose: ['Red rose flower bloom', 'rose'],
  ball: ['Association football ball', 'ball|football'],
  goat: ['Goat', 'goat'],
  ice: ['Ice cube closeup', 'ice'],
  jam: ['Jam jar strawberry homemade', 'jam|preserv'],
  kite: ['Kite in sky', 'kite'],
  nest: ['Bird nest eggs twigs', 'nest'],
  pencil: ['Colored pencils set', 'pencil'],
  crown: ['Royal crown jewellery', 'crown'],
  umbrella: ['Umbrella rain', 'umbrella'],
  truck: ['Truck lorry road vehicle', 'truck|lorry'],
  clock: ['Wall clock white', 'clock'],
  gamepad: ['Game controller console modern', 'controller|gamepad|console'],
  yak: ['Yak (animal)', 'yak|grunniens'],
  rainbow: ['Rainbow sky landscape', 'rainbow'],
  'color-red': ['Chilli peppers red', 'red|chilli|pepper'],
  'color-blue': ['Blue sky clouds', 'blue|sky'],
  'color-green': ['Green leaves macro summer', 'green|leaf|leaves'],
  'color-yellow': ['Sunflower field bloom', 'sunflower|helianthus'],
  'color-purple': ['Lavender field purple', 'lavender'],
  'color-orange': ['Marigold flowers orange', 'marigold|calendula'],
  'shape-circle': ['Ball', 'ball'],
  'shape-square': ['Rubik cube puzzle solved', 'rubik|cube'],
  'shape-triangle': ['Triangular warning road sign', 'triangle|sign'],
  'shape-rectangle': ['Door house rectangular', 'door'],
  'shape-star': ['Starfish sea orange', 'starfish|asterias'],
  'shape-heart': ['Heart-shaped stones', 'heart'],
  'emo-happy': ['Happy girl smiling portrait', 'girl|boy|smiling|child'],
  'emo-sad': ['Crying child', 'cry|sad|child|baby'],
  'emo-angry': ['Frustrated toddler toy', 'toddler|child|kid|boy|girl'],
  'emo-excited': ['Children playing outdoors', 'children|child|kid'],
  'emo-surprised': ['Surprised girl face hands', 'surprised|face|girl|boy'],
  'emo-calm': ['Child reading picture book', 'child|girl|boy|reading'],
  'life-washing-hands': ['Hand washing', 'wash|hand'],
  'life-brushing-teeth': ['Child brushing teeth toothbrush', 'brush|tooth'],
  'life-tidying': ['Toy box room', 'toy|box'],
  'life-eating-healthy': ['Healthy food plate vegetables salad', 'vegetable|salad|plate|food'],
};

const UA = 'IRIS-Edu/1.0 (educational asset sourcing; local dev sandbox)';

async function apiJson(url, tries = 4) {
  for (let t = 0; t < tries; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const text = await r.text();
    try { return JSON.parse(text); }
    catch { await new Promise(res => setTimeout(res, 3000 * (t + 1))); continue; }
  }
  throw new Error('api not json');
}

async function searchFirst(term, keyword) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' +
    encodeURIComponent(`filetype:bitmap ${term}`) + '&gsrlimit=20&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1024&format=json';
  const j = await apiJson(url);
  const pages = Object.values(j?.query?.pages ?? {}).sort((a, b) => (a.index ?? 9) - (b.index ?? 9));
  for (const pg of pages) {
    const ii = pg.imageinfo?.[0];
    if (!ii || !/jpeg|jpg|png/.test(ii.mime)) continue;
    if (ii.width < 600 || ii.height < 400) continue;
    if (!new RegExp(keyword, 'i').test(pg.title)) continue;
    if (/logo|diagram|svg|flag|chart|skull|skeleton|x-ray|MRI|drawing|coat of arms|glacier|river|volcano|cave/i.test(pg.title)) continue;
    return { thumburl: ii.thumburl, title: pg.title };
  }
  return null;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const ids = only ?? Object.keys(QUERIES);
  const fail = [];
  for (const id of ids) {
    try {
      const [term, keyword] = QUERIES[id];
      const hit = await searchFirst(term, keyword);
      if (!hit) { console.log(id, 'NO RESULT'); fail.push(id); continue; }
      const res = await fetch(hit.thumburl, { headers: { 'User-Agent': UA } });
      if (!res.ok) { console.log(id, 'HTTP', res.status); fail.push(id); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 20000) { console.log(id, 'TOO SMALL', buf.length); fail.push(id); continue; }
      await writeFile(`${OUT}/${id}.jpg`, buf);
      console.log(id, 'OK', Math.round(buf.length / 1024) + 'KB', '<-', hit.title.slice(0, 60));
    } catch (e) { console.log(id, 'ERR', String(e).slice(0, 60)); fail.push(id); }
    await new Promise(r => setTimeout(r, 2500));
  }
  console.log('DONE fail=' + (fail.length ? fail.join(',') : 'none'));
}
main();
