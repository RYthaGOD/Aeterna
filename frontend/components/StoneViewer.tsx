"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, MeshTransmissionMaterial, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import GhostMatterMaterialImpl from "./GhostMatterMaterial";

interface StoneViewerProps {
    mood?: 'happy' | 'hungry' | 'sleepy' | 'neutral';
}

function SceneContent({ currentMood, meshRef, ghostRef }: any) {
    // ANIMATION LOOP
    useFrame((state) => {
        if (ghostRef.current) {
            ghostRef.current.uTime = state.clock.elapsedTime;
        }
    });

    return (
        <>
            <Environment preset="city" />

            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh ref={meshRef}>
                    {/* The Prism Shape (Octahedron for a gem-like look) */}
                    <octahedronGeometry args={[1, 0]} />

                    {/* THE GOD MATERIAL (Glassmorphism) */}
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={1}
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        chromaticAberration={1}
                        anisotropicBlur={0.2}
                        distortion={0.4}
                        distortionScale={0.5}
                        temporalDistortion={0.1}
                        color={currentMood.color}
                    />

                    {/* GHOST MATTER OVERLAY */}
                    <mesh scale={1.05}>
                        <octahedronGeometry args={[1, 0]} />
                        <ghostMatterMaterialImpl
                            ref={ghostRef}
                            transparent
                            uColor={new THREE.Color(currentMood.color)}
                            uGlowColor={new THREE.Color("#4f46e5")}
                            uOpacity={0.2}
                        />
                    </mesh>
                </mesh>
            </Float>

            {/* Particle Effects for "Magic" feel */}
            <Sparkles count={50} scale={3} size={2} speed={0.4} opacity={0.5} color={currentMood.color} />

            <OrbitControls
                enableZoom={false}
                autoRotate
                autoRotateSpeed={currentMood.speed * 5}
                maxPolarAngle={Math.PI / 1.5}
                minPolarAngle={Math.PI / 3}
            />
        </>
    );
}

export default function StoneViewer({ mood = 'neutral' }: StoneViewerProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const ghostRef = useRef<any>(null);

    const moodConfig: any = {
        happy: { color: "#FFD700", speed: 0.5 },
        hungry: { color: "#FF4500", speed: 0.2 },
        sleepy: { color: "#1E90FF", speed: 0.1 },
        neutral: { color: "#FFFFFF", speed: 0.2 }
    };

    const currentMood = moodConfig[mood];

    return (
        <div className="w-full h-[600px] relative">
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <SceneContent currentMood={currentMood} meshRef={meshRef} ghostRef={ghostRef} />
            </Canvas>

            {/* Overlay text (Cinematic) */}
            <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
                <h3 className="text-white/30 text-xs tracking-[0.5em] font-light uppercase">
                    System State: {mood.toUpperCase()}
                </h3>
            </div>
        </div>
    );
}
