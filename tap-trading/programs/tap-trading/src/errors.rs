use anchor_lang::prelude::*;

#[error_code]
pub enum BettingError {
    #[msg("Insufficient balance in proxy account")]
    InsufficientBalance,
    
    #[msg("Bet has not expired yet")]
    BetNotExpired,
    
    #[msg("Bet has already expired")]
    BetExpired,
    
    #[msg("Bet is not active")]
    BetNotActive,
    
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    
    #[msg("Invalid odds")]
    InvalidOdds,
    
    #[msg("Market is not active")]
    MarketNotActive,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
}