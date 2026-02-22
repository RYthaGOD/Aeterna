use anchor_lang::prelude::*;
use mpl_core::{
    ID as CORE_PROGRAM_ID,
    instructions::{UpdatePluginV1Cpi, UpdatePluginV1CpiAccounts, UpdatePluginV1InstructionArgs},
    types::{Attribute, Plugin, Attributes},
};
use crate::state::soul_stats::SoulStats;

#[derive(Accounts)]
pub struct EvolveSoul<'info> {
    /// The Backend Authority (Update Authority or Delegate)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The Payer (Backend pays for the update)
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The Metaplex Core Asset account
    /// CHECK: Checked by Metaplex Core program via CPI
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,

    /// The SoulStats PDA — used to gate evolution by XP threshold AND track the current stage
    #[account(
        mut,
        seeds = [b"soul_stats", asset.key().as_ref()],
        bump = soul_stats.bump,
        constraint = soul_stats.asset == asset.key()
    )]
    pub soul_stats: Account<'info, SoulStats>,

    /// The Metaplex Core Program
    /// CHECK: Validated via address constraint against CORE_PROGRAM_ID
    #[account(address = CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Trait {
    pub key: String,
    pub value: String,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct EvolveArgs {
    pub new_uri: Option<String>,
    pub new_stage: u8, // 1 = Active, 2 = Ascended
    pub attributes: Vec<Trait>,
}

pub fn handler(ctx: Context<EvolveSoul>, args: EvolveArgs) -> Result<()> {
    let soul_stats = &mut ctx.accounts.soul_stats;

    // ── A5: Prevent stage downgrade ───────────────────────────────────────────
    // An Ascended soul cannot be regressed to Active. Stage must always increase.
    require!(
        args.new_stage > soul_stats.current_stage,
        crate::AeternaError::InvalidStage
    );

    // ── Gate evolution behind real on-chain XP thresholds ────────────────────
    match args.new_stage {
        1 => {
            require!(
                soul_stats.xp >= SoulStats::THRESHOLD_ACTIVE,
                crate::AeternaError::NotEnoughXp
            );
        }
        2 => {
            require!(
                soul_stats.xp >= SoulStats::THRESHOLD_ASCENDED,
                crate::AeternaError::NotEnoughXp
            );
        }
        _ => return Err(crate::AeternaError::InvalidStage.into()),
    }

    msg!(
        "Evolving Soul: {} | {} → {} | XP: {}",
        ctx.accounts.asset.key(),
        soul_stats.current_stage,
        args.new_stage,
        soul_stats.xp
    );

    // ── Update the on-chain stage record ─────────────────────────────────────
    soul_stats.current_stage = args.new_stage;

    // Build attributes including the new stage
    let mut mpl_attributes: Vec<Attribute> = args.attributes.iter().map(|t| Attribute {
        key: t.key.clone(),
        value: t.value.clone(),
    }).collect();

    // Ensure stage, xp, and status are always written
    mpl_attributes.push(Attribute { key: "stage".to_string(), value: args.new_stage.to_string() });
    mpl_attributes.push(Attribute { key: "xp".to_string(), value: soul_stats.xp.to_string() });
    mpl_attributes.push(Attribute {
        key: "status".to_string(),
        value: match args.new_stage {
            1 => "Active".to_string(),
            2 => "Ascended".to_string(),
            _ => "Dormant".to_string(),
        },
    });

    UpdatePluginV1Cpi::new(
        &ctx.accounts.mpl_core_program,
        UpdatePluginV1CpiAccounts {
            asset: &ctx.accounts.asset,
            collection: None,
            authority: Some(&ctx.accounts.authority),
            payer: &ctx.accounts.payer,
            system_program: &ctx.accounts.system_program,
            log_wrapper: None,
        },
        UpdatePluginV1InstructionArgs {
            plugin: Plugin::Attributes(Attributes {
                attribute_list: mpl_attributes,
            }),
        }
    ).invoke()?;

    msg!("Soul Evolved to Stage {}.", args.new_stage);
    Ok(())
}
