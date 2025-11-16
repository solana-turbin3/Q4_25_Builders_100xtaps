use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProxyAccount {
    pub owner: Pubkey,
    pub balance: u64,
    pub total_bets: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub bump: u8,
}

impl ProxyAccount {
    pub const SEED_PREFIX: &'static [u8] = b"proxy_account";
}