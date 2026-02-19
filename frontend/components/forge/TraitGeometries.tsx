import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function CrownGeometry({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            groupRef.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0.6, 0]}>
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]} position={[0, 0, 0]}>
                    <mesh position={[0, 0, 0.25]}>
                        <coneGeometry args={[0.05, 0.2, 4]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
                    </mesh>
                </mesh>
            ))}
        </group>
    );
}

export function WingsGeometry({ color }: { color: string }) {
    return (
        <group position={[0, 0, -0.2]}>
            <mesh position={[-0.5, 0.2, 0]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.05, 0.8, 0.2]} />
                <meshStandardMaterial color={color} transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.8, 0.4, 0]} rotation={[0, 0, 0.8]} scale={0.8}>
                <boxGeometry args={[0.05, 0.8, 0.2]} />
                <meshStandardMaterial color={color} transparent opacity={0.6} />
            </mesh>

            <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.05, 0.8, 0.2]} />
                <meshStandardMaterial color={color} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.8, 0.4, 0]} rotation={[0, 0, -0.8]} scale={0.8}>
                <boxGeometry args={[0.05, 0.8, 0.2]} />
                <meshStandardMaterial color={color} transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

export function ShieldGeometry({ color }: { color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });
    return (
        <group position={[0.8, 0, 0.2]} rotation={[0, -0.5, 0]}>
            <mesh ref={meshRef}>
                <cylinderGeometry args={[0.3, 0.1, 0.6, 6]} />
                <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}

export function SwordGeometry({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            // Unstable vibration
            groupRef.current.position.x = -0.8 + (Math.random() - 0.5) * 0.02;
        }
    });

    return (
        <group ref={groupRef} position={[-0.8, 0, 0.2]} rotation={[0, 0.5, 0.5]}>
            <mesh position={[0, 0.3, 0]}>
                <coneGeometry args={[0.1, 0.8, 4]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} wireframe />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.2]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}

// NEW TRAIT: Mask (Identity/Privacy)
export function MaskGeometry({ color }: { color: string }) {
    return (
        <group position={[0, 0.8, 0.26]} rotation={[0, 0, 0]}>
            {/* Simple Geometric Vizor */}
            <mesh>
                <planeGeometry args={[0.25, 0.15]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// NEW TRAIT: Pauldrons (Strength/Defense)
export function PauldronsGeometry({ color }: { color: string }) {
    return (
        <group>
            {/* Left Shoulder */}
            <mesh position={[-0.35, 0.4, 0]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.25, 0.3, 0.3]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Shoulder */}
            <mesh position={[0.35, 0.4, 0]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.25, 0.3, 0.3]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    )
}

// NEW TRAIT: Floating Runes (Protocol Mastery / Governance)
export function RunesGeometry({ color }: { color: string }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = -state.clock.elapsedTime * 0.3;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} position={[Math.sin(i * Math.PI / 4) * 0.8, 0, Math.cos(i * Math.PI / 4) * 0.8]} rotation={[0, -i * Math.PI / 4, 0]}>
                    <planeGeometry args={[0.1, 0.1]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    )
}
