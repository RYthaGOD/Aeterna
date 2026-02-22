"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SoulDNA, generateSoulTraits } from "./SoulMaterials";
import { MeshTransmissionMaterial } from "@react-three/drei";

// ------------------------------------------------------------------
// STAGE 0: THE DORMANT POD
// ------------------------------------------------------------------
function DormantPod({ mat }: { mat: any }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            // Very slow, agonizing rotation
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Egg/Pod Silhouette */}
            <mesh scale={[1, 1.3, 1]}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color={mat.base.color} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Industrial Cables Binding It */}
            <mesh rotation={[Math.PI / 4, 0, 0]}>
                <torusGeometry args={[0.62, 0.04, 16, 100]} />
                <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh rotation={[-Math.PI / 4, 0, 0]}>
                <torusGeometry args={[0.62, 0.04, 16, 100]} />
                <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.8, 0.04, 16, 100]} />
                <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.4} />
            </mesh>

            {/* Inner faint heartbeat pulsing from the cracks */}
            <pointLight color={mat.aura.color} intensity={0.5} distance={2} />
        </group>
    );
}

// ------------------------------------------------------------------
// STAGE 1: THE ACTIVE CHRYSALIS (Fluid Core)
// ------------------------------------------------------------------
function ActiveChrysalis({ mat }: { mat: any }) {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.15;
            groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
        }
        if (coreRef.current) {
            // Rapid Beating pattern for the visible Soul
            const scale = 1 + Math.sin(t * 8) * 0.05;
            coreRef.current.scale.set(scale, scale, scale);
            coreRef.current.rotation.x = t;
            coreRef.current.rotation.z = t * 0.5;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Fractured Pod Shells floating apart */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                <meshStandardMaterial color={mat.base.color} metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.8, 0]} rotation={[Math.PI, 0, 0]}>
                <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                <meshStandardMaterial color={mat.base.color} metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
            </mesh>

            {/* Translucent Amniotic Fluid / Ghost Matter Container */}
            <mesh scale={[1, 1.2, 1]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <MeshTransmissionMaterial
                    backside
                    thickness={1.5}
                    roughness={0}
                    transmission={1}
                    chromaticAberration={2}
                    distortion={0.8}
                    temporalDistortion={0.4}
                    color={mat.aura.color}
                />
            </mesh>

            {/* Inner Beating Octahedron Core */}
            <mesh ref={coreRef}>
                <octahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color={mat.accent.color} emissive={mat.accent.color} emissiveIntensity={3} />
            </mesh>

            {/* Emitting blinding light through the water */}
            <pointLight color={mat.accent.color} intensity={4} distance={3} />
        </group>
    );
}

// ------------------------------------------------------------------
// STAGE 2: THE ASCENDED ANGEL
// ------------------------------------------------------------------
function AscendedAngel({ mat }: { mat: any }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(t * 2) * 0.15;
            groupRef.current.rotation.y = t * 0.3;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Core Icosahedron Angel Body */}
            <mesh>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color={mat.accent.color} emissive={mat.accent.color} emissiveIntensity={5} />
            </mesh>

            {/* Glass Wings / Geometric Feathers */}
            <group position={[0, 0, -0.2]}>
                <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, -Math.PI / 6]}>
                    <coneGeometry args={[0.2, 2, 3]} />
                    <MeshTransmissionMaterial backside thickness={0.5} transmission={1} color={mat.aura.color} chromaticAberration={2} />
                </mesh>
                <mesh position={[-0.7, 0.4, 0]} rotation={[0, 0, Math.PI / 6]}>
                    <coneGeometry args={[0.2, 2, 3]} />
                    <MeshTransmissionMaterial backside thickness={0.5} transmission={1} color={mat.aura.color} chromaticAberration={2} />
                </mesh>
                <mesh position={[1.0, -0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
                    <coneGeometry args={[0.15, 1.5, 3]} />
                    <MeshTransmissionMaterial backside thickness={0.5} transmission={1} color={mat.aura.color} chromaticAberration={2} />
                </mesh>
                <mesh position={[-1.0, -0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <coneGeometry args={[0.15, 1.5, 3]} />
                    <MeshTransmissionMaterial backside thickness={0.5} transmission={1} color={mat.aura.color} chromaticAberration={2} />
                </mesh>
            </group>

            {/* Orbiting Dead Pod Shells (Moons) */}
            <OrbitingShells mat={mat} />
            <pointLight color={mat.aura.color} intensity={10} distance={10} />
        </group>
    );
}

function OrbitingShells({ mat }: { mat: any }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.x = state.clock.elapsedTime * 0.4;
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.7;
        }
    });
    return (
        <group ref={groupRef}>
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[
                    Math.sin(i * Math.PI / 4) * 2.2,
                    Math.cos(i * Math.PI / 4) * 2.2,
                    (i % 2 === 0) ? 0.5 : -0.5
                ]} rotation={[Math.random(), Math.random(), 0]}>
                    <boxGeometry args={[0.15, 0.15, 0.15]} />
                    <meshStandardMaterial color={mat.base.color} metalness={1} roughness={0.1} />
                </mesh>
            ))}
        </group>
    );
}

// ------------------------------------------------------------------
// PROCEDURAL EFFECTS
// ------------------------------------------------------------------
function DigitalRain({ color }: { color: string }) {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 300;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let seed = 1;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (random() - 0.5) * 6;     // x spread
            pos[i * 3 + 1] = (random() - 0.5) * 8; // y spread
            pos[i * 3 + 2] = (random() - 0.5) * 6; // z spread
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < count; i++) {
                positions[i * 3 + 1] -= delta * 3; // fall speed
                if (positions[i * 3 + 1] < -4) positions[i * 3 + 1] = 4; // recycle
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
            <pointsMaterial color={color} size={0.06} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>
    );
}

// ------------------------------------------------------------------
// MAIN CONTROLLER
// ------------------------------------------------------------------
export function SpiritGeometry({ mat, dna, stage }: { mat: any, dna: SoulDNA, stage: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const traits = mat.traits || generateSoulTraits(dna);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (groupRef.current) {
            // Base floating animation for all stages
            groupRef.current.position.y = 1.5 + Math.sin(t * 1) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, 1.5, 0]} scale={traits.bodyScale}>

            {/* The 3-Tier Bio-Digital Chrysalis Evolution */}
            {stage === 0 && <DormantPod mat={mat} />}
            {stage === 1 && <ActiveChrysalis mat={mat} />}
            {stage >= 2 && <AscendedAngel mat={mat} />}

            {/* Horizontal Uniqueness / Procedural Data Footprint */}
            {(dna.txCount || 0) > 20 && <DigitalRain color={mat.accent.color} />}

        </group>
    );
}
