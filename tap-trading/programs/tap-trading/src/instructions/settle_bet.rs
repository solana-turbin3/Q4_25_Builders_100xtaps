use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct SettleBet<'info> {
    #[account(
        mut,
        close = market,
        constraint = bet.is_active @ BettingError::BetNotActive
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [ProxyAccount::SEED_PREFIX, bet.user.as_ref()],
        bump = proxy_account.bump,
        constraint = proxy_account.key() == bet.proxy_account @ BettingError::Unauthorized
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    
    #[account(
        mut,
        seeds = [Market::SEED_PREFIX],
        bump = market.bump,
        has_one = authority @ BettingError::Unauthorized
    )]
    pub market: Account<'info, Market>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<SettleBet>, is_won: bool) -> Result<()> {
    let clock = Clock::get()?;
    let bet = &mut ctx.accounts.bet;
    
    // Check if bet has expired
    require!(
        clock.unix_timestamp >= bet.expiry_time,
        BettingError::BetNotExpired
    );
    
    let proxy_account = &mut ctx.accounts.proxy_account;
    let market = &mut ctx.accounts.market;
    
    if is_won {
        // Calculate winnings: amount * odds / 100 (assuming odds are in percentage)
        let winnings = bet.amount
            .checked_mul(bet.odds)
            .ok_or(BettingError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(BettingError::ArithmeticOverflow)?;
        
        // Add winnings to proxy account balance
        proxy_account.balance = proxy_account.balance
            .checked_add(winnings)
            .ok_or(BettingError::ArithmeticOverflow)?;
        
        msg!("Bet won! Winnings: {} lamports", winnings);
    } else {
        // If lost, add bet amount to market fees
        market.total_fees = market.total_fees
            .checked_add(bet.amount)
            .ok_or(BettingError::ArithmeticOverflow)?;
        
        msg!("Bet lost! Amount added to market fees");
    }
    
    // Update market volume
    market.total_volume = market.total_volume
        .checked_add(bet.amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    bet.is_active = false;
    
    msg!("Bet settled and closed: {}", bet.key());
    
    Ok(())
}