use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub user: Pubkey,
    pub market: Pubkey,
    pub proxy_account: Pubkey,
    pub timestamp: i64,
    pub odds: u64,
    pub expiry_time: i64,
    pub amount: u64,
    pub is_active: bool,
    pub bump: u8,
}

impl Bet {
    pub const SEED_PREFIX: &'static [u8] = b"bet";
}