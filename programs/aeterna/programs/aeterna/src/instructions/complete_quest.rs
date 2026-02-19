use anchor_lang::prelude::*;
use crate::state::event::Event;
use crate::state::quest::Quest;
use crate::state::soul_stats::SoulStats;
use crate::state::completion_record::CompletionRecord;
use mpl_core::{
    ID as CORE_PROGRAM_ID,
    instructions::{UpdateV1Cpi, UpdateV1InstructionArgs},
    types::{Attribute, Plugin, Attributes},
};

#[derive(Accounts)]
pub struct CompleteQuest<'info> {
    /// The Event Authority (Scanner wallet) — must match event.authority
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Authority also pays for the CompletionRecord PDA rent
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The Quest being completed
    #[account(
        seeds = [b"quest", event.key().as_ref(), quest.name.as_bytes()],
        bump = quest.bump,
        constraint = quest.event == event.key()
    )]
    pub quest: Account<'info, Quest>,

    /// The Event context — must be active and owned by authority
    #[account(
        seeds = [b"event", event.name.as_bytes()],
        bump = event.bump,
        constraint = event.active == true,
        constraint = event.authority == authority.key() @ crate::AeternaError::Unauthorized
    )]
    pub event: Account<'info, Event>,

    /// The Asset receiving XP
    /// CHECK: Verified via derived SoulStats PDA constraint (asset == soul_stats.asset). 
    /// Asset data is deserialized in handler to verify owner.
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,

    /// The intended recipient of the XP (the asset owner)
    /// In a real world tap, the scanner signs but we verify the beneficiary.
    /// CHECK: Ownership verified in handler.
    pub recipient: UncheckedAccount<'info>,

    /// The SoulStats PDA for this asset — this is where XP is stored on-chain
    #[account(
        mut,
        seeds = [b"soul_stats", asset.key().as_ref()],
        bump = soul_stats.bump,
        constraint = soul_stats.asset == asset.key()
    )]
    pub soul_stats: Account<'info, SoulStats>,

    /// ── DEDUP: this account will fail to init if already completed (C2 fix) ──
    /// Seeds: ["completion", quest.key(), asset.key()]
    /// `init` means a second call for the same (quest, asset) fails with AccountAlreadyInUse
    #[account(
        init,
        payer = payer,
        space = CompletionRecord::SIZE,
        seeds = [b"completion", quest.key().as_ref(), asset.key().as_ref()],
        bump
    )]
    pub completion_record: Account<'info, CompletionRecord>,

    /// The Metaplex Core Program
    #[account(address = CORE_PROGRAM_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CompleteQuest>) -> Result<()> {
    let quest = &ctx.accounts.quest;
    let soul_stats = &mut ctx.accounts.soul_stats;
    let asset_info = &ctx.accounts.asset;
    let recipient = &ctx.accounts.recipient;

    // ── A6: Verify Asset Ownership ───────────────────────────────────────────
    let asset_data = asset_info.try_borrow_data()?;
    let asset = mpl_core::accounts::BaseAssetV1::from_bytes(&asset_data)?;
    require_keys_eq!(asset.owner, recipient.key(), crate::AeternaError::Unauthorized);

    // ── A4: Gate XP earn — Dormant souls (stage 0) cannot earn XP ────────────
    // Per mechanics_review.md: "Dormant: Cannot earn XP"
    require!(
        soul_stats.current_stage >= 1,
        crate::AeternaError::NotActivated
    );

    msg!("Completing Quest '{}' for Asset: {}", quest.name, ctx.accounts.asset.key());
    msg!("XP before: {} | Reward: {}", soul_stats.xp, quest.xp_reward);

    // ✅ Real XP Update
    soul_stats.xp = soul_stats.xp.saturating_add(quest.xp_reward);
    soul_stats.quests_completed = soul_stats.quests_completed.saturating_add(1);

    msg!("XP after: {}", soul_stats.xp);

    // ── Record the completion (dedup PDA already initialized above) ───────────
    let completion_record = &mut ctx.accounts.completion_record;
    completion_record.quest = quest.key();
    completion_record.asset = ctx.accounts.asset.key();
    completion_record.completed_at = Clock::get()?.unix_timestamp;
    completion_record.bump = *ctx.bumps.get("completion_record").unwrap();

    // Update Metaplex Core attributes so indexers (Tensor, ME) see the new XP
    let updated_attributes = vec![
        Attribute {
            key: "xp".to_string(),
            value: soul_stats.xp.to_string(),
        },
        Attribute {
            key: "last_quest".to_string(),
            value: quest.name.clone(),
        },
        Attribute {
            key: "quests_completed".to_string(),
            value: soul_stats.quests_completed.to_string(),
        },
    ];

    UpdateV1Cpi::new(
        &ctx.accounts.mpl_core_program,
        mpl_core::accounts::UpdateV1 {
            asset: &ctx.accounts.asset,
            authority: Some(&ctx.accounts.authority),
            payer: Some(&ctx.accounts.payer),
            system_program: Some(&ctx.accounts.system_program),
            log_wrapper: None,
            collection: None,
        },
        UpdateV1InstructionArgs {
            new_uri: None,
            new_name: None,
            new_update_authority: None,
            new_plugins: Some(vec![Plugin::Attributes(Attributes {
                attribute_list: updated_attributes,
            })]),
        }
    ).invoke()?;

    msg!("Quest Complete. New XP Total: {}", soul_stats.xp);
    Ok(())
}
