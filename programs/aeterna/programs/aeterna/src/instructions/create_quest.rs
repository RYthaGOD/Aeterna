use anchor_lang::prelude::*;
use crate::state::event::Event;
use crate::state::quest::Quest;

#[derive(Accounts)]
#[instruction(name: String, xp_reward: u64)]
pub struct CreateQuest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"event", event.name.as_bytes()],
        bump = event.bump,
        constraint = event.authority == authority.key() @ crate::AeternaError::Unauthorized
    )]
    pub event: Account<'info, Event>,

    #[account(
        init,
        payer = authority,
        space = Quest::SIZE,
        seeds = [b"quest", event.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub quest: Account<'info, Quest>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateQuest>, name: String, xp_reward: u64) -> Result<()> {
    let quest = &mut ctx.accounts.quest;
    quest.event = ctx.accounts.event.key();
    quest.name = name;
    quest.xp_reward = xp_reward;
    quest.bump = ctx.bumps.quest;

    msg!("Quest Created: {} ({} XP)", quest.name, quest.xp_reward);
    Ok(())
}
