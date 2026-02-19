"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import Effects from "./Effects";
import { Environment, ContactShadows, Stars } from "@react-three/drei";

interface RebornEngineProps {
    children: React.ReactNode;
}

export default function RebornEngine({ children }: RebornEngineProps) {
    return (
        <div className="fixed inset-0 z-0 bg-black">
            <Canvas
                shadows
                camera={{ position: [0, 0, 10], fov: 35 }}
                gl={{
                    antialias: false,
                    toneMapping: THREE.ReinhardToneMapping,
                    toneMappingExposure: 1.2,
                    powerPreference: "high-performance"
                }}
                dpr={[1, 2]} // Performance optimization
            >
                <color attach="background" args={["#000000"]} />

                {/* CINEMATIC LIGHTING STICK */}
                <ambientLight intensity={0.15} />
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} color="#4f46e5" intensity={4} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    {/* THE ACTUAL 3D CONTENT */}
                    {children}

                    <ContactShadows
                        position={[0, -3.5, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2}
                        far={10}
                        color="#000000"
                    />
                </Suspense>

                {/* POST PROCESSING LAYER */}
                <Effects />
            </Canvas>
        </div>
    );
}
