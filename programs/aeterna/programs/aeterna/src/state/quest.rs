use anchor_lang::prelude::*;

#[account]
pub struct Quest {
    /// The Event this quest belongs to
    pub event: Pubkey,
    /// Human readable name/description (e.g. "Main Stage Check-in")
    pub name: String,
    /// XP reward for completing this quest
    pub xp_reward: u64,
    /// Bump seed
    pub bump: u8,
}

impl Quest {
    // 8 discriminator + 32 event + (4 + 64 name) + 8 xp + 1 bump
    pub const SIZE: usize = 8 + 32 + (4 + 64) + 8 + 1;
}
