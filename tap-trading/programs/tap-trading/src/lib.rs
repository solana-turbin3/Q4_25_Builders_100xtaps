use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;

declare_id!("2w4oVPm7JEd2qnWt1mJ4YLpXAW6Wrp9Rk2EfKFVJNanB");

use instructions::*;


#[program]
pub mod tapTrading {
    use super::*;

    pub fn initialize_market(ctx: Context<InitializeMarket>) -> Result<()> {
        instructions::initialize_market::handler(ctx)
    }

    pub fn create_proxy_account(ctx: Context<CreateProxyAccount>) -> Result<()> {
        instructions::create_proxy_account::handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::create_proxy_account::deposit_handler(ctx, amount)
    }

    pub fn create_bet(
        ctx: Context<CreateBet>,
        timestamp: i64,
        odds: u64,
        expiry_time: i64,
        amount: u64,
    ) -> Result<()> {
        instructions::create_bet::handler(ctx, timestamp, odds, expiry_time, amount)
    }

    pub fn settle_bet(ctx: Context<SettleBet>, is_won: bool) -> Result<()> {
        instructions::settle_bet::handler(ctx, is_won)
    }

    pub fn withdraw_user(ctx: Context<WithdrawUser>, amount: u64) -> Result<()> {
        instructions::withdraw_user::handler(ctx, amount)
    }

    pub fn withdraw_owner(ctx: Context<WithdrawOwner>, amount: u64) -> Result<()> {
        instructions::withdraw_owner::handler(ctx, amount)
    }
}