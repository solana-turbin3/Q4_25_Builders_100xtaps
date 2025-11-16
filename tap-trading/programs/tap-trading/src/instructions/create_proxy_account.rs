use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CreateProxyAccount<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + ProxyAccount::INIT_SPACE,
        seeds = [ProxyAccount::SEED_PREFIX, owner.key().as_ref()],
        bump
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateProxyAccount>) -> Result<()> {
    let proxy_account = &mut ctx.accounts.proxy_account;
    
    proxy_account.owner = ctx.accounts.owner.key();
    proxy_account.balance = 0;
    proxy_account.total_bets = 0;
    proxy_account.total_deposited = 0;
    proxy_account.total_withdrawn = 0;
    proxy_account.bump = ctx.bumps.proxy_account;
    
    msg!("Proxy account created for owner: {}", ctx.accounts.owner.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [ProxyAccount::SEED_PREFIX, owner.key().as_ref()],
        bump = proxy_account.bump
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, BettingError::InvalidBetAmount);
    
    // Transfer SOL from user to proxy account
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.proxy_account.to_account_info(),
            },
        ),
        amount,
    )?;
    
    let proxy_account = &mut ctx.accounts.proxy_account;
    proxy_account.balance = proxy_account.balance
        .checked_add(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    proxy_account.total_deposited = proxy_account.total_deposited
        .checked_add(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    msg!("Deposited {} lamports to proxy account", amount);
    
    Ok(())
}