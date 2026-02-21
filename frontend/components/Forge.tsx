"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float, Stars } from "@react-three/drei";
import { useState, Suspense, useRef } from "react";
import * as THREE from "three";
import { SoulDNA, generateSoulMaterial } from "./forge/SoulMaterials";
import { SpiritGeometry } from "./forge/SpiritGeometry";
import { useFrame } from "@react-three/fiber";
import Effects from "./Effects"; // POST-PROCESSING LAYER
import { useWallet } from "@solana/wallet-adapter-react";

function Satellites({ count, color }: { count: number, color: string }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
                <mesh key={i} position={[
                    Math.sin(i * 0.5) * 3,
                    Math.cos(i * 0.3) * 2,
                    Math.cos(i * 0.5) * 3
                ]}>
                    <octahedronGeometry args={[0.1]} />
                    {/* HIGH EMISSIVE FOR BLOOM */}
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={4.0}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    )
}

function AuraSphere({ color }: { color: string }) {
    return (
        <mesh scale={1.5}>
            <sphereGeometry args={[1, 64, 64]} />
            {/* SIMULATED VOLUMETRIC GLOW */}
            <meshPhysicalMaterial
                color={color}
                transparent
                opacity={0.1}
                roughness={0}
                metalness={0.1}
                transmission={1}
                thickness={2}
                emissive={color}
                emissiveIntensity={0.5}
            />
        </mesh>
    );
}

function AvatarModel({ dna, mat }: { dna: SoulDNA, mat: any }) {
    let archetype = "SPARK";
    if (dna.walletAgeDays && dna.walletAgeDays > 365) archetype = "MONOLITH";
    else if (dna.tokenCount && dna.tokenCount > 5) archetype = "CURATOR";
    else if (dna.wealthUsd && dna.wealthUsd > 10000) archetype = "CONSTRUCT";

    return (
        <group position={[0, -0.5, 0]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* CORE ARTEFACT */}
                <SpiritGeometry mat={mat} dna={dna} archetype={archetype} />

                {/* INNER GLOW */}
                <pointLight color={mat.core.color} intensity={5} distance={3} decay={2} />
            </Float>

            {/* ORBITING DATA POINTS */}
            <Satellites count={dna.tokenCount || 0} color={mat.accent.color} />

            {/* OUTER AURA */}
            <group scale={[1.2, 1.2, 1.2]}>
                <AuraSphere color={mat.aura.color} />
            </group>
        </group>
    );
}

export default function Forge({ xpLevel = 0, wealthTier = 0, dna: externalDna }: { xpLevel?: number, wealthTier?: number, dna?: SoulDNA }) {

    const { publicKey } = useWallet();
    const address = publicKey ? publicKey.toString() : "AETERNA_UNCONNECTED_SOUL";

    const [internalDna] = useState<SoulDNA>({
        walletAddress: address,
        walletAgeDays: xpLevel > 10 ? 400 : 10,
        wealthUsd: wealthTier > 0 ? 50000 : 0,
        txCount: 12,
        tokenCount: 8,
        voteCount: 3,
        burnCount: 1
    });

    const dna = { ...internalDna, ...externalDna, walletAddress: address };
    const mat = generateSoulMaterial(dna);

    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 7], fov: 35 }} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>

                {/* POST-PROCESSING (THE JUICE) */}
                <Effects />

                {/* CINEMATIC LIGHTING */}
                <ambientLight intensity={0.2} />
                <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={2} color="#ffffff" />
                <pointLight position={[-10, -5, -10]} intensity={5} color={mat.accent.color} />

                <Suspense fallback={null}>
                    <Environment preset="city" />

                    {/* STARS BACKGROUND - Adds depth behind the bloom */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    <AvatarModel dna={dna} mat={mat} />

                    <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2.5} far={10} color="#000000" />

                    {/* RESTRICTED CONTROLS FOR CINEMATIC FEEL */}
                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 1.5}
                        autoRotate
                        autoRotateSpeed={0.5}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
