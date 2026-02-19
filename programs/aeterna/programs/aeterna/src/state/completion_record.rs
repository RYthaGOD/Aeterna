use anchor_lang::prelude::*;

/// Records that a specific asset has completed a specific quest.
/// Seeds: ["completion", quest.key(), asset.key()]
/// Using `init` in the instruction context means a second call with the same seeds fails with AccountAlreadyInUse — this is the dedup mechanism.
#[account]
pub struct CompletionRecord {
    /// The quest that was completed
    pub quest: Pubkey,
    /// The asset (pass) that completed it
    pub asset: Pubkey,
    /// Timestamp of completion (Unix seconds)
    pub completed_at: i64,
    /// PDA bump
    pub bump: u8,
}

impl CompletionRecord {
    /// 8 (discriminator) + 32 (quest) + 32 (asset) + 8 (completed_at) + 1 (bump) = 81
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 1;
}
