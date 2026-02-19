import { ActionType, EvolutionState } from "@aeterna/types";

const XP_TABLE: Record<ActionType, number> = {
    [ActionType.SWAP]: 10,
    [ActionType.MINT]: 50,
    [ActionType.VOTE]: 5,
    [ActionType.TRANSFER]: 2,
    [ActionType.STAKE]: 25,
};

const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 5000, 15000];

export class XPEngine {
    static calculateXP(action: ActionType, currentXP: number): number {
        const reward = XP_TABLE[action] || 0;
        return currentXP + reward;
    }

    static getLevel(xp: number): number {
        // Find the highest level threshold passed
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_THRESHOLDS[i]) return i + 1; // Levels 1-indexed
        }
        return 1;
    }

    static getEvolutionTraits(xp: number, action: ActionType): Record<string, string> {
        const level = this.getLevel(xp);
        const traits: Record<string, string> = {};

        // Base traits based on level
        traits['Level'] = level.toString();
        traits['Title'] = this.getTitle(level);

        // Dynamic traits based on action history (simplified here)
        // In a real DB we'd track counts. e.g. "Trader" if > 50 swaps.
        if (action === ActionType.SWAP) {
            traits['Last Action'] = 'Trader';
        } else if (action === ActionType.MINT) {
            traits['Last Action'] = 'Collector';
        }

        return traits;
    }

    private static getTitle(level: number): string {
        if (level >= 5) return 'Ethereal Being';
        if (level >= 4) return 'Ascendant';
        if (level >= 3) return 'Awakened';
        if (level >= 2) return 'Seeker';
        return 'Dormant Soul';
    }
}
