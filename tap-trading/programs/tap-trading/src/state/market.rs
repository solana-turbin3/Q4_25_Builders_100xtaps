use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub authority: Pubkey,
    pub total_volume: u64,
    pub total_fees: u64,
    pub is_active: bool,
    pub bump: u8,
}

impl Market {
    pub const SEED_PREFIX: &'static [u8] = b"market";
}