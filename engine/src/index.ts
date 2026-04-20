import "./env-bootstrap.js";
import cron from "node-cron";
import express from "express";
import { runMarketScanner } from "./jobs/market-scanner.js";
import { runPositionManager } from "./jobs/position-manager.js";
import { runYieldRouter } from "./jobs/yield-router.js";
import { runNavCalculator, getAllNavs } from "./jobs/nav-calculator.js";
import { getActivePositions, getTradeHistory } from "./jobs/position-manager.js";
import { getVaultNavYieldMetrics } from "./data/vault-nav-snapshots.js";
import { getAllVaultConfigs, CONFIG } from "./config.js";
import { createLogger } from "./utils/logger.js";
import type { EngineHealth } from "./types/index.js";

const log = createLogger("engine");
const startTime = Date.now();

let lastScan: string | null = null;
let lastNavSync: string | null = null;
let lastPositionCheck: string | null = null;
let lastYieldRoute: string | null = null;

cron.schedule("*/30 * * * *", async () => {
  log.info("[cron] Market scanner + NAV (sequential)");
  try {
    await runMarketScanner();
    lastScan = new Date().toISOString();
    await runNavCalculator();
    lastNavSync = new Date().toISOString();
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

app.listen(CONFIG.HEALTH_PORT, () => {
  log.info(`Health endpoint listening on http://localhost:${CONFIG.HEALTH_PORT}/health`);
});

async function bootstrap(): Promise<void> {
  log.info("Spectra Engine starting...");

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

  log.info("Spectra Engine running. Cron jobs active.");
}

void bootstrap();
