# IRIS 3D object library (`public/models/`)

Binary glTF (`.glb`) learning objects loaded by `src/App/components/three/Object3DViewer.tsx`.
App-item → file mapping lives in `src/App/components/three/modelLibrary.ts`; an item that is
not in that map deliberately shows no 3D control.

## Authored models — regenerate with `node scripts/build-models.mjs`

Built from three.js primitives in the brand palette (`src/styles/iris.css`), matte
"clay toy" materials, no textures. 4–170 kB each.

| File | Taught as |
| --- | --- |
| `apple.glb`, `orange.glb`, `banana.glb` | Fruits |
| `cat.glb` | Animals |
| `sphere.glb` (circle), `cube.glb` (square), `box.glb` (rectangle), `prism.glb` (triangle), `star.glb`, `heart.glb` | Shapes |
| `cylinder.glb` | spare solid in the primitive set |

## Downloaded models — kept for reference quality and the landing hero

| File | Source | Licence |
| --- | --- | --- |
| `fox.glb` | KhronosGroup/glTF-Sample-Assets, `Models/Fox/glTF-Binary` | CC0-1.0 / CC-BY-4.0 |
| `duck.glb` | KhronosGroup/glTF-Sample-Assets, `Models/Duck/glTF-Binary` | SCEA Shared Source License 1.0 (permissive, royalty-free; redistribution requires keeping the notice — see https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/LICENSES/SCEA.txt) |

The COLLADA duck is **not** CC0 despite common belief; it ships under SCEA. Avocado (8.1 MB)
and ToyCar (5.4 MB) were downloaded and rejected: too heavy for the tablets this runs on.

## House rules

* Keep each file under ~2 MB; these load on school tablets, often on weak wifi.
* A model must *be* the object the child is being taught. "Close enough" stand-ins are forbidden —
  return `null` from the library instead.
* Anything over these file sizes belongs in an external CDN, not in `public/`.
