use anchor_lang::prelude::*;

/// On-chain XP ledger for each AETERNA Pass.
/// Seeds: ["soul_stats", asset.key()]
#[account]
pub struct SoulStats {
    /// The Metaplex Core Asset this record belongs to
    pub asset: Pubkey,
    /// Total accumulated XP
    pub xp: u64,
    /// Number of quests/events completed
    pub quests_completed: u32,
    /// Current evolution stage (0 = Dormant, 1 = Active, 2 = Ascended)
    /// Stored here so the program can enforce stage logic without reading Metaplex attributes
    pub current_stage: u8,
    /// Canonical bump for this PDA
    pub bump: u8,
}

impl SoulStats {
    /// 8 (discriminator) + 32 (asset) + 8 (xp) + 4 (quests_completed) + 1 (current_stage) + 1 (bump) = 54
    pub const SIZE: usize = 8 + 32 + 8 + 4 + 1 + 1;

    /// XP required to reach ACTIVE state (stage 1)
    pub const THRESHOLD_ACTIVE: u64 = 100;
    /// XP required to reach ASCENDED state (stage 2)
    pub const THRESHOLD_ASCENDED: u64 = 1000;
}
