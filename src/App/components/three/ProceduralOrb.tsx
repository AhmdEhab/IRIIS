/**
 * ProceduralOrb — a genuine 3D mesh (icosphere with a glossy physical
 * material) lit and orbitable exactly like the GLB viewer. Used for color
 * concepts, where the object IS a sphere in the given hue. Real geometry,
 * real camera, no CSS fakery.
 */
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function ProceduralOrb({ color, alt }: { color: string; alt: string }) {
    return (
        <div
            role="img"
            aria-label={alt}
            style={{ width: '100%', height: '100%', minHeight: 200, borderRadius: 26, overflow: 'hidden' }}
        >
            <Canvas camera={{ position: [0, 0.2, 3.1], fov: 42 }} dpr={[1, 2]}>
                <ambientLight intensity={0.85} />
                <directionalLight position={[3, 4, 5]} intensity={1.15} />
                <pointLight position={[-3, -2, -2]} intensity={0.35} />
                <mesh>
                    <icosahedronGeometry args={[1.15, 5]} />
                    <meshPhysicalMaterial color={color} roughness={0.24} clearcoat={0.8} clearcoatRoughness={0.25} />
                </mesh>
                <OrbitControls enablePan={false} enableZoom minDistance={2} maxDistance={4.6} />
            </Canvas>
        </div>
    );
}

export default ProceduralOrb;
