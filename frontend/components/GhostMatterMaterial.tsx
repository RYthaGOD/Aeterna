"use client";

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const GhostMatterMaterialImpl = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color("#ffffff"),
        uGlowColor: new THREE.Color("#4f46e5"),
        uOpacity: 0.5,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        // Subtle vertex displacement for "living" feel
        vec3 pos = position;
        pos.x += sin(pos.y * 10.0 + uTime * 2.0) * 0.02;
        pos.y += cos(pos.z * 10.0 + uTime * 2.0) * 0.02;
        
        vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform float uOpacity;

    void main() {
        // Fresnel Effect (Rim lighting)
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
        
        // Pulsing glow
        float pulse = 0.8 + 0.2 * sin(uTime * 3.0);
        vec3 finalColor = mix(uColor, uGlowColor, fresnel * pulse);
        
        gl_FragColor = vec4(finalColor, uOpacity + fresnel * 0.5);
    }
    `
);

extend({ GhostMatterMaterialImpl });

declare module "@react-three/fiber" {
    interface ThreeElements {
        ghostMatterMaterialImpl: any;
    }
}

export default GhostMatterMaterialImpl;
