"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Vertex Shader: Standard Full-Screen Plane
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment Shader: Slow drifting aurora noise
const fragmentShader = `
uniform float uTime;
varying vec2 vUv;

// Simplex Noise (Simplified for brevity)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  
  // Slow movement
  float time = uTime * 0.1;
  
  // Noise layers
  float n1 = snoise(uv * 2.0 + time);
  float n2 = snoise(uv * 4.0 - time * 0.5);
  
  // Color Mixing (Deep Space / Aurora)
  vec3 colorA = vec3(0.05, 0.0, 0.1); // Deep Purple
  vec3 colorB = vec3(0.0, 0.2, 0.2); // Teal
  vec3 colorC = vec3(0.1, 0.0, 0.2); // Magenta tint
  
  float mix1 = smoothstep(-1.0, 1.0, n1);
  float mix2 = smoothstep(-1.0, 1.0, n2);
  
  vec3 finalColor = mix(colorA, colorB, mix1);
  finalColor = mix(finalColor, colorC, mix2);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function Aurora() {
    const meshRef = useRef<THREE.Mesh>(null);
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
        }),
        []
    );

    useFrame((state) => {
        if (meshRef.current) {
            // @ts-ignore
            meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[10, 10]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
            />
        </mesh>
    );
}

export default function LivingBackground() {
    return (
        <div className="fixed inset-0 -z-50 w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Aurora />
            </Canvas>
        </div>
    );
}
