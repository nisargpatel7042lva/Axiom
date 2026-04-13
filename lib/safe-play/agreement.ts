/**
 * Bump this string when disclosure text changes so users re-acknowledge.
 */
export const SAFE_PLAY_AGREEMENT_VERSION = "2026-04-12";

/**
 * Exact bytes the wallet signs (UTF-8). Must stay stable for a given version.
 */
export function buildAgreementMessage(walletAddress: string): string {
  return `SPECTRA VAULTS — SAFE PLAY USER ACKNOWLEDGMENT
Version: ${SAFE_PLAY_AGREEMENT_VERSION}

By signing this message with my Solana wallet, I confirm that I have read and understood the following.

WHAT SPECTRA DOES
• Spectra is an interface to vault programs on Solana: you deposit USDC, receive vault share tokens, and may withdraw subject to on-chain rules.
• Deposits, withdrawals, pauses, NAV updates, and fee collection happen only when I approve the corresponding Solana transactions in my wallet. No transaction runs without my explicit signature.
• NAV and strategy behavior may be updated by the vault authority as designed by the program. I understand that reported vault value can change and that prediction-market-related strategies carry risk.

RISKS I ACCEPT
• Digital assets and DeFi involve risk of loss, including smart contract bugs, RPC issues, wallet compromise, and market or liquidity risk. Nothing in the app is personalized financial, legal, or tax advice.
• I am responsible for the wallet I connect, the network I use (e.g. devnet vs mainnet), and verifying addresses, amounts, and program IDs before signing.

SAFE PLAY
• I will only sign transactions I understand. I will use official Spectra links and verify I am on the intended cluster and site.
• If anything looks unexpected, I will not sign and will disconnect my wallet.

Wallet address (binding): ${walletAddress}

This message does not move funds by itself. It records my informed consent to use Spectra under these terms.`;
}

/** Short bullets for the modal UI (subset of the signed document). */
export const SAFE_PLAY_SUMMARY_POINTS = [
  "Transactions only run when you approve them in your wallet — nothing moves without your signature.",
  "Vaults use on-chain rules; NAV and strategy updates follow the program you interact with.",
  "Crypto and DeFi carry real risk (including loss of funds). This is not financial advice.",
  "Only sign what you understand; use official links and verify network and amounts before signing.",
] as const;
