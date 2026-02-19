use anchor_lang::prelude::*;
use bolt_lang::*;
use crate::components::SoulTraits;

declare_id!("8X5X7X...PLACEHOLDER...Z"); // Will be replaced by actual key

#[program]
pub mod world {
    use super::*;

    // Initialize the World (Registry of Components)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let world = &mut ctx.accounts.world;
        world.authority = ctx.accounts.authority.key();
        Ok(())
    }

    // Add Entity (User's Soul)
    pub fn add_entity(ctx: Context<AddEntity>, entity_id: u64) -> Result<()> {
        // Bolt logic to register a new entity
        Ok(())
    }

    // Update Soul Traits (The Feeding Mechanism)
    pub fn update_soul(ctx: Context<UpdateSoul>, args: UpdateSoulArgs) -> Result<()> {
        let soul = &mut ctx.accounts.soul;
        
        // 1. Update Energy
        if let Some(energy) = args.energy {
            soul.energy = energy; 
        }

        // 2. Update Happiness
        if let Some(happiness) = args.happiness {
            soul.happiness = happiness;
        }

        // 3. Update XP
        if let Some(xp) = args.xp {
            soul.xp = soul.xp.checked_add(xp).unwrap_or(soul.xp);
        }

        soul.last_interaction = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateSoul<'info> {
    #[account(mut, has_one = authority)]
    pub soul: Account<'info, SoulTraits>, // The Bolt Component PDA
    pub authority: Signer<'info>, // The Pulse Service (Backend Authority)
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateSoulArgs {
    pub energy: Option<u8>,
    pub happiness: Option<u8>,
    pub xp: Option<u64>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32)]
    pub world: Account<'info, World>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct World {
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct AddEntity<'info> {
    #[account(mut)]
    pub world: Account<'info, World>,
    #[account(mut)]
    pub authority: Signer<'info>,
    // Bolt accounts...
}
