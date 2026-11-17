// P73 — hand-picked genuine photographs from Wikimedia Commons.
// fetch-photos.mjs searches by keyword and can only take the first title
// match; for concepts with noisy search results (children's faces, tidy
// rooms, yield signs) we hand-picked the exact File: title after listing
// the top candidates. This script downloads a specific title's 1280px
// thumbnail and records its license/artist into public/photos/ASSET_SOURCES.json.
//
// Usage: node scripts/fetch-picked.mjs
import fs from 'node:fs';
import path from 'node:path';

const UA = 'IRIS-Education/1.0 (contact: aehab3850@gmail.com)';
const OUT = path.resolve('public/photos');
const SOURCES = path.join(OUT, 'ASSET_SOURCES.json');

// id -> exact Commons file title (verified visually in the contact sheet)
const PICKED = {
  'emo-angry': "File:Child's Angry Face.jpg",
  'emo-calm': 'File:A young child is focused on reading a worn yellow book while sitting in a comfortable environment.jpg',
  'emo-excited': 'File:Ghanaian kid (skipping rope) 01.jpg',
  'emo-surprised': 'File:Beauty Girl Surprise.jpg',
  fish: 'File:Goldfish in Fish Tank.jpg',
  nest: 'File:Bird-nest-with-eggs-Sitia-Crete.jpg',
  'shape-triangle': 'File:Yield to oncoming traffic close-up Gatineau.jpg',
  'shape-heart': 'File:Heart shape in nature.jpg',
  'shape-rectangle': 'File:Wooden door on building with blue tiles, Conde Valbom Avenue, Lisbon, Portugal julesvernex2-2.jpg',
  mouth: 'File:Smiling face of a Bangladeshi child.jpg',
  'life-tidying': 'File:Toys and a laptop are placed on a white shelf in a childs room.jpg',
  // --- second review pass (contact-sheet rejects) ---
  ball: 'File:Adidas soccer ball on a grass pitch (Unsplash).jpg',
  bicycle: 'File:New Orleans February 2014 - Parked bicycle in front of sett street.jpg',
  book: 'File:Mother reads an open picture book with two children at home.jpg',
  'color-green': 'File:Water Droplet on Green Leaf.jpg',
  dog: 'File:Golden Retriever Puppy Looking Over Gate.jpg',
  falcon: 'File:African peregrine falcon (Falco peregrinus minor) Arusha.jpg',
  grapes: 'File:DFC 3937 Bunches of plump juicy red grapes piled together ready to snack on.jpg',
  horse: 'File:Brown Horse - geograph.org.uk - 7714997.jpg',
  kite: 'File:Child flying a kite on the beach at sunset.jpg',
  plane: 'File:Commercial airliner flying over Dhaka.jpg',
  watermelon: 'File:Slices of watermelon placed on a red tray at a summer gathering.jpg',
  hands: 'File:Hands Holding1.jpg',
  envelope: 'File:An envelope of the letter from President Theodore Roosevelt, 1909.jpg',
  xylophone: 'File:Hanging Wood Xylophone.jpg',
  // third review pass
  heart: 'File:Dresden, Deutsches Hygiene-Museum, anatomisches Modell, Herz.jpg',
  gamepad: 'File:InclusiveGameLab Hori-Flex-Controller 4 CC-BY-SA 04.jpg',
  rabbit: 'File:White rabbit on grass (Unsplash).jpg',
};

async function api(params) {
  const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params });
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

const meta = fs.existsSync(SOURCES) ? JSON.parse(fs.readFileSync(SOURCES, 'utf8')) : {};

const only = process.argv.includes('--only') ? new Set(process.argv[process.argv.indexOf('--only') + 1].split(',')) : null;
for (const [id, title] of Object.entries(PICKED)) {
  if (only && !only.has(id)) continue;
  try {
    const j = await api({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '1280' });
    const page = Object.values(j.query.pages)[0];
    const ii = page?.imageinfo?.[0];
    if (!ii?.thumburl) { console.log(`${id} NO INFO <- ${title}`); continue; }
    if (!/jpe?g/.test(ii.mime) || ii.width < 800) { console.log(`${id} NOT PHOTO/SMALL ${ii.mime} ${ii.width}`); continue; }
    const buf = Buffer.from(await (await fetch(ii.thumburl, { headers: { 'User-Agent': UA } })).arrayBuffer());
    if (buf.length < 15_000) { console.log(`${id} TOO SMALL ${buf.length}`); continue; }
    fs.writeFileSync(path.join(OUT, `${id}.jpg`), buf);
    const em = ii.extmetadata || {};
    meta[id] = {
      title,
      page: page.title ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` : undefined,
      url: ii.thumburl,
      license: em.LicenseShortName?.value || 'unknown',
      artist: (em.Artist?.value || '').replace(/<[^>]*>/g, '').trim().slice(0, 120) || 'unknown',
    };
    console.log(`${id} OK ${(buf.length / 1024) | 0}KB [${meta[id].license}]`);
    await new Promise(r => setTimeout(r, 1200));
  } catch (e) { console.log(`${id} ERR ${e.message}`); await new Promise(r => setTimeout(r, 4000)); }
}
fs.writeFileSync(SOURCES, JSON.stringify(meta, null, 2));
// shape-circle: a ball is the clearest real-world circle — reuse the vetted ball photo
fs.copyFileSync(path.join(OUT, 'ball.jpg'), path.join(OUT, 'shape-circle.jpg'));
meta['shape-circle'] = { ...(meta.ball || {}), note: 'same photograph as ball.jpg (ball = circle)' };
fs.writeFileSync(SOURCES, JSON.stringify(meta, null, 2));
console.log('DONE picked');
