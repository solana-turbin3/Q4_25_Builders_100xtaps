use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct WithdrawOwner<'info> {
    #[account(
        mut,
        seeds = [Market::SEED_PREFIX],
        bump = market.bump,
        has_one = authority @ BettingError::Unauthorized
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawOwner>, amount: u64) -> Result<()> {
    let market = &mut ctx.accounts.market;
    
    require!(amount > 0, BettingError::InvalidBetAmount);
    require!(
        market.total_fees >= amount,
        BettingError::InsufficientBalance
    );
    
    // Transfer SOL from market to authority
    let market_lamports = market.to_account_info().lamports();
    let rent_exempt = Rent::get()?.minimum_balance(market.to_account_info().data_len());
    
    require!(
        market_lamports.checked_sub(amount).unwrap() >= rent_exempt,
        BettingError::InsufficientBalance
    );
    
    **market.to_account_info().try_borrow_mut_lamports()? = market_lamports
        .checked_sub(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? = ctx
        .accounts
        .authority
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    market.total_fees = market.total_fees
        .checked_sub(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    msg!("Owner withdrew {} lamports from market", amount);
    
    Ok(())
}