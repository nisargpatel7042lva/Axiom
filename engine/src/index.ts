import "dotenv/config";
import { CronJob } from "cron";
import { MarketScanner } from "./jobs/market-scanner.js";
import { PositionManager } from "./jobs/position-manager.js";
import { YieldRouter } from "./jobs/yield-router.js";
import { NavCalculator } from "./jobs/nav-calculator.js";

console.log("🔮 Spectra Engine starting...");

const scanner = new MarketScanner();
const positionManager = new PositionManager();
const yieldRouter = new YieldRouter();
const navCalc = new NavCalculator();

// Market scan: every 5 minutes
new CronJob("*/5 * * * *", async () => {
  console.log("[cron] Running market scanner...");
  try {
    await scanner.run();
  } catch (err) {
    console.error("[market-scanner] Error:", err);
  }
}, null, true);

// Position management: every 15 minutes
new CronJob("*/15 * * * *", async () => {
  console.log("[cron] Running position manager...");
  try {
    await positionManager.run();
  } catch (err) {
    console.error("[position-manager] Error:", err);
  }
}, null, true);

// Yield routing: every hour
new CronJob("0 * * * *", async () => {
  console.log("[cron] Running yield router...");
  try {
    await yieldRouter.run();
  } catch (err) {
    console.error("[yield-router] Error:", err);
  }
}, null, true);

// NAV calculation: every 10 minutes
new CronJob("*/10 * * * *", async () => {
  console.log("[cron] Running NAV calculator...");
  try {
    await navCalc.run();
  } catch (err) {
    console.error("[nav-calculator] Error:", err);
  }
}, null, true);

// Run initial scan on startup
(async () => {
  console.log("[startup] Running initial market scan and NAV calculation...");
  await scanner.run();
  await navCalc.run();
  console.log("✅ Spectra Engine running. Cron jobs active.");
})();
