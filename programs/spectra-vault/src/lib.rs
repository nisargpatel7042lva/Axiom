use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022, TransferChecked};
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("SpVau1tXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

pub const VAULT_SEED: &[u8] = b"spectra_vault";
pub const VAULT_TOKEN_SEED: &[u8] = b"vault_token";
pub const USDC_DECIMALS: u8 = 6;

#[program]
pub mod spectra_vault {
    use super::*;

    /// Initialize a new vault with strategy configuration.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: String,
        strategy_config: StrategyConfig,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.vault_id = vault_id;
        vault.usdc_mint = ctx.accounts.usdc_mint.key();
        vault.vault_token_mint = ctx.accounts.vault_token_mint.key();
        vault.treasury = ctx.accounts.treasury.key();
        vault.total_deposits = 0;
        vault.total_shares = 0;
        vault.nav = 0;
        vault.high_water_mark = 1_000_000; // 1.0 in 6 decimals
        vault.strategy_config = strategy_config;
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    /// Deposit USDC into the vault and receive vault share tokens.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        let vault = &mut ctx.accounts.vault;
        let shares_to_mint = calculate_shares_to_mint(amount, vault.nav, vault.total_shares);

        // Transfer USDC from user to vault treasury
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.user_usdc.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token_2022::transfer_checked(transfer_ctx, amount, USDC_DECIMALS)?;

        // Mint vault tokens to user
        let vault_id = vault.vault_id.clone();
        let seeds = &[
            VAULT_SEED,
            vault_id.as_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.vault_token_program.to_account_info(),
            anchor_spl::token_2022::MintTo {
                mint: ctx.accounts.vault_token_mint.to_account_info(),
                to: ctx.accounts.user_vault_token.to_account_info(),
                authority: vault.to_account_info(),
            },
            signer_seeds,
        );
        anchor_spl::token_2022::mint_to(mint_ctx, shares_to_mint)?;

        vault.total_deposits = vault.total_deposits.checked_add(amount).unwrap();
        vault.total_shares = vault.total_shares.checked_add(shares_to_mint).unwrap();
        vault.nav = vault.nav.checked_add(amount).unwrap();

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            vault: vault.key(),
            amount,
            shares_minted: shares_to_mint,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Redeem vault share tokens and withdraw proportional USDC.
    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        require!(shares > 0, VaultError::ZeroAmount);

        let vault = &mut ctx.accounts.vault;
        require!(shares <= vault.total_shares, VaultError::InsufficientShares);

        let usdc_amount = calculate_usdc_to_return(shares, vault.nav, vault.total_shares);
        require!(usdc_amount > 0, VaultError::ZeroAmount);

        // Burn vault tokens from user
        let vault_id = vault.vault_id.clone();
        let seeds = &[
            VAULT_SEED,
            vault_id.as_bytes(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let burn_ctx = CpiContext::new(
            ctx.accounts.vault_token_program.to_account_info(),
            anchor_spl::token_2022::Burn {
                mint: ctx.accounts.vault_token_mint.to_account_info(),
                from: ctx.accounts.user_vault_token.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        anchor_spl::token_2022::burn(burn_ctx, shares)?;

        // Transfer USDC from treasury to user
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.treasury.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.user_usdc.to_account_info(),
                authority: vault.to_account_info(),
            },
            signer_seeds,
        );
        token_2022::transfer_checked(transfer_ctx, usdc_amount, USDC_DECIMALS)?;

        vault.total_shares = vault.total_shares.checked_sub(shares).unwrap();
        vault.nav = vault.nav.checked_sub(usdc_amount).unwrap();

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            vault: vault.key(),
            shares_burned: shares,
            usdc_returned: usdc_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update the vault NAV (called by the strategy engine crank).
    pub fn update_nav(ctx: Context<UpdateNav>, new_nav: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.authority.key() == vault.authority,
            VaultError::Unauthorized
        );

        vault.nav = new_nav;

        // Update high water mark for performance fee calculation
        let pps = if vault.total_shares > 0 {
            (new_nav as u128 * 1_000_000 / vault.total_shares as u128) as u64
        } else {
            1_000_000
        };

        if pps > vault.high_water_mark {
            vault.high_water_mark = pps;
        }

        emit!(NavUpdateEvent {
            vault: vault.key(),
            nav: new_nav,
            price_per_share: pps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

fn calculate_shares_to_mint(deposit_amount: u64, current_nav: u64, total_shares: u64) -> u64 {
    if total_shares == 0 || current_nav == 0 {
        return deposit_amount;
    }
    ((deposit_amount as u128) * (total_shares as u128) / (current_nav as u128)) as u64
}

fn calculate_usdc_to_return(shares: u64, current_nav: u64, total_shares: u64) -> u64 {
    if total_shares == 0 {
        return 0;
    }
    ((shares as u128) * (current_nav as u128) / (total_shares as u128)) as u64
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,
    #[max_len(32)]
    pub vault_id: String,
    pub usdc_mint: Pubkey,
    pub vault_token_mint: Pubkey,
    pub treasury: Pubkey,
    pub total_deposits: u64,
    pub total_shares: u64,
    pub nav: u64,
    pub high_water_mark: u64,
    pub strategy_config: StrategyConfig,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct StrategyConfig {
    pub prediction_allocation_bps: u16,
    pub lending_allocation_bps: u16,
    pub idle_allocation_bps: u16,
    pub min_probability_bps: u16,
    pub max_probability_bps: u16,
    pub performance_fee_bps: u16,
}

#[derive(Accounts)]
#[instruction(vault_id: String)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [VAULT_SEED, vault_id.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Vault token mint — initialized separately via Token-2022.
    pub vault_token_mint: UncheckedAccount<'info>,
    /// CHECK: Treasury token account — initialized separately.
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.vault_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(mut, constraint = user_usdc.owner == user.key())]
    pub user_usdc: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = treasury.key() == vault.treasury)]
    pub treasury: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_mint.key() == vault.vault_token_mint)]
    pub vault_token_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_vault_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub vault_token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.vault_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_usdc: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = treasury.key() == vault.treasury)]
    pub treasury: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_mint.key() == vault.vault_token_mint)]
    pub vault_token_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_vault_token: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub vault_token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct UpdateNav<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.vault_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultState>,
    pub authority: Signer<'info>,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
    pub shares_minted: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub vault: Pubkey,
    pub shares_burned: u64,
    pub usdc_returned: u64,
    pub timestamp: i64,
}

#[event]
pub struct NavUpdateEvent {
    pub vault: Pubkey,
    pub nav: u64,
    pub price_per_share: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum VaultError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Insufficient shares for withdrawal")]
    InsufficientShares,
    #[msg("Unauthorized — only vault authority can perform this action")]
    Unauthorized,
}
