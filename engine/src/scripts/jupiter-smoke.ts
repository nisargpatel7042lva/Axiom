import "../env-bootstrap.js";

import { CONFIG } from "../config.js";
import { jupiterPrediction } from "../services/jupiter-prediction.js";
import { jupiterPrice } from "../services/jupiter-price.js";
import { jupiterTokens } from "../services/jupiter-tokens.js";
import { jupiterTrigger } from "../services/jupiter-trigger.js";
import { jupiterLend } from "../services/jupiter-lend.js";

type Status = "PASS" | "WARN" | "FAIL";

type CheckResult = {
  name: string;
  status: Status;
  detail: string;
};

async function runCheck(
  name: string,
  fn: () => Promise<string>,
  warnOnError = false,
): Promise<CheckResult> {
  try {
    const detail = await fn();
    return { name, status: "PASS", detail };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      name,
      status: warnOnError ? "WARN" : "FAIL",
      detail: msg,
    };
  }
}

async function main() {
  const owner = process.env.SMOKE_WALLET?.trim() || CONFIG.VAULT_PROGRAM_ID;
  const results: CheckResult[] = [];

  results.push(
    await runCheck("Prediction API", async () => {
      const events = await jupiterPrediction.getActiveEvents();
      return `events=${events.length}`;
    }),
  );

  results.push(
    await runCheck("Price API", async () => {
      const usdc = await jupiterPrice.getUsdcPrice();
      return `usdc=${usdc.toFixed(6)}`;
    }),
  );

  results.push(
    await runCheck(
      "Tokens API",
      async () => {
        const token = await jupiterTokens.getToken(CONFIG.USDC_MINT);
        if (!token) throw new Error("USDC mint metadata not found");
        return `symbol=${token.symbol || "unknown"}, decimals=${token.decimals}`;
      },
      true,
    ),
  );

  results.push(
    await runCheck("Trigger API", async () => {
      const orders = await jupiterTrigger.getOrders(owner);
      return `orders=${orders.length}`;
    }),
  );

  const isMainnet = CONFIG.RPC_URL.toLowerCase().includes("mainnet");
  results.push(
    await runCheck(
      "Lend API",
      async () => {
        const bal = await jupiterLend.getEarnBalance();
        return isMainnet
          ? `earn_balance=${bal.toFixed(6)}`
          : `skipped_on_non_mainnet (rpc=${CONFIG.RPC_URL})`;
      },
      true,
    ),
  );

  const maxName = Math.max(...results.map((r) => r.name.length));
  console.log("\nJupiter smoke results:\n");
  for (const r of results) {
    const pad = " ".repeat(maxName - r.name.length);
    console.log(`${r.status.padEnd(4)} ${r.name}${pad}  ${r.detail}`);
  }

  const failed = results.filter((r) => r.status === "FAIL");
  const warned = results.filter((r) => r.status === "WARN");
  console.log(
    `\nSummary: pass=${results.length - failed.length - warned.length}, warn=${warned.length}, fail=${failed.length}`,
  );

  if (failed.length > 0) process.exit(1);
}

void main();

