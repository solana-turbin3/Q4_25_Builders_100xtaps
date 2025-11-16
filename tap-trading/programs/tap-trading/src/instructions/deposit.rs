use anchor_lang::prelude::*;

use crate::state::ProxyAccount;
use crate::constants::PROXY_SEED;
use crate::errors::ErrorCode;

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    // Transfer SOL from user to proxy account
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.proxy_account.key(),
        amount,
    );
    
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.proxy_account.to_account_info(),
        ],
    )?;

    let proxy = &mut ctx.accounts.proxy_account;
    proxy.add_balance(amount)?;
    proxy.record_deposit(amount)?;
    
    msg!("Deposited {} lamports. New balance: {}", amount, proxy.balance);
    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [PROXY_SEED, user.key().as_ref()],
        bump = proxy_account.bump
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}