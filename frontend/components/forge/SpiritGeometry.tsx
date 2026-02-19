import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SoulDNA, generateSoulTraits } from "./SoulMaterials";
import { CrownGeometry, WingsGeometry, ShieldGeometry, SwordGeometry, MaskGeometry, PauldronsGeometry, RunesGeometry } from "./TraitGeometries";

// ------------------------------------------------------------------
// HELPER COMPONENTS
// ------------------------------------------------------------------

function DigitalRain({ color }: { color: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate random positions for rain (Memoized to prevent hydration mismatch)
    const count = 200;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let seed = 1;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (random() - 0.5) * 4; // x
            pos[i * 3 + 1] = (random() - 0.5) * 6; // y
            pos[i * 3 + 2] = (random() - 0.5) * 4; // z
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < count; i++) {
                // Move down
                positions[i * 3 + 1] -= delta * 2;
                // Reset if too low
                if (positions[i * 3 + 1] < -3) {
                    positions[i * 3 + 1] = 3;
                }
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial color={color} size={0.05} transparent opacity={0.6} />
        </points>
    );
}

function GodRays() {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y -= 0.005;
            // Pulse opacity
            const opacity = 0.3 + Math.sin(state.clock.elapsedTime) * 0.1;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 4, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[2, 6, 32, 1, true]} />
            <meshBasicMaterial color="#ffd700" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
}

// ------------------------------------------------------------------
// MAIN SPIRIT GEOMETRY
// ------------------------------------------------------------------
export function SpiritGeometry({ mat, dna, archetype }: { mat: any, dna: SoulDNA, archetype: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const leftHandRef = useRef<THREE.Group>(null);
    const rightHandRef = useRef<THREE.Group>(null);

    // Hash-based traits for uniqueness
    // Ensure we don't call hooks conditionally by computing traits outside effect if necessary, 
    // but generateSoulTraits is pure so it's fine.
    // However, if mat.traits is missing, we generate it. 
    // Ideally mat should already have it, but for safety:
    const traits = mat.traits || generateSoulTraits(dna);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            // Idle Floating ("Breathing")
            groupRef.current.position.y = 1.5 + Math.sin(t * 0.5) * 0.1;
        }
        if (bodyRef.current) {
            bodyRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
        }
        if (headRef.current) {
            headRef.current.rotation.y = Math.sin(t * 0.3) * 0.2;
            headRef.current.rotation.x = Math.sin(t * 0.5) * 0.05;
        }
        if (leftHandRef.current && rightHandRef.current) {
            leftHandRef.current.position.y = -0.5 + Math.sin(t * 1 + 1) * 0.1;
            rightHandRef.current.position.y = -0.5 + Math.sin(t * 1 + 2) * 0.1;
        }
    });

    // ARCHETYPE VISUALS
    const isMonolith = archetype === "MONOLITH";
    const isConstruct = archetype === "CONSTRUCT";
    const isCurator = archetype === "CURATOR";

    return (
        <group ref={groupRef} position={[0, 1.5, 0]} scale={traits.bodyScale}>
            {/* HEAD */}
            <group ref={headRef} position={[0, 0.8, 0]}>
                <mesh>
                    {/* Monolith gets a cube head, others get Sphere */}
                    {isMonolith ? <boxGeometry args={[0.4, 0.5, 0.4]} /> : <sphereGeometry args={[0.25, 32, 32]} />}
                    <meshStandardMaterial {...mat.base} />
                </mesh>
                {/* Eyes / Visor */}
                <mesh position={[0, 0, isMonolith ? 0.21 : 0.22]}>
                    <boxGeometry args={[0.3, 0.05, 0.05]} />
                    <meshStandardMaterial color={mat.aura.color} emissive={mat.aura.color} emissiveIntensity={2} />
                </mesh>
                {/* Halo for high level */}
                {(dna.walletAgeDays || 0) > 100 && (
                    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
                        <torusGeometry args={[0.3, 0.02, 16, 32]} />
                        <meshStandardMaterial color={mat.accent.color} emissive={mat.accent.color} />
                    </mesh>
                )}
            </group>

            {/* TORSO */}
            <group ref={bodyRef}>
                <mesh position={[0, 0, 0]}>
                    {/* Construct gets Cylinder, Monolith gets Box, Others get Dodecahedron */}
                    {isMonolith ? (
                        <boxGeometry args={[0.6, 0.8, 0.4]} />
                    ) : isConstruct ? (
                        <cylinderGeometry args={[0.1, 0.3, 0.8, 8]} />
                    ) : (
                        <dodecahedronGeometry args={[0.4]} />
                    )}
                    <meshStandardMaterial {...mat.base} />
                </mesh>

                {/* Core/Heart */}
                <mesh position={[0, 0.1, 0.2]}>
                    <octahedronGeometry args={[0.1]} />
                    {/* @ts-ignore */}
                    <glitchShaderMaterial color={mat.aura.color} instability={mat.instability} />
                </mesh>

                {/* Armor Plates (Wealth) */}
                {mat.base.metalness > 0.6 && (
                    <group>
                        <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, -0.2]}>
                            <boxGeometry args={[0.2, 0.4, 0.4]} />
                            <meshStandardMaterial {...mat.accent} />
                        </mesh>
                        <mesh position={[-0.3, 0.2, 0]} rotation={[0, 0, 0.2]}>
                            <boxGeometry args={[0.2, 0.4, 0.4]} />
                            <meshStandardMaterial {...mat.accent} />
                        </mesh>
                    </group>
                )}
            </group>

            {/* FLOATING HANDS */}
            <group ref={leftHandRef} position={[-0.6, -0.5, 0]}>
                <mesh>
                    <boxGeometry args={[0.15, 0.4, 0.15]} />
                    <meshStandardMaterial {...mat.base} />
                </mesh>
                {isConstruct && <DigitalRain color={mat.accent.color} />}
            </group>

            <group ref={rightHandRef} position={[0.6, -0.5, 0]}>
                <mesh>
                    <boxGeometry args={[0.15, 0.4, 0.15]} />
                    <meshStandardMaterial {...mat.base} />
                </mesh>
            </group>

            {/* God Rays for Monolith */}
            {isMonolith && <GodRays />}

            {/* Curator Gallery Frame (Behind) */}
            {isCurator && (
                <group position={[0, 0, -1]}>
                    <mesh>
                        <planeGeometry args={[2, 2.5]} />
                        <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, 0, 0.02]}>
                        <boxGeometry args={[1.8, 2.3, 0.05]} />
                        <meshStandardMaterial color={mat.accent.color} />
                    </mesh>
                </group>
            )}

            {/* TRAITS (Unlockables) */}

            {/* 1. Crown of Governance (Vote > 0) */}
            {(dna.voteCount || 0) > 0 && <CrownGeometry color={mat.accent.color} />}

            {/* 2. Wings of Velocity (Tx > 50) */}
            {(dna.txCount || 0) > 50 && <WingsGeometry color={mat.aura.color} />}

            {/* 3. Shield of HODL (Age > 365) */}
            {(dna.walletAgeDays || 0) > 365 && <ShieldGeometry color="#50C878" />}

            {/* 4. Sword of Chaos (Instability > 0.5) */}
            {(mat.instability || 0) > 0.5 && <SwordGeometry color={mat.aura.color} />}

            {/* 5. Mask of Identity (Default for everyone for now if privacy is enabled, or based on hash) */}
            {/* Simple logic: 50% chance to have a mask based on hash */}
            {traits.hueShift > 180 && <MaskGeometry color={mat.base.color} />}

            {/* 6. Pauldrons (High Wealth/Metalness) */}
            {mat.base.metalness > 0.7 && <PauldronsGeometry color={mat.accent.color} />}

            {/* 7. Runes of Mastery (High Governance) */}
            {(dna.voteCount || 0) > 5 && <RunesGeometry color={mat.aura.color} />}

        </group>
    );
}
