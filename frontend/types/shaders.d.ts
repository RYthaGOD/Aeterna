import { Object3DNode } from "@react-three/fiber";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            auraShaderMaterial: Object3DNode<THREE.ShaderMaterial, typeof THREE.ShaderMaterial> & {
                uPattern?: number;
                color?: string;
                time?: number;
            };
            glitchShaderMaterial: Object3DNode<THREE.ShaderMaterial, typeof THREE.ShaderMaterial> & {
                instability?: number;
                color?: string;
                time?: number;
            };
        }
    }
}
