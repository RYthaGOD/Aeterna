use anchor_lang::prelude::*;
use crate::state::event::Event;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Event::SIZE,
        seeds = [b"event", name.as_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateEvent>, name: String) -> Result<()> {
    let event = &mut ctx.accounts.event;
    event.authority = ctx.accounts.authority.key();
    event.name = name;
    event.active = true;
    event.bump = *ctx.bumps.get("event").unwrap();

    msg!("Event Created: {}", event.name);
    Ok(())
}
