import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Object3DViewer — the IRIS 3D learning object.
 *
 * A child learning the word "مربع / square" is learning the SHAPE, and a flat
 * glyph of a shape is a poor teacher: it hides the very thing that makes a cube
 * a cube. This component puts a real, draggable object in front of the child,
 * inside the card vocabulary the rest of the app already uses.
 *
 * ── THIS FILE IMPORTS three.js, SO IT MUST BE LAZY-LOADED ────────────────
 * `three` + `@react-three/fiber` + `@react-three/drei` is the heaviest thing in
 * the app (several hundred kB of chunk). No consumer imports it statically:
 * they all go through `three/Explore3D.tsx`, which does
 *
 *     const Object3DViewer = React.lazy(() => import('./Object3DViewer'));
 *
 * so the 3D chunk is only fetched on a screen where a child actually opened the
 * 3D view. Importing this module eagerly would undo that.
 *
 * ── THREE WAYS THIS CAN FAIL, AND WHAT HAPPENS IN EACH ───────────────────
 * 1. No WebGL (old tablet, hardened browser, GPU disabled): detected once,
 *    before a Canvas is ever constructed, so we never mount one that cannot
 *    paint.
 * 2. The model cannot load or the renderer throws later (404 on the .glb,
 *    corrupt file, lost GPU context mid-session): caught by error boundaries
 *    on both sides of the R3F root, and control returns to this component.
 * 3. The device is fine but the child's system asks for reduced motion: not a
 *    failure — auto-rotation and the idle bob are dropped and dragging gets
 *    gentler, while the object itself stays fully present.
 * In all three cases the child still gets the picture. `fallbackEmoji` renders
 * as a large tile on the brand's warm ground with the object's name under it:
 * never an empty grey box, and no error text that a child would have to
 * interpret.
 */

export interface Object3DViewerProps {
  /** URL of a `.glb` (binary glTF). Ship them under ~2 MB from public/models/. */
  src: string;
  /** The object's name in the child's language; used as the accessible name. */
  alt: string;
  className?: string;
  /** Turntable spin. Ignored when the device asks for reduced motion. */
  autoRotate?: boolean;
  /** Shown when 3D is not available. A real emoji, never a broken-image icon. */
  fallbackEmoji?: string;
  /** Interface language for the small on-screen labels. Defaults to Arabic. */
  lang?: 'ar' | 'en';
}

/* ── WebGL support, probed once per page load ─────────────────────────────
   A module-level cache rather than state: the answer cannot change during a
   session, and probing per viewer would allocate a GL context for each one. */
let webglProbe: boolean | null = null;

export function supportsWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Not a browser (tests, prerender) — treat as unavailable, fallback renders.
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    webglProbe = !!gl && typeof gl.isContextLost === 'function' && !gl.isContextLost();
    // Release the probe context: browsers cap live contexts, and a low-end
    // Android WebView hits that cap with as little as this plus the real one.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}

const STRINGS = {
  ar: {
    loading: 'جارٍ تجهيز المجسّم…',
    hint: 'اسحب لتدويره',
    unavailable: 'المجسّم غير متاح على هذا الجهاز',
  },
  en: {
    loading: 'Setting up the model…',
    hint: 'Drag to turn it',
    unavailable: 'The 3D view is not available on this device',
  },
} as const;

const BOX = 'aspect-square w-full';
/* P72: the world-space line every object rests on; the platter sits
   a hair under it so the two never z-fight when the model touches down. */
const GROUND_Y = -1.0;

/* ── Static fallback (also the no-WebGL path) ─────────────────────────── */
function StaticFallback({
  emoji,
  alt,
  lang,
  className,
}: {
  emoji: string;
  alt: string;
  lang: 'ar' | 'en';
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={[
        'flex flex-col items-center justify-center gap-3',
        'rounded-brand-xl border-2 border-hairline',
        // Warm ground, not the attention colour: a device limitation must not
        // read to a child as something having gone wrong.
        'bg-brand-yellow-wash shadow-brand-sm',
        className ?? BOX,
      ].join(' ')}
    >
      <span className="select-none leading-none text-[clamp(3.5rem,18vw,7rem)]" aria-hidden="true">
        {emoji}
      </span>
      <span className="t-body px-3 text-center font-bold text-brand-yellow-ink">{alt}</span>
      <span className="t-label px-4 text-center text-ink-muted">{STRINGS[lang].unavailable}</span>
    </div>
  );
}

/** Skeleton while the model downloads. Same footprint as the fallback, so the
 *  card does not jump when the mesh arrives. */
function LoadingSkeleton({ alt, lang, className }: { alt: string; lang: 'ar' | 'en'; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={[
        'flex flex-col items-center justify-center gap-4',
        'rounded-brand-xl border-2 border-hairline bg-surface-sunk',
        className ?? BOX,
      ].join(' ')}
    >
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-hairline border-t-brand-blue" />
        <span className="absolute -bottom-1 start-1 h-3 w-3 rounded-full bg-brand-coral" />
        <span className="absolute -bottom-1 end-1 h-3 w-3 rounded-full bg-brand-green" />
      </div>
      <span className="t-small font-bold text-ink-muted">{STRINGS[lang].loading}</span>
      <span className="sr-only-iris">{alt}</span>
    </div>
  );
}

/* ── Error boundary ─────────────────────────────────────────────────────
   Rendered on BOTH sides of the R3F root: around <Canvas> for failures while
   building the canvas itself, and inside it for failures from the model
   loader. `useGLTF` throws a promise, which Suspense owns and this boundary
   correctly ignores; anything else that throws lands here. */
class CanvasBridge extends React.Component<
  { children: React.ReactNode; onError: (error: unknown) => void },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: unknown) => void }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (typeof console !== 'undefined') {
      console.warn('[Object3DViewer] falling back to the static view', error);
    }
    this.props.onError(error);
  }
  render() {
    // Empty 3D content in the canvas tree; the HTML tile comes from the parent.
    return this.state.failed ? <group /> : this.props.children;
  }
}

/* ── Scene pieces ─────────────────────────────────────────────────────── */
function FittedModel({ src, onReady }: { src: string; onReady: () => void }) {
  const gltf = useGLTF(src);

  // Centre and scale whatever the file contains into a ~2-unit cube at the
  // origin, so a 45 mm orange and a 2 m fox frame identically.
  const pivot = useMemo(() => {
    const group = new THREE.Group();
    group.name = 'iris-model-pivot';
    // useGLTF caches the authored scene. Reparenting that cached scene makes
    // a later viewer measure the previous pivot's world transforms; disposing
    // its shared geometry also invalidates the next use. Own a private copy
    // of the scene and GPU resources so returning to an object frames it just
    // like the first visit and cleanup cannot damage the loader's cache.
    const root = gltf.scene.clone(true);
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!(mesh as { isMesh?: boolean }).isMesh) return;
      mesh.geometry = mesh.geometry.clone();
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone();
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    const inner = new THREE.Group();
    inner.add(root);
    inner.position.set(-centre.x, -centre.y, -centre.z);
    group.add(inner);
    const s = 2 / maxDim;
    group.scale.setScalar(s);
    // P72: centring the box at the origin made short objects (an orange, a
    // watermelon slice) float mid-frame above the platter, while tall ones sat
    // almost right. Push the pivot up so the model's own bottom meets the
    // resting line: world bottom after centring is -(size.y * s) / 2.
    group.position.y = GROUND_Y + (size.y * s) / 2;

    // Clay-toy shading. The authored models carry flat brand colours with no
    // roughness map; forcing a matte response keeps them reading as plasticine
    // rather than as metal or glass, whatever the file asked for.
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!(mesh as { isMesh?: boolean }).isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined;
      const list = Array.isArray(material) ? material : material ? [material] : [];
      list.forEach((m) => {
        if (!m || !('metalness' in m)) return;
        m.metalness = Math.min(m.metalness ?? 0, 0.05);
        m.roughness = Math.max(m.roughness ?? 0.6, 0.45);
        m.needsUpdate = true;
      });
    });
    return group;
  }, [gltf]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(
    () => () => {
      // Release GPU buffers when this viewer unmounts (the child moved on).
      pivot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!(mesh as { isMesh?: boolean }).isMesh) return;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(material) ? material : material ? [material] : []).forEach((m) => m?.dispose?.());
      });
    },
    [pivot]
  );

  return <primitive object={pivot} />;
}

/** A soft platter under the object: it grounds the thing so it is not falling
 *  through space, and gives the drag gesture something to pivot around. */
function Platter({ color }: { color: string }) {
  return (
    /* P72: the old single r=1.5 disc read as a hard-edged grey hill. Two
       concentric discs instead: a firm plate the object rests on, and a wide
       faint halo that melts its edge into the wash behind it. */
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y - 0.02, 0]}>
      <mesh>
        <circleGeometry args={[1.02, 48]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, -0.004]}>
        <circleGeometry args={[1.42, 48]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/** Idle motion, when the device allows it. Amplitude is tiny on purpose: this
 *  is a hint of life, not an animation to watch. */
function Breathing({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const group = ref.current;
    if (!group) return;
    if (!enabled) {
      if (group.position.y !== 0) group.position.y = 0;
      return;
    }
    group.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.045;
  });
  return <group ref={ref}>{children}</group>;
}

/* ── Public component ─────────────────────────────────────────────────── */
export default function Object3DViewer({
  src,
  alt,
  className,
  autoRotate = true,
  fallbackEmoji = '🧊',
  lang = 'ar',
}: Object3DViewerProps) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);

  // A different model is a fresh chance to succeed, and starts unloaded.
  useEffect(() => {
    setFailed(false);
    setReady(false);
  }, [src]);

  const webgl = useMemo(() => supportsWebGL(), []);
  const spinning = autoRotate && !reduced;

  // A lost GPU context (tablet backgrounded for hours, driver reset) must not
  // leave a black rectangle where a learning object was.
  useEffect(() => {
    if (!webgl || failed || !ready) return;
    const canvas = canvasHostRef.current?.querySelector('canvas');
    if (!canvas) return;
    const onLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onLost as EventListener);
    return () => canvas.removeEventListener('webglcontextlost', onLost as EventListener);
  }, [webgl, failed, ready]);

  if (!webgl || failed) {
    return <StaticFallback emoji={fallbackEmoji} alt={alt} lang={lang} className={className} />;
  }

  return (
    <div
      className={[
        'relative overflow-hidden rounded-brand-xl border-2 border-hairline',
        // The warm brand ground shows through the transparent canvas, so the
        // 3D stage belongs to the same card family as everything around it.
        'bg-brand-blue-wash shadow-brand-sm',
        className ?? BOX,
      ].join(' ')}
    >
      <div ref={canvasHostRef} className="absolute inset-0" role="img" aria-label={alt}>
        <CanvasBridge onError={() => setFailed(true)}>
          <Canvas
            dpr={[1, 2]}
            // Nobody is animating when the turntable is off: render on demand
            // and let a school tablet's battery rest between drags. Orbit
            // controls call invalidate() on every change, so dragging still
            // tracks the finger exactly.
            frameloop={spinning ? 'always' : 'demand'}
            camera={{ position: [0, 0.62, 3.2], fov: 42, near: 0.1, far: 40 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          >
            <ambientLight intensity={0.85} />
            <hemisphereLight args={['#fff4dd', '#e0cdb0', 0.65]} />
            <directionalLight position={[2.8, 4.2, 3.2]} intensity={1.7} />
            <directionalLight position={[-3.2, 1.4, -2.2]} intensity={0.45} />
            <Platter color="#f0e5d2" />
            <Breathing enabled={spinning}>
              <Suspense fallback={null}>
                <CanvasBridge onError={() => setFailed(true)}>
                  <FittedModel src={src} onReady={() => setReady(true)} />
                </CanvasBridge>
              </Suspense>
            </Breathing>
            <OrbitControls
              makeDefault
              // P72: with objects now resting on the plate, the mass sits a
              // touch under the world origin; aim the turntable there so the
              // object + its plate read centred in the frame.
              target={[0, -0.28, 0]}
              // Children rotate by dragging. Zoom is available but narrow, so
              // a small hand cannot lose the object by zooming it away, and
              // panning is off entirely for the same reason.
              enablePan={false}
              enableZoom
              zoomSpeed={0.45}
              minDistance={2.4}
              maxDistance={4.6}
              minPolarAngle={Math.PI * 0.12}
              maxPolarAngle={Math.PI * 0.82}
              rotateSpeed={reduced ? 0.45 : 0.85}
              enableDamping={!reduced}
              dampingFactor={0.08}
              autoRotate={spinning}
              autoRotateSpeed={0.9}
            />
          </Canvas>
        </CanvasBridge>
      </div>

      {!ready && <LoadingSkeleton alt={alt} lang={lang} className="absolute inset-0" />}

      {/* Gesture hint. Kept under reduced motion — it is information, not
          decoration, and the accessible name is on the canvas host above. */}
      {ready && (
        <span className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="t-label rounded-brand-pill bg-surface/90 px-3 py-1 text-ink-muted">
            {STRINGS[lang].hint}
          </span>
        </span>
      )}
    </div>
  );
}
