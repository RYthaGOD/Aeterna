use anchor_lang::prelude::*;
use crate::state::soul_stats::SoulStats;
use mpl_core::{
    ID as CORE_PROGRAM_ID,
    instructions::{CreateV1Cpi, CreateV1InstructionArgs},
    types::{Attribute, Plugin, Attributes},
};

#[derive(Accounts)]
pub struct InitializePass<'info> {
    /// The User (owner of the new pass)
    #[account(mut)]
    pub signer: Signer<'info>,

    /// The Backend Authority (update authority on the asset + pays for on-chain storage)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Who pays the rent for the asset account
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The Asset Keypair — must be a fresh keypair signed by the caller
    #[account(mut)]
    pub asset: Signer<'info>,

    /// The Collection (Optional)
    #[account(mut)]
    pub collection: Option<Signer<'info>>,

    /// The Metaplex Core Program
    #[account(address = CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    /// The Event this pass belongs to — must be active
    #[account(
        seeds = [b"event", event.name.as_bytes()],
        bump = event.bump,
        constraint = event.active == true
    )]
    pub event: Account<'info, crate::state::event::Event>,

    /// The SoulStats PDA — initialized here so XP tracking starts at zero
    #[account(
        init,
        payer = authority,
        space = SoulStats::SIZE,
        seeds = [b"soul_stats", asset.key().as_ref()],
        bump
    )]
    pub soul_stats: Account<'info, SoulStats>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitArgs {
    pub uri: String,
    pub invite_code: String, // Viral/scarcity mechanic
}

pub fn handler(ctx: Context<InitializePass>, args: InitArgs) -> Result<()> {
    // Invite Code check — hardcoded genesis code for hackathon
    require!(args.invite_code == "AETERNA_GENESIS", crate::AeternaError::InvalidInviteCode);

    msg!("Initializing AETERNA Pass. Owner: {}", ctx.accounts.signer.key());

    // ── 1. Initialize the SoulStats PDA ──────────────────────────────────────
    let soul_stats = &mut ctx.accounts.soul_stats;
    soul_stats.asset = ctx.accounts.asset.key();
    soul_stats.xp = 0;
    soul_stats.quests_completed = 0;
    soul_stats.bump = *ctx.bumps.get("soul_stats").unwrap();

    // ── 2. Build initial attributes ──────────────────────────────────────────
    let initial_attributes = vec![
        Attribute { key: "status".to_string(), value: "Dormant".to_string() },
        Attribute { key: "stage".to_string(), value: "0".to_string() },
        Attribute { key: "xp".to_string(), value: "0".to_string() },
    ];

    let plugins = vec![
        Plugin::Attributes(Attributes { attribute_list: initial_attributes }),
        Plugin::Royalties(mpl_core::types::Royalties {
            basis_points: 500, // 5% secondary royalties to treasury
            creators: vec![mpl_core::types::Creator {
                address: ctx.accounts.authority.key(),
                percentage: 100,
            }],
            rule_set: mpl_core::types::RuleSet::None,
        }),
    ];

    // ── 3. Mint the Core Asset ───────────────────────────────────────────────
    CreateV1Cpi::new(
        &ctx.accounts.mpl_core_program,
        mpl_core::accounts::CreateV1 {
            asset: &ctx.accounts.asset,
            collection: ctx.accounts.collection.as_ref().map(|c| c.as_ref()),
            authority: Some(&ctx.accounts.authority),
            payer: &ctx.accounts.payer,
            owner: Some(&ctx.accounts.signer),
            update_authority: Some(&ctx.accounts.authority),
            system_program: &ctx.accounts.system_program,
            log_wrapper: None,
            data_state: None,
        },
        CreateV1InstructionArgs {
            name: "AETERNA Pass".to_string(),
            uri: args.uri,
            plugins: Some(plugins),
            data_state: None,
        }
    ).invoke()?;

    msg!(
        "AETERNA Pass Minted. Owner: {} | SoulStats PDA initialized.",
        ctx.accounts.signer.key()
    );

    Ok(())
}
