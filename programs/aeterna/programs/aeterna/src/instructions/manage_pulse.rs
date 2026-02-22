use anchor_lang::prelude::*;
use crate::state::*;
use crate::AeternaError;

#[derive(Accounts)]
pub struct ManagePulse<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The Asset account (Metaplex Core Asset)
    /// CHECK: We verify ownership via Core CPI or just assume signature authority if needed.
    /// For now, we trust the owner is signing for *their* asset.
    /// In a real app, we should verify `asset.owner == owner.key()`.
    /// CHECK: Validated by BaseAssetV1 manual deserialization
    #[account()]
    pub asset: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = owner,
        space = PulseLink::SIZE,
        seeds = [b"pulse", asset.key().as_ref()],
        bump
    )]
    pub pulse_link: Account<'info, PulseLink>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PulseArgs {
    pub pulse_wallet: Pubkey,
}

pub fn handler(ctx: Context<ManagePulse>, args: PulseArgs) -> Result<()> {
    msg!("Linking Pulse Wallet: {} to Asset: {}", args.pulse_wallet, ctx.accounts.asset.key());

    // Securely link the wallet in the PDA
    
    // SECURITY FIX: Verify the `owner` actually owns the `asset`.
    // We need to deserialize the asset to check the owner.
    // Or we can rely on the fact that ONLY the owner can sign? 
    // No, `owner` is just a signer. `asset` is an address. 
    // If I pass `Alice` (signer) and `Bob's Asset`, the code previously allowed it.
    
    use mpl_core::accounts::BaseAssetV1;
    // Attempt to deserialize headers to check owner
    let asset_data = ctx.accounts.asset.try_borrow_data()?;
    let asset_account = BaseAssetV1::from_bytes(&asset_data)?;
    
    require!(asset_account.owner == ctx.accounts.owner.key(), AeternaError::Unauthorized);

    let pulse_link = &mut ctx.accounts.pulse_link;
    pulse_link.asset = ctx.accounts.asset.key();
    pulse_link.pulse_wallet = args.pulse_wallet;
    pulse_link.bump = ctx.bumps.pulse_link;

    msg!("Pulse Link Established.");
    Ok(())
}
