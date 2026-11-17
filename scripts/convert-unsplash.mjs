// P73 one-shot codemod: rewrite every child-facing remote image reference to
// the vetted local photograph for that item. Tracks the nearest preceding
// nameEn/name id inside each object literal. Run once; kept for the record.
import fs from 'node:fs';

const WORD = {
  apple:'apple', banana:'banana', orange:'orange', strawberry:'strawberry', grapes:'grapes', watermelon:'watermelon',
  lion:'lion', elephant:'elephant', giraffe:'giraffe', monkey:'monkey', cat:'cat', dog:'dog', panda:'panda', tiger:'tiger', zebra:'zebra', rabbit:'rabbit',
  car:'car', airplane:'plane', plane:'plane', train:'train', ship:'ship', bicycle:'bicycle', rocket:'rocket',
  heart:'heart', brain:'brain', eyes:'eyes', ears:'ears', nose:'nose', mouth:'mouth', hands:'hands', feet:'feet',
  duck:'duck', fox:'fox', camel:'camel', horse:'horse', sheep:'sheep', bear:'bear', corn:'corn', pomegranate:'pomegranate', fish:'fish', sun:'sun', falcon:'falcon', frog:'frog', gazelle:'gazelle', butterfly:'butterfly', book:'book', lemon:'lemon', bee:'bee', moon:'moon', flower:'rose', hand:'hands', ball:'ball', goat:'goat', ice:'ice', jam:'jam', kite:'kite', nest:'nest', pen:'pencil', pencil:'pencil', queen:'crown', umbrella:'umbrella', van:'truck', truck:'truck', watch:'clock', xylophone:'xylophone', envelope:'envelope', gamepad:'gamepad', yak:'yak', rainbow:'rainbow', star:'shape-star',
};
const COLORS = new Set(['red','blue','green','yellow','purple','orange']);
const SHAPES = new Set(['circle','square','triangle','rectangle','star','heart']);
const EMOS = new Set(['happy','sad','angry','excited','surprised','calm']);

function pathFor(name, screen) {
  const k = name.toLowerCase();
  if (screen === 'ColorsScreen') return `/photos/color-${k}.jpg`;
  if (screen === 'ShapesScreen') return `/photos/shape-${k}.jpg`;
  if (screen === 'EmotionsScreen') return `/photos/emo-${k}.jpg`;
  if (COLORS.has(k)) return `/photos/color-${k}.jpg`;
  if (SHAPES.has(k)) return `/photos/shape-${k}.jpg`;
  if (EMOS.has(k)) return `/photos/emo-${k}.jpg`;
  const id = WORD[k];
  return id ? `/photos/${id}.jpg` : null;
}

const files = process.argv.slice(2);
let total = 0, misses = [];
for (const f of files) {
  const screen = f.split('/').pop().replace('.tsx', '').replace('.ts', '');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let lastName = null;
  let changed = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/nameEn:\s*'([^']+)'/) || lines[i].match(/titleEn:\s*'([^']+)'/);
    if (m) lastName = m[1];
    const u = lines[i].match(/(contextImage|thumbnail):\s*'https:\/\/images\.unsplash\.com\/[^']+'/);
    if (u) {
      const p = pathFor(lastName || '', screen);
      if (!p) { misses.push(`${screen}:${i + 1} after '${lastName}'`); continue; }
      lines[i] = lines[i].replace(/'(https:\/\/images\.unsplash\.com[^']*)'/, `'${p}'`);
      changed++; total++;
    }
  }
  fs.writeFileSync(f, lines.join('\n'));
  console.log(`${screen}: ${changed} rewritten`);
}
console.log('TOTAL', total, misses.length ? 'MISSES ' + JSON.stringify(misses) : '');
