use anchor_lang::prelude::*;
use session_keys::{SessionError, SessionToken, session_auth_or, Session};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[derive(Session)]
#[instruction(timestamp: i64)]
pub struct CreateBet<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + Bet::INIT_SPACE,
        seeds = [
            Bet::SEED_PREFIX,
            proxy_account.owner.as_ref(),
            &timestamp.to_le_bytes()
        ],
        bump
    )]
    pub bet: Account<'info, Bet>,
    
    #[account(
        mut,
        seeds = [ProxyAccount::SEED_PREFIX, proxy_account.owner.as_ref()],
        bump = proxy_account.bump
    )]
    pub proxy_account: Account<'info, ProxyAccount>,
    
    #[account(
        seeds = [Market::SEED_PREFIX],
        bump = market.bump,
        constraint = market.is_active @ BettingError::MarketNotActive
    )]
    pub market: Account<'info, Market>,
    
    #[session(
        signer = signer,
        authority = proxy_account.owner.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,
    
    #[account(mut)]
    pub signer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[session_auth_or(
    ctx.accounts.proxy_account.owner.key() == ctx.accounts.signer.key(),
    SessionError::InvalidToken
)]
pub fn handler(
    ctx: Context<CreateBet>,
    timestamp: i64,
    odds: u64,
    expiry_time: i64,
    amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    
    require!(amount > 0, BettingError::InvalidBetAmount);
    require!(odds > 0, BettingError::InvalidOdds);
    require!(expiry_time > clock.unix_timestamp, BettingError::InvalidTimestamp);
    
    let proxy_account = &mut ctx.accounts.proxy_account;
    require!(
        proxy_account.balance >= amount,
        BettingError::InsufficientBalance
    );
    
    // Deduct amount from proxy account balance
    proxy_account.balance = proxy_account.balance
        .checked_sub(amount)
        .ok_or(BettingError::ArithmeticOverflow)?;
    proxy_account.total_bets = proxy_account.total_bets
        .checked_add(1)
        .ok_or(BettingError::ArithmeticOverflow)?;
    
    let bet = &mut ctx.accounts.bet;
    bet.user = proxy_account.owner;
    bet.market = ctx.accounts.market.key();
    bet.proxy_account = ctx.accounts.proxy_account.key();
    bet.timestamp = timestamp;
    bet.odds = odds;
    bet.expiry_time = expiry_time;
    bet.amount = amount;
    bet.is_active = true;
    bet.bump = ctx.bumps.bet;
    
    msg!(
        "Bet created: user={}, amount={}, odds={}, expiry={}",
        bet.user,
        amount,
        odds,
        expiry_time
    );
    
    Ok(())
}