"use client";

import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

export default function Effects() {
    return (
        <EffectComposer disableNormalPass>
            {/* 1. BLOOM: The "Glow" - Crucial for "Energy" feel */}
            <Bloom
                luminanceThreshold={1.2} // Only very bright things glow
                mipLevels={9} // Smoothness
                intensity={1.5} // Strength
            />

            {/* 2. NOISE: The "Film Grain" - Removes digital sterileness */}
            {/* BlendFunction.OVERLAY is subtle */}
            <Noise opacity={0.1} blendFunction={BlendFunction.OVERLAY} />

            {/* 3. CHROMATIC ABERRATION: The "Lens" feel - Rainbow edges */}
            <ChromaticAberration
                offset={new THREE.Vector2(0.002, 0.002)}
                radialModulation={false}
                modulationOffset={0}
            />

            {/* 4. VIGNETTE: Focuses the eye */}
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
    );
}
