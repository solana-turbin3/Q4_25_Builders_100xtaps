use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [Market::SEED_PREFIX],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    
    market.authority = ctx.accounts.authority.key();
    market.total_volume = 0;
    market.total_fees = 0;
    market.is_active = true;
    market.bump = ctx.bumps.market;
    
    msg!("Market initialized by authority: {}", ctx.accounts.authority.key());
    
    Ok(())
}