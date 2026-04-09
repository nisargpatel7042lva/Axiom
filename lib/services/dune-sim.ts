import axios, { type AxiosInstance } from "axios";

const DUNE_SIM_BASE = "https://api.sim.dune.com/v1";

function getApiKey(): string {
  const key =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_DUNE_SIM_API_KEY
      : process.env.DUNE_SIM_API_KEY ?? process.env.NEXT_PUBLIC_DUNE_SIM_API_KEY;
  return key ?? "";
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: DUNE_SIM_BASE,
    timeout: 15_000,
    headers: {
      "X-Sim-Api-Key": getApiKey(),
    },
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenBalance {
  chain: string;
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
  name: string;
  price_usd: number | null;
  value_usd: number | null;
  logo_url: string | null;
}

export interface DuneTransaction {
  hash: string;
  block_number: number;
  block_time: string;
  from: string;
  to: string;
  value: string;
  success: boolean;
  transaction_type: string;
  decoded: {
    name: string;
    inputs: Record<string, unknown>;
  } | null;
}

export interface DuneTokenInfo {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  logo_url: string | null;
  price_usd: number | null;
  total_supply: string | null;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Fetch all SPL token balances for a Solana wallet.
 * Powers: DepositModal (real USDC balance), Portfolio page (token holdings).
 */
export async function getWalletBalances(
  address: string,
): Promise<TokenBalance[]> {
  const client = createClient();
  try {
    const { data } = await client.get<{ balances: TokenBalance[] }>(
      `/balances/solana/${address}`,
    );
    return data.balances ?? [];
  } catch (err) {
    console.error("[dune-sim] getWalletBalances failed:", err);
    return [];
  }
}

/**
 * Get the USDC balance for a wallet (convenience wrapper).
 */
export async function getUsdcBalance(
  address: string,
  usdcMint: string,
): Promise<number> {
  const balances = await getWalletBalances(address);
  const usdc = balances.find(
    (b) => b.address.toLowerCase() === usdcMint.toLowerCase(),
  );
  if (!usdc) return 0;
  return parseFloat(usdc.amount) / Math.pow(10, usdc.decimals);
}

/**
 * Fetch recent transactions for a Solana wallet.
 * Powers: Vault detail Activity Feed with real deposit/withdraw/trade data.
 */
export async function getTransactionHistory(
  address: string,
  limit = 20,
): Promise<DuneTransaction[]> {
  const client = createClient();
  try {
    const { data } = await client.get<{ transactions: DuneTransaction[] }>(
      `/transactions/solana/${address}`,
      { params: { limit } },
    );
    return data.transactions ?? [];
  } catch (err) {
    console.error("[dune-sim] getTransactionHistory failed:", err);
    return [];
  }
}

/**
 * Fetch token metadata for a given mint address.
 * Powers: enriching vault share token display, prediction market token info.
 */
export async function getTokenMetadata(
  mintAddress: string,
): Promise<DuneTokenInfo | null> {
  const client = createClient();
  try {
    const { data } = await client.get<DuneTokenInfo>(
      `/tokens/solana/${mintAddress}`,
    );
    return data;
  } catch (err) {
    console.error("[dune-sim] getTokenMetadata failed:", err);
    return null;
  }
}

/**
 * Parse Dune SIM transactions into human-readable activity feed entries.
 */
export function parseActivityFeed(
  transactions: DuneTransaction[],
): { action: string; timestamp: string; hash: string }[] {
  return transactions.map((tx) => {
    let action = "Transaction";

    if (tx.decoded?.name) {
      const name = tx.decoded.name.toLowerCase();
      if (name.includes("deposit")) action = "Deposited USDC to vault";
      else if (name.includes("withdraw")) action = "Withdrew from vault";
      else if (name.includes("sync_nav")) action = "NAV synced on-chain";
      else if (name.includes("order") || name.includes("swap"))
        action = "Executed prediction trade";
      else action = tx.decoded.name;
    }

    return {
      action,
      timestamp: tx.block_time,
      hash: tx.hash,
    };
  });
}
