use anchor_lang::prelude::*;

#[account]
pub struct Event {
    /// The authority/admin of this event (the organizer)
    pub authority: Pubkey,
    /// Human readable name/slug for the event
    pub name: String,
    /// Whether the event is currently active for ticketing/interaction
    pub active: bool,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Event {
    // 8 discriminator + 32 authority + 4+32 name + 1 active + 1 bump
    // Adjusting name size to be reasonable buffer if needed, but String is dynamic in Anchor now (heap).
    // For fixed size/zero copy we'd need slice. For now standard account is fine.
    // Let's allocate enough for a reasonable name.
    pub const SIZE: usize = 8 + 32 + (4 + 64) + 1 + 1; 
}
