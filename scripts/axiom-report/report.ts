import fs from "node:fs/promises";
import path from "node:path";

type OutputInstruction = {
  total: number;
  success: number;
  failure: number;
  successRate: string;
  failureRate: string;
  errors: Record<string, number>;
  wallets: number;
  sampleLogs: string[][];
};

type AnalysisOutput = {
  instructions: Record<string, OutputInstruction>;
  globalErrors: Record<string, number>;
  wallets: {
    totalUniqueWallets: number;
    topWallets: Array<{
      wallet: string;
      txCount: number;
      success: number;
      failure: number;
      instructions: Record<string, number>;
    }>;
  };
};

type Report = {
  generatedAt: string;
  cards: {
    totalTransactions: number;
    uniqueWallets: number;
    instructionKinds: number;
    overallSuccessRate: string;
  };
  instructionStats: Array<{
    instruction: string;
    total: number;
    success: number;
    failure: number;
    successPct: string;
    wallets: number;
  }>;
  topErrors: Array<{ error: string; count: number }>;
  topWallets: Array<{
    wallet: string;
    tx: number;
    success: number;
    failure: number;
    successPct: string;
  }>;
};

const DATA_DIR = path.resolve("./scripts/axiom-report/data");
const ANALYSIS_FILE = path.join(DATA_DIR, "analysis.json");
const REPORT_FILE = path.join(DATA_DIR, "report.json");

function pct(n: number, d: number): string {
  if (!d) return "0.00%";
  return ((n / d) * 100).toFixed(2) + "%";
}

async function buildReport(): Promise<void> {
  const raw = await fs.readFile(ANALYSIS_FILE, "utf-8");
  const analysis = JSON.parse(raw) as AnalysisOutput;

  const instructionEntries = Object.entries(analysis.instructions);
  const totalTx = instructionEntries.reduce((acc, [, s]) => acc + s.total, 0);
  const totalSuccess = instructionEntries.reduce((acc, [, s]) => acc + s.success, 0);

  const report: Report = {
    generatedAt: new Date().toISOString(),
    cards: {
      totalTransactions: totalTx,
      uniqueWallets: analysis.wallets.totalUniqueWallets,
      instructionKinds: instructionEntries.length,
      overallSuccessRate: pct(totalSuccess, totalTx),
    },
    instructionStats: instructionEntries
      .map(([instruction, s]) => ({
        instruction,
        total: s.total,
        success: s.success,
        failure: s.failure,
        successPct: pct(s.success, s.total),
        wallets: s.wallets,
      }))
      .sort((a, b) => b.total - a.total),
    topErrors: Object.entries(analysis.globalErrors)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    topWallets: analysis.wallets.topWallets.map((w) => ({
      wallet: w.wallet,
      tx: w.txCount,
      success: w.success,
      failure: w.failure,
      successPct: pct(w.success, w.txCount),
    })),
  };

  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log("report.json generated");
}

buildReport().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

