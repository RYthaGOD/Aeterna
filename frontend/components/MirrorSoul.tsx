"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Text } from "@react-three/drei";
import * as THREE from "three";

export default function MirrorSoul({ mood = "NEUTRAL" }: { mood?: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Mood-based color mapping
    const colors = useMemo(() => ({
        HAPPY: "#818cf8", // Indigo
        HUNGRY: "#f87171", // Red
        SLEEPY: "#60a5fa", // Blue
        NEUTRAL: "#e2e8f0" // Slate
    }), []);

    const currentColor = colors[mood as keyof typeof colors] || colors.NEUTRAL;

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Slow, hypnotic rotation
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.z += delta * 0.1;

            // Floating animation logic integrated into materials via distortion soon
        }
    });

    return (
        <group>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh ref={meshRef} castShadow receiveShadow>
                    <octahedronGeometry args={[2, 0]} />

                    {/* THE MASTER MATERIAL - "GHOST MATTER" */}
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={5}
                        thickness={2}
                        roughness={0.1}
                        transmission={1}
                        chromaticAberration={1.5} // High for "Premium" lens feel
                        anisotropy={1}
                        distortion={0.8}
                        distortionScale={0.5}
                        temporalDistortion={0.5}
                        color={currentColor}
                        //@ts-ignore
                        emissive={currentColor}
                        emissiveIntensity={mood === "NEUTRAL" ? 0.2 : 0.8}
                    />
                </mesh>

                {/* INNER CORE GLOW */}
                <pointLight color={currentColor} intensity={5} distance={5} />
            </Float>

            {/* SUBTLE DATA RING (REPLACING SATELLITES) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <torusGeometry args={[3.5, 0.005, 16, 100]} />
                <meshBasicMaterial color={currentColor} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}
