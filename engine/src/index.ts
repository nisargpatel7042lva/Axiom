import "./env-bootstrap.js";
import cron from "node-cron";
import express from "express";
import { runMarketScanner } from "./jobs/market-scanner.js";
import { runPositionManager, initPositionManager } from "./jobs/position-manager.js";
import { runYieldRouter } from "./jobs/yield-router.js";
import { runNavCalculator, getAllNavs } from "./jobs/nav-calculator.js";
import { runFeeCollector } from "./jobs/fee-collector.js";
import { getActivePositions, getDecisionHistory, getTradeHistory } from "./jobs/position-manager.js";
import { getVaultNavYieldMetrics } from "./data/vault-nav-snapshots.js";
import { getAllVaultConfigs, CONFIG, inferClusterFromRpc } from "./config.js";
import { startRpcFastStream, stopRpcFastStream, isRpcFastStreamActive } from "./services/rpc-fast-stream.js";
import { deriveVaultPda } from "./services/vault-contract.js";
import { createLogger } from "./utils/logger.js";
import type { EngineHealth } from "./types/index.js";

const log = createLogger("engine");
const startTime = Date.now();

function validateStartupEnvironment(): void {
  const cluster = inferClusterFromRpc(CONFIG.RPC_URL);
  const isMainnetUsdc =
    CONFIG.USDC_MINT === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const isDevnetUsdc =
    CONFIG.USDC_MINT === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

  log.info(
    `Startup profile: cluster=${cluster}, execution_mode=${CONFIG.EXECUTION_MODE}, usdc_mint=${CONFIG.USDC_MINT}`,
  );

  if (cluster === "devnet" && !isDevnetUsdc) {
    log.warn("RPC is devnet but USDC mint is not devnet USDC; expect transaction simulation failures.");
  }
  if (cluster === "mainnet-beta" && !isMainnetUsdc) {
    log.warn("RPC is mainnet but USDC mint is not mainnet USDC; check env consistency.");
  }
  if (cluster !== "mainnet-beta" && CONFIG.EXECUTION_MODE === "live") {
    log.warn("Live execution requested on non-mainnet RPC; prediction orders may fail and fallback behavior may trigger.");
  }
}

let lastScan: string | null = null;
let lastNavSync: string | null = null;
let lastPositionCheck: string | null = null;
let lastYieldRoute: string | null = null;
let lastNavCalcTime = 0;

cron.schedule("*/30 * * * *", async () => {
  log.info("[cron] Market scanner + NAV (sequential)");
  try {
    await runMarketScanner();
    lastScan = new Date().toISOString();
    await runNavCalculator();
    lastNavSync = new Date().toISOString();
    lastNavCalcTime = Date.now();
  } catch (err) {
    log.error("Market scanner / NAV cycle failed", err);
  }
});

cron.schedule("*/15 * * * *", async () => {
  log.info("[cron] Position manager");
  try {
    await runPositionManager();
    lastPositionCheck = new Date().toISOString();
  } catch (err) {
    log.error("Position manager failed", err);
  }
});

cron.schedule("0 * * * *", async () => {
  log.info("[cron] Yield router");
  try {
    await runYieldRouter();
    lastYieldRoute = new Date().toISOString();
  } catch (err) {
    log.error("Yield router failed", err);
  }
});

// Daily at 00:05 UTC — collect performance fees when PPS > HWM.
// Daily cadence is sufficient; more frequent runs waste SOL on tx fees.
cron.schedule("5 0 * * *", async () => {
  log.info("[cron] Fee collector");
  try {
    await runFeeCollector();
  } catch (err) {
    log.error("Fee collector failed", err);
  }
});

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  const vaults = getAllVaultConfigs();
  let totalPositions = 0;
  for (const v of vaults) {
    totalPositions += getActivePositions(v.strategyType).length;
  }

  const health: EngineHealth = {
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    lastScan,
    lastNavSync,
    lastPositionCheck,
    lastYieldRoute,
    vaultCount: vaults.length,
    totalPositions,
    rpcProvider: (process.env.RPC_FAST_HTTP_URL?.trim() || CONFIG.RPC_URL.includes("rpcfast")) ? "rpcfast" : "public",
    rpcFastStreamActive: isRpcFastStreamActive(),
  };

  res.json(health);
});

app.get("/api/navs", (_req, res) => {
  res.json(getAllNavs());
});

app.get("/api/vaults/:vaultId/yield-metrics", async (req, res) => {
  const id = parseInt(req.params.vaultId, 10);
  if (!Number.isFinite(id) || id < 0) {
    res.status(400).json({ error: "Invalid vaultId" });
    return;
  }
  try {
    const metrics = await getVaultNavYieldMetrics(id);
    res.json(metrics);
  } catch (e) {
    log.error("yield-metrics failed", e);
    res.status(500).json({ error: "Failed to read yield metrics" });
  }
});

app.get("/api/positions/:vaultId", (req, res) => {
  res.json(getActivePositions(req.params.vaultId));
});

app.get("/api/trades", (_req, res) => {
  res.json(getTradeHistory());
});

app.get("/api/decisions", (_req, res) => {
  res.json(getDecisionHistory());
});

app.get("/api/transparency", (_req, res) => {
  const navs = getAllNavs();
  const trades = getTradeHistory();
  const decisions = getDecisionHistory();
  const vaults = getAllVaultConfigs().map((v) => ({
    id: v.id,
    strategyType: v.strategyType,
    name: v.name,
    positions: getActivePositions(v.strategyType).length,
  }));
  res.json({
    generatedAt: new Date().toISOString(),
    health: {
      lastScan,
      lastNavSync,
      lastPositionCheck,
      lastYieldRoute,
      rpcProvider: (process.env.RPC_FAST_HTTP_URL?.trim() || CONFIG.RPC_URL.includes("rpcfast")) ? "rpcfast" : "public",
      rpcFastStreamActive: isRpcFastStreamActive(),
    },
    vaults,
    navs,
    trades,
    decisions,
  });
});

app.listen(CONFIG.HEALTH_PORT, "0.0.0.0", () => {
  log.info(`Health endpoint listening on http://0.0.0.0:${CONFIG.HEALTH_PORT}/health`);
});

let navDebounceTimer: NodeJS.Timeout | null = null;

async function bootstrap(): Promise<void> {
  log.info("Spectra Engine starting...");
  validateStartupEnvironment();

  // Restore persisted positions before any NAV or position cycle runs.
  // Without this, a restart zeroes activePositions, causing sync_nav to
  // under-report NAV and allowing users to withdraw at a depressed share price.
  try {
    await initPositionManager();
  } catch (err) {
    log.error("Position manager init failed (non-fatal, continuing with empty state)", err);
  }

  try {
    log.info("Running initial market scan...");
    await runMarketScanner();
    lastScan = new Date().toISOString();
  } catch (err) {
    log.error("Initial market scan failed (non-fatal)", err);
  }

  try {
    log.info("Running initial NAV (after scan)...");
    await runNavCalculator();
    lastNavSync = new Date().toISOString();
  } catch (err) {
    log.error("Initial NAV calculation failed (non-fatal)", err);
  }

  try {
    log.info("Running initial position check (after NAV)...");
    await runPositionManager();
    lastPositionCheck = new Date().toISOString();
  } catch (err) {
    log.error("Initial position check failed (non-fatal)", err);
  }

  // Start RPC Fast WebSocket stream for real-time vault account change notifications.
  // Falls back gracefully to cron-only if RPC Fast is not configured.
  const vaultPdas = getAllVaultConfigs().map((v) => {
    const [pda] = deriveVaultPda(v.id);
    return { vaultId: v.id, pda };
  });
  startRpcFastStream(vaultPdas, (vaultId) => {
    const now = Date.now();
    if (now - lastNavCalcTime < 10_000) {
      log.debug(`[RPC Fast stream] Vault ${vaultId} changed — ignoring due to recent NAV calc (${(now - lastNavCalcTime) / 1000}s ago)`);
      return;
    }
    log.info(`[RPC Fast stream] Vault ${vaultId} changed — debouncing NAV recalc`);
    if (navDebounceTimer) clearTimeout(navDebounceTimer);
    navDebounceTimer = setTimeout(async () => {
      navDebounceTimer = null;
      log.info("[RPC Fast stream] Debounce settled — running NAV recalc");
      try {
        await runNavCalculator();
        lastNavSync = new Date().toISOString();
        lastNavCalcTime = Date.now();
      } catch (err) {
        log.error("On-change NAV recalc failed", err);
      }
    }, 3_000);
  });

  log.info(
    `Spectra Engine running. RPC: ${CONFIG.RPC_URL} | ` +
    `Stream: ${isRpcFastStreamActive() ? "RPC Fast WebSocket active" : "cron-only"}`
  );
}

process.on("SIGTERM", async () => {
  await stopRpcFastStream();
  process.exit(0);
});

void bootstrap();
