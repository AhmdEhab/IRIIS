/* ===========================================================================
   build-models.mjs — authors the IRIS 3D learning models (public/models/*.glb)

   WHY GENERATE RATHER THAN DOWNLOAD
   Most free GLB packs are either toy-realistic (4K textures, 5-10 MB each) or
   drawn in a palette that clashes with the IRIS identity. These models are the
   objects a child is being taught — an apple is an apple — so they have to be
   (a) unmistakably the named thing, (b) tiny enough to load on a school
   tablet, and (c) coloured from the brand palette in src/styles/iris.css.
   Generating them from three.js primitives gives all three, reproducibly:
   change a colour here, re-run, and the GLB follows the design system.

   Run:   node scripts/build-models.mjs
   Out:   public/models/<name>.glb   (unlit-friendly matte standard material)

   Two models are NOT made here — fox.glb and duck.glb are Khronos Group
   glTF-Sample-Assets (CC BY 1.0), downloaded as-is; see public/models/README.md.
=========================================================================== */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';


/* GLTFExporter's binary writer runs the buffer through a FileReader and waits
   on `onloadend`. Node's own global FileReader never settles that callback in
   this context, so the exporter is pointed at a deliberate, minimal
   implementation instead — the only Node/DOM gap this script has to paper. */
globalThis.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onloadend = null;
    this.onerror = null;
  }
  settle(promise) {
    promise
      .then((buf) => {
        this.result = buf;
        if (this.onload) this.onload();
        if (this.onloadend) this.onloadend();
      })
      .catch((err) => { if (this.onerror) this.onerror(err); });
  }
  readAsArrayBuffer(blob) { this.settle(blob.arrayBuffer()); }
  readAsDataURL(blob) {
    this.settle(blob.arrayBuffer().then((buf) => 'data:' + blob.type + ';base64,' + Buffer.from(buf).toString('base64')));
  }
};

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
mkdirSync(OUT, { recursive: true });

/* ── Brand palette (mirrors @theme in src/styles/iris.css) ─────────────── */
const C = {
  blue: 0x1f67b1,
  coral: 0xf45b63,
  yellow: 0xfeca34,
  green: 0x49b87a,
  purple: 0x8060b4,
  cream: 0xfffcf5,
  ground: 0xfef6ea,
  ink: 0x4a3728, // warm dark brown — the mascot's feature colour
  hairline: 0xe5cea6,
  stem: 0x7a5334,
  leaf: 0x49b87a,
  orangeRind: 0xef8a3c, // fruit colours are object colours, not UI tokens
  catCoat: 0xcbbfb0,
  catBelly: 0xfff7e8,
  catInnerEar: 0xf9a8a8,
};

const mat = (color, { roughness = 0.62, metalness = 0, flatShading = false } = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading });

/* ── Assembly helper ────────────────────────────────────────────────────
   Parts are declared in the model's own local space, baked into their
   geometry, then merged per material so every file exports as 1-4 meshes
   instead of thirty. Cheap to draw on a low-end tablet. */
function build(name, parts) {
  const byMaterial = new Map();
  for (const p of parts) {
    const geo = p.geo.clone();
    const m = new THREE.Matrix4();
    const euler = new THREE.Euler(...(p.rot ?? [0, 0, 0]));
    m.compose(
      new THREE.Vector3(...(p.pos ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(euler),
      new THREE.Vector3(...(p.scale ?? [1, 1, 1]))
    );
    geo.applyMatrix4(m);
    const key = p.mat.uuid;
    if (!byMaterial.has(key)) byMaterial.set(key, { mat: p.mat, geos: [] });
    byMaterial.get(key).geos.push(geo);
  }

  const group = new THREE.Group();
  group.name = name;
  let i = 0;
  for (const { mat: material, geos } of byMaterial.values()) {
    const merged = geos.length > 1 ? mergeGeometries(geos, false) : geos[0];
    if (!merged) throw new Error(`${name}: merge failed`);
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `${name}_part_${i++}`;
    group.add(mesh);
  }

  // Rest on an invisible ground plane: lift so the lowest point sits at y=0.
  const box = new THREE.Box3().setFromObject(group);
  group.children.forEach((c) => c.geometry.translate(0, -box.min.y, 0));
  return group;
}

/* ── Geometry helpers ─────────────────────────────────────────────────── */
const sphere = (r, w = 28, h = 20) => new THREE.SphereGeometry(r, w, h);

/** Apple body: a sphere pinched at the top into the characteristic notch. */
function appleBody() {
  const g = sphere(1, 40, 30);
  const pos = g.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    let x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
    const r2 = x * x + z * z;
    y *= 0.92;
    x *= 1 - 0.1 * Math.max(0, y);            // slight taper toward the top
    z *= 1 - 0.1 * Math.max(0, y);
    if (y > 0.45) y -= 0.42 * (y - 0.45) ** 2 * Math.exp(-r2 / 0.06); // notch
    if (y < -0.2) {                            // gentle lobes at the base
      const lobe = 1 + 0.05 * Math.cos(4 * Math.atan2(z, x)) * Math.max(0, -y - 0.2);
      x *= lobe; z *= lobe;
    }
    pos.setXYZ(k, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Orange body: dimpled peel from a deterministic, low-amplitude ripple. */
function orangeBody() {
  const g = sphere(1, 48, 34);
  const pos = g.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
    const bump = 0.012 * Math.sin(x * 17.3) * Math.sin(y * 15.1) * Math.sin(z * 19.7);
    const s = 1 + bump;
    pos.setXYZ(k, x * s, y * 0.94 * s, z * s);
  }
  g.computeVertexNormals();
  return g;
}

/** A leaf: a squashed, tilted ellipsoid. */
const leafPart = (pos, rot, scale = [0.34, 0.05, 0.16]) => ({
  geo: sphere(1, 18, 12),
  mat: mat(C.leaf, { roughness: 0.5 }),
  pos, rot, scale,
});

/** Extrude a 2D path into a flat toy shape (star, heart, prism). */
function extrude(shape, depth = 0.4) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 24,
  });
  g.translate(0, 0, -depth / 2);
  g.center();
  return g;
}

function starShape(points = 5, outer = 1, inner = 0.46) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.95);
  s.bezierCurveTo(-1.25, 0.05, -0.72, 1.05, 0, 0.45);
  s.bezierCurveTo(0.72, 1.05, 1.25, 0.05, 0, -0.95);
  return s;
}

function triangleShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 1);
  s.lineTo(1.05, -0.8);
  s.lineTo(-1.05, -0.8);
  s.closePath();
  return s;
}

/** Tapered banana: a tube along an arc, narrowed toward both ends. */
function bananaGeo() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, -0.15, 0),
    new THREE.Vector3(-0.55, 0.45, 0),
    new THREE.Vector3(0.15, 0.62, 0),
    new THREE.Vector3(0.75, 0.32, 0),
    new THREE.Vector3(1.08, -0.22, 0),
  ]);
  const tubular = 48, radial = 14;
  const g = new THREE.TubeGeometry(curve, tubular, 0.26, radial, false);
  const pos = g.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const row = Math.floor(k / (radial + 1));
    const t = row / tubular;
    const taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.55;
    const centre = curve.getPoint(t);
    const x = centre.x + (pos.getX(k) - centre.x) * taper;
    const y = centre.y + (pos.getY(k) - centre.y) * taper;
    const z = centre.z + (pos.getZ(k) - centre.z) * taper;
    pos.setXYZ(k, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/* ── The models ───────────────────────────────────────────────────────── */
const MODELS = {
  apple: () => build('apple', [
    { geo: appleBody(), mat: mat(C.coral, { roughness: 0.42 }), scale: [0.95, 0.95, 0.95], pos: [0, 0.95, 0] },
    { geo: new THREE.CylinderGeometry(0.055, 0.08, 0.5, 10), mat: mat(C.stem, { roughness: 0.8 }), pos: [0.02, 1.9, 0], rot: [0, 0, 0.18] },
    leafPart([0.3, 1.95, 0.05], [0, 0.5, -0.35]),
  ]),

  orange: () => build('orange', [
    { geo: orangeBody(), mat: mat(C.orangeRind, { roughness: 0.72 }), pos: [0, 1, 0] },
    { geo: new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8), mat: mat(C.stem, { roughness: 0.8 }), pos: [0, 2.02, 0] },
    leafPart([0.33, 2.0, 0.04], [0, 0.4, -0.5], [0.3, 0.045, 0.14]),
  ]),

  banana: () => build('banana', [
    { geo: bananaGeo(), mat: mat(C.yellow, { roughness: 0.5 }), pos: [0, 0.35, 0], rot: [0, 0, 0.1] },
    { geo: sphere(0.1, 12, 10), mat: mat(C.stem, { roughness: 0.85 }), pos: [-1.18, 0.02, 0], scale: [0.8, 0.9, 0.8] },
    { geo: sphere(0.085, 12, 10), mat: mat(C.stem, { roughness: 0.85 }), pos: [1.18, 0.13, 0], scale: [0.8, 0.9, 0.8] },
  ]),

  /** Sitting cat — head-heavy proportions, ear triangles, curled tail. */
  cat: () => {
    const coat = mat(C.catCoat, { roughness: 0.78 });
    const belly = mat(C.catBelly, { roughness: 0.8 });
    const dark = mat(C.ink, { roughness: 0.4 });
    const pink = mat(C.catInnerEar, { roughness: 0.7 });
    const ear = (x, tilt) => [
      { geo: new THREE.ConeGeometry(0.2, 0.4, 16), mat: coat, pos: [x, 1.98, 0], rot: [0, 0, tilt] },
      { geo: new THREE.ConeGeometry(0.12, 0.24, 14), mat: pink, pos: [x * 1.02, 1.94, 0.08], rot: [0, 0, tilt] },
    ];
    const whisker = (x, y, rz) => ({
      geo: new THREE.CylinderGeometry(0.007, 0.007, 0.5, 5),
      mat: dark,
      pos: [x, y, 0.36],
      rot: [Math.PI / 2, 0, rz],
    });
    return build('cat', [
      // body + head
      { geo: sphere(1, 30, 22), mat: coat, pos: [0, 0.62, 0], scale: [0.62, 0.78, 0.55] },
      { geo: sphere(1, 30, 22), mat: belly, pos: [0, 0.55, 0.26], scale: [0.34, 0.44, 0.2] },
      { geo: sphere(0.52, 30, 22), mat: coat, pos: [0, 1.62, 0.04] },
      // ears
      ...ear(-0.3, 0.22), ...ear(0.3, -0.22),
      // face
      { geo: sphere(0.075, 14, 12), mat: dark, pos: [-0.19, 1.68, 0.44] },
      { geo: sphere(0.075, 14, 12), mat: dark, pos: [0.19, 1.68, 0.44] },
      { geo: sphere(0.055, 12, 10), mat: mat(C.coral, { roughness: 0.5 }), pos: [0, 1.54, 0.5] , scale: [1.15, 0.85, 0.9] },
      ...whiskerSet(whisker),
      // front paws
      { geo: sphere(0.14, 16, 12), mat: belly, pos: [-0.24, 0.09, 0.3] },
      { geo: sphere(0.14, 16, 12), mat: belly, pos: [0.24, 0.09, 0.3] },
      // tail: a tapered tube curling up at the side
      { geo: tailGeo(), mat: coat, pos: [0.1, 0.05, -0.35] },
    ]);
  },

  sphere: () => build('sphere', [
    { geo: sphere(1, 48, 32), mat: mat(C.blue, { roughness: 0.34 }), pos: [0, 1, 0] },
  ]),

  cube: () => build('cube', [
    { geo: new RoundedBoxGeometry(1.7, 1.7, 1.7, 4, 0.16), mat: mat(C.coral, { roughness: 0.4 }) },
  ]),

  box: () => build('box', [
    { geo: new RoundedBoxGeometry(2.1, 1.4, 0.7, 4, 0.12), mat: mat(C.purple, { roughness: 0.4 }) },
  ]),

  cylinder: () => build('cylinder', [
    { geo: new THREE.CylinderGeometry(0.85, 0.85, 1.6, 40, 1, false), mat: mat(C.green, { roughness: 0.4 }), pos: [0, 0.8, 0] },
  ]),

  prism: () => build('prism', [
    { geo: extrude(triangleShape(), 0.6), mat: mat(C.blue, { roughness: 0.4 }), rot: [0, 0, 0] },
  ]),

  star: () => build('star', [
    { geo: extrude(starShape(), 0.42), mat: mat(C.yellow, { roughness: 0.35 }) },
  ]),

  heart: () => build('heart', [
    { geo: extrude(heartShape(), 0.42), mat: mat(C.coral, { roughness: 0.35 }) },
  ]),
};

function whiskerSet(make) {
  return [
    make(-0.42, 1.55, 0.12), make(-0.44, 1.47, -0.05),
    make(0.42, 1.55, -0.12), make(0.44, 1.47, 0.05),
  ];
}

function tailGeo() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.1, 0.0),
    new THREE.Vector3(0.55, 0.18, -0.35),
    new THREE.Vector3(0.78, 0.6, -0.15),
    new THREE.Vector3(0.62, 0.92, 0.12),
  ]);
  const tubular = 36, radial = 12;
  const g = new THREE.TubeGeometry(curve, tubular, 0.11, radial, false);
  const pos = g.attributes.position;
  for (let k = 0; k < pos.count; k++) {
    const row = Math.floor(k / (radial + 1));
    const t = Math.min(1, row / tubular);
    const c = curve.getPoint(t);
    const taper = 1.05 - 0.5 * t;
    pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * taper, c.y + (pos.getY(k) - c.y) * taper, c.z + (pos.getZ(k) - c.z) * taper);
  }
  g.computeVertexNormals();
  return g;
}

/* ── Export ───────────────────────────────────────────────────────────── */
const exporter = new GLTFExporter();

for (const [name, make] of Object.entries(MODELS)) {
  const scene = new THREE.Scene();
  scene.name = `iris_${name}`;
  scene.add(make());
  // A tiny tilt so a still (non-rotating) view already looks three-dimensional.
  scene.children[0].rotation.y = 0.35;

  const glb = await new Promise((resolve, reject) =>
    exporter.parse(
      scene,
      (result) => resolve(Buffer.from(result)),
      (error) => reject(error),
      { binary: true, onlyVisible: true, includeCustomExtensions: false, maxTextureSize: 512 }
    )
  );
  const file = path.join(OUT, `${name}.glb`);
  writeFileSync(file, glb);
  console.log(`${name}.glb  ${(glb.length / 1024).toFixed(1)} KB`);
}
console.log(`\nwrote ${Object.keys(MODELS).length} models to ${OUT}`);
