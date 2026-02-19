export enum ActionType {
    SWAP = 'SWAP',
    MINT = 'MINT',
    VOTE = 'VOTE',
    TRANSFER = 'TRANSFER',
    STAKE = 'STAKE',
}

export interface EvolutionState {
    xp: number;
    level: number;
    traits: Record<string, string>;
}

// Future: Add Trait definitions here
export type TraitType = "Head" | "Body" | "Aura" | "Accessory";

export interface Trait {
    id: string;
    name: string;
    type: TraitType;
    modelUrl?: string;
    color?: string;
    geometry?: "box" | "sphere" | "capsule";
}
