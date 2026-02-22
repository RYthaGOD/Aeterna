import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";

// ------------------------------------------------------------------
// GENERATIVE SHADER MATERIAL (The "Ethereal" Look)
// ------------------------------------------------------------------
export const AuraShaderMaterial = shaderMaterial(
    {
        time: 0,
        color: new THREE.Color(0.2, 0.0, 0.5),
        uPattern: 0 // 0 = Noise, 1 = Voronoi, 2 = Ripple
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float time;
    uniform vec3 color;
    uniform int uPattern;
    varying vec2 vUv;
    varying vec3 vNormal;
    
    // VORONOI UTILS
    vec2 random2( vec2 p ) {
        return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
    }

    float voronoi(vec2 v) {
        vec2 i = floor(v);
        vec2 f = fract(v);
        float m_dist = 1.0;
        for (int y= -1; y <= 1; y++) {
            for (int x= -1; x <= 1; x++) {
                vec2 neighbor = vec2(float(x),float(y));
                vec2 point = random2(i + neighbor);
                point = 0.5 + 0.5*sin(time + 6.2831*point);
                vec2 diff = neighbor + point - f;
                float dist = length(diff);
                m_dist = min(m_dist, dist);
            }
        }
        return m_dist;
    }

    void main() {
      // Frenel Glow Effect
      float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
      
      float pattern = 0.0;

      if (uPattern == 0) {
          // 0: NOISE (Cloudy)
          pattern = sin(vUv.y * 20.0 + time * 2.0) * 0.1;
      } else if (uPattern == 1) {
          // 1: VORONOI (Cellular / Tech)
          float v = voronoi(vUv * 10.0);
          pattern = (1.0 - v) * 0.3;
      } else if (uPattern == 2) {
          // 2: RIPPLE (Spirit / Zen)
          vec2 center = vec2(0.5);
          float dist = distance(vUv, center);
          pattern = sin(dist * 50.0 - time * 5.0) * 0.1;
      }
      
      gl_FragColor = vec4(color + intensity + pattern, 1.0); 
      gl_FragColor.a = 0.3 + intensity; // Transparent
    }
  `
);

// ------------------------------------------------------------------
// GLITCH SHADER MATERIAL (Vertex Displacement)
// ------------------------------------------------------------------
export const GlitchShaderMaterial = shaderMaterial(
    {
        time: 0,
        color: new THREE.Color(0.2, 0.0, 0.5),
        instability: 0.0 // 0 to 1 (Driven by txCount/Entropy)
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDistortion;
    
    uniform float time;
    uniform float instability;

    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) { 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i); 
        vec4 p = permute( permute( permute( 
                  i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857; 
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );  
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        return 1.0 * (dot(p0, i.z < 0.0 ? -x0 : x0) + dot(p1, i.z < 0.0 ? -x1 : x1) + dot(p2, i.z < 0.0 ? -x2 : x2) + dot(p3, i.z < 0.0 ? -x3 : x3)); // Simplified logic for brevity, snoise usually returns -1 to 1
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // VERTEX DISPLACEMENT based on Noise & Instability
      float noiseVal = sin(position.x * 10.0 + time * 5.0) * cos(position.y * 10.0 + time * 2.0);
      float displacement = noiseVal * instability * 0.2; // Max 0.2 units displacement
      
      // Glitch snap: Ocassionally snap vertices far out
      if (mod(time, 2.0) > 1.9 && instability > 0.5) {
          displacement += sin(position.z * 50.0) * 0.5;
      }

      vec3 newPosition = position + normal * displacement;
      vDistortion = displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vDistortion;
    
    void main() {
      float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
      
      // Color shift based on distortion (Hot spots)
      vec3 finalColor = color;
      if (vDistortion > 0.05) {
          finalColor = mix(color, vec3(1.0, 1.0, 1.0), 0.5); // Highlight distorted areas
      }

      gl_FragColor = vec4(finalColor + intensity, 1.0);
      gl_FragColor.a = 0.8;
    }
  `
);

extend({ AuraShaderMaterial, GlitchShaderMaterial });

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
export interface SoulDNA {
    walletAddress?: string; // NEW: The Source of Uniqueness
    walletAgeDays?: number;
    txCount?: number;
    tokenCount?: number;
    wealthUsd?: number;
    burnCount?: number;
    voteCount?: number; // (Also Governance)
    instability?: number;
}

export interface SoulTraits {
    hueShift: number; // 0-360
    bodyScale: [number, number, number];
    auraPattern: number; // 0=Noise, 1=Voronoi, 2=Ripple
}

// ------------------------------------------------------------------
// LOGIC
// ------------------------------------------------------------------

// Deterministic Random (Pseudo-Random) based on seed
// Simple Linear congruential generator
const seededRandom = (seed: number) => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// Extract a seed from a wallet string
const getSeedFromAddress = (address: string) => {
    let seed = 0;
    if (!address) return 0;
    for (let i = 0; i < address.length; i++) {
        seed = ((seed << 5) - seed) + address.charCodeAt(i);
        seed |= 0; // Convert to 32bit integer
    }
    return Math.abs(seed);
}

// GENERATE UNIQUE TRAITS FROM HASH
export const generateSoulTraits = (dna: SoulDNA): SoulTraits => {
    const seed = getSeedFromAddress(dna.walletAddress || "SOLANA");

    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 1);
    const r3 = seededRandom(seed + 2);

    // Map r3 to 0, 1, or 2
    let pattern = 0;
    if (r3 > 0.66) pattern = 1;
    else if (r3 > 0.33) pattern = 2;

    return {
        hueShift: r1 * 360, // Shift colors full range
        bodyScale: [0.9 + r2 * 0.2, 0.9 + r3 * 0.2, 0.9 + r2 * 0.2], // Randomize width/height slightly
        auraPattern: pattern
    };
}

export const generateSoulMaterial = (dna: SoulDNA) => {
    const age = dna.walletAgeDays || 0;
    const wealth = dna.wealthUsd || 0;
    const activity = dna.txCount || 0;
    const burns = dna.burnCount || 0;
    const traits = generateSoulTraits(dna);

    // Instability Logic
    let instability = Math.min(activity / 100, 1.0);
    if (burns > 0) {
        // Scarring stabilizes the glitch but "kills" the vibe
        instability = Math.max(instability - (burns * 0.1), 0);
    }

    // BASE MATERIAL (Age)
    const baseColor = new THREE.Color("#ffffff");
    let roughness = 0.5;
    let metalness = 0.5;
    let opacity = 1.0;
    let transparent = false;

    if (age > 365) {
        baseColor.set("#1a1a1a"); // Monolith Black
        roughness = 0.1;
        metalness = 0.9;
    } else {
        baseColor.set("#e2e8f0"); // Spark White
        roughness = 0.1;
        metalness = 0.1;
        opacity = 0.6;
        transparent = true;
    }

    // SCARRING LOGIC (Burn)
    if (burns > 0) {
        const scarFactor = Math.min(burns * 0.2, 0.8);
        baseColor.lerp(new THREE.Color("#000000"), scarFactor);
        roughness = Math.min(roughness + scarFactor, 1.0);
        metalness = Math.max(metalness - scarFactor, 0.0);
        transparent = false; // Scars are opaque
        opacity = 1.0;
    }

    // ACCENT (Wealth)
    const accentColorObj = new THREE.Color("#64748b");
    if (wealth > 5000) {
        accentColorObj.set("#FFD700"); // Gold
        metalness = 1.0;
        roughness = 0.2;
    } else if (wealth > 1000) {
        accentColorObj.set("#C0C0C0"); // Silver
        metalness = 0.8;
    }

    // Apply Hue Shift from Genetics
    accentColorObj.offsetHSL(traits.hueShift / 360, 0, 0);

    // AURA
    const auraColorObj = new THREE.Color("#4f46e5");
    let auraSpeed = 1.0;
    if (activity > 100) {
        auraColorObj.set("#ef4444"); // Red
        auraSpeed = 3.0;
    } else if (activity > 50) {
        auraColorObj.set("#f59e0b"); // Orange
        auraSpeed = 2.0;
    }

    // Apply Hue Shift from Genetics
    auraColorObj.offsetHSL(traits.hueShift / 360, 0, 0);

    // Burns dim the aura
    if (burns > 5) {
        auraColorObj.set("#555555"); // Dead grey
        auraSpeed = 0.2;
    }

    return {
        base: { color: baseColor.getStyle(), roughness, metalness, opacity, transparent },
        accent: { color: accentColorObj.getStyle() },
        aura: { color: auraColorObj.getStyle(), speed: auraSpeed },
        instability: instability,
        traits: traits // PASS TRAITS DOWN
    };
};
