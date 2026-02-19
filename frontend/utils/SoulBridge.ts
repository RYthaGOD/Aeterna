import { SoulDNA } from '../components/Forge';

/**
 * Standard Metaplex Attribute Interface
 * Matches the structure returned by the DAS API / Umi
 */
export interface MetaplexAttribute {
    trait_type: string;
    value: string | number;
}

/**
 * Maps On-Chain Attributes to Local Visual DNA
 * This ensures that what is seen in 'AvatarDisplay' matches the procedural logic in 'Forge'
 */
export function bridgeSoulDNA(attributes: MetaplexAttribute[]): SoulDNA {
    const dna: SoulDNA = {
        // Defaults
        walletAgeDays: 0,
        txCount: 0,
        tokenCount: 0,
        wealthUsd: 0,
        burnCount: 0,
        instability: 0
    };

    // Map Attributes
    attributes.forEach(attr => {
        const key = attr.trait_type.toLowerCase();
        const val = Number(attr.value);

        switch (key) {
            case 'age':
            case 'days_active':
                dna.walletAgeDays = val;
                break;
            case 'entropy':
            case 'transactions':
                dna.txCount = val;
                dna.instability = Math.min(val / 100, 1.0); // Derived
                break;
            case 'assets':
            case 'orbital_density':
                dna.tokenCount = val;
                break;
            case 'wealth_tier':
            case 'net_worth':
                dna.wealthUsd = val; // Assuming 'value' is raw USD or scaled tier
                break;
            case 'scars':
            case 'burns':
                dna.burnCount = val;
                break;
        }
    });

    return dna;
}

/**
 * Mocks a Metaplex Asset for local testing
 */
export function mockSoulAsset(dna: SoulDNA): MetaplexAttribute[] {
    return [
        { trait_type: 'Days_Active', value: dna.walletAgeDays || 0 },
        { trait_type: 'Entropy', value: dna.txCount || 0 },
        { trait_type: 'Assets', value: dna.tokenCount || 0 },
        { trait_type: 'Wealth_Tier', value: dna.wealthUsd || 0 },
        { trait_type: 'Scars', value: dna.burnCount || 0 },
    ];
}
