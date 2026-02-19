use anchor_lang::prelude::*;
use solana_program::pubkey;
use crate::state::soul_stats::SoulStats;

/// Hardcoded backend authority key using the `pubkey!` macro.
/// This is zero-cost (compile-time constant), unlike `.to_string()` comparison.
/// To rotate: update this constant and redeploy. Long-term: store in a config PDA.
const BACKEND_AUTHORITY: Pubkey = pubkey!("AjdHrwHUVTu57Br3AZpEstDFdqE6Knh2LG6EtfTaAwnJ");

#[derive(Accounts)]
pub struct GrantXp<'info> {
    /// Must be the designated backend authority keypair
    #[account(
        constraint = authority.key() == BACKEND_AUTHORITY @ crate::AeternaError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// The SoulStats PDA to update
    #[account(
        mut,
        seeds = [b"soul_stats", soul_stats.asset.as_ref()],
        bump = soul_stats.bump,
    )]
    pub soul_stats: Account<'info, SoulStats>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GrantXpArgs {
    pub xp_amount: u64,
}

pub fn handler(ctx: Context<GrantXp>, args: GrantXpArgs) -> Result<()> {
    let soul_stats = &mut ctx.accounts.soul_stats;

    msg!(
        "GrantXP: Asset {} | +{} XP | Total after: {}",
        soul_stats.asset,
        args.xp_amount,
        soul_stats.xp.saturating_add(args.xp_amount)
    );

    soul_stats.xp = soul_stats.xp.saturating_add(args.xp_amount);

    Ok(())
}
