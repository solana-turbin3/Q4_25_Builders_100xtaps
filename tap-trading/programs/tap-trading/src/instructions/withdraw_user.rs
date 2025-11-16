use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct WithdrawUser<'info> {
    #[account(
        mut,
        seeds = [ProxyAccount::SEED_PREFIX, owner.key().as_ref()],
        bump = proxy_account.bump,
        has_one = owner @ BettingError::Unauthorized
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawUser>, amount: u64) -> Result<()> {
    let proxy_account = &mut ctx.accounts.proxy_account;
    
    require!(amount > 0, BettingError::InvalidBetAmount);
    require!(
        proxy_account.balance >= amount,
        BettingError::InsufficientBalance
    );
    
    // Transfer SOL from proxy account to user
    let proxy_lamports = proxy_account.to_account_info().lamports();
    
    **proxy_account.to_account_info().try_borrow_mut_lamports()? = proxy_lamports
        .checked_sub(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? = ctx
        .accounts
        .owner
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    proxy_account.balance = proxy_account.balance
        .checked_sub(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    proxy_account.total_withdrawn = proxy_account.total_withdrawn
        .checked_add(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    msg!("User withdrew {} lamports from proxy account", amount);
    
    Ok(())
}