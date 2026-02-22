use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;
pub mod state;
pub use state::*;

declare_id!("E3aVLq7oT4BFPjHRXaZmYupDJ9EZTG8At8oafLKzPMBG");

#[program]
pub mod aeterna {
    use super::*;

    /// Mint a new AETERNA Pass (Metaplex Core Asset) and initialize its SoulStats ledger
    pub fn initialize_pass(ctx: Context<InitializePass>, args: InitArgs) -> Result<()> {
        instructions::initialize_pass::handler(ctx, args)
    }

    /// Link a Pulse Wallet (Turnkey) to an AETERNA Pass
    pub fn register_pulse_wallet(ctx: Context<ManagePulse>, args: PulseArgs) -> Result<()> {
        instructions::manage_pulse::handler(ctx, args)
    }

    /// Evolve a Soul to the next stage (gated by on-chain XP threshold)
    pub fn evolve_soul(ctx: Context<EvolveSoul>, args: EvolveArgs) -> Result<()> {
        instructions::evolve::handler(ctx, args)
    }

    /// Create an Event (Organizer Dashboard)
    pub fn create_event(ctx: Context<CreateEvent>, name: String) -> Result<()> {
        instructions::create_event::handler(ctx, name)
    }

    /// Add a Quest to an existing Event
    pub fn create_quest(ctx: Context<CreateQuest>, name: String, xp_reward: u64) -> Result<()> {
        instructions::create_quest::handler(ctx, name, xp_reward)
    }

    /// Scanner triggers this when a user completes a quest at an event
    pub fn complete_quest(ctx: Context<CompleteQuest>) -> Result<()> {
        instructions::complete_quest::handler(ctx)
    }

    /// Called by the Pulse Service backend after a verified USDC spend
    pub fn grant_xp(ctx: Context<GrantXp>, args: GrantXpArgs) -> Result<()> {
        instructions::grant_xp::handler(ctx, args)
    }
}

#[error_code]
pub enum AeternaError {
    #[msg("You are not the owner of this asset.")]
    Unauthorized,
    #[msg("Invalid Invite Code. Access Denied.")]
    InvalidInviteCode,
    #[msg("Not enough XP to evolve. Keep grinding.")]
    NotEnoughXp,
    #[msg("Invalid evolution stage target.")]
    InvalidStage,
    #[msg("This Soul is Dormant and cannot earn XP. Activate it first.")]
    NotActivated,
}
