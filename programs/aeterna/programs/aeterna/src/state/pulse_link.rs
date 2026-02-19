use anchor_lang::prelude::*;

#[account]
pub struct PulseLink {
    pub asset: Pubkey,
    pub pulse_wallet: Pubkey,
    pub bump: u8,
}

impl PulseLink {
    pub const SIZE: usize = 8 + 32 + 32 + 1;
}
