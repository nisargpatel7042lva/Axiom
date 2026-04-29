import fs from "node:fs/promises";
import readline from "node:readline";
import { createReadStream } from "node:fs";
import path from "node:path";

const PROGRAM_ID = process.env.AXIOM_PROGRAM_ID || "";
const IDL_PATH = process.env.AXIOM_IDL_PATH || "./scripts/axiom-report/axiom_program.json";

const EXCLUDED_WALLETS = new Set<string>(
  (process.env.AXIOM_EXCLUDED_WALLETS || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean),
);

const DATA_DIR = path.resolve("./scripts/axiom-report/data");
const TX_FILE = path.join(DATA_DIR, "transactions.jsonl");
const ANALYSIS_FILE = path.join(DATA_DIR, "analysis.json");

type Instruction = {
  programId: string;
  accounts: string[];
  data: string;
};

type Transaction = {
  signature: string;
  slot: number;
  timestamp: number | null;
  success: boolean;
  error: unknown | null;
  fee: number;
  signers: string[];
  accounts: string[];
  instructions: Instruction[];
  logs: string[];
  preBalances: number[];
  postBalances: number[];
};

type InstructionStats = {
  total: number;
  success: number;
  failure: number;
  errors: Record<string, number>;
  wallets: Set<string>;
  sampleLogs: string[][];
};

type WalletStats = {
  txCount: number;
  success: number;
  failure: number;
  instructions: Record<string, number>;
};

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

type Output = {
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

type IdlInstruction = {
  name: string;
  discriminator: number[];
};

type IdlError = {
  code: number;
  name: string;
  msg?: string;
};

async function loadIdl(): Promise<{
  discriminatorMap: Map<string, string>;
  errorMap: Map<number, string>;
}> {
  const idlRaw = await fs.readFile(IDL_PATH, "utf-8");
  const idl = JSON.parse(idlRaw) as {
    instructions: IdlInstruction[];
    errors?: IdlError[];
  };

  const discriminatorMap = new Map<string, string>();
  const errorMap = new Map<number, string>();
  for (const ix of idl.instructions) {
    discriminatorMap.set(Buffer.from(ix.discriminator).toString("hex"), ix.name);
  }
  for (const err of idl.errors ?? []) {
    errorMap.set(err.code, err.name);
  }
  return { discriminatorMap, errorMap };
}

function parseError(err: unknown, errorMap: Map<number, string>, logs: string[]): string {
  if (!err) return "unknown";
  try {
    const parsed = err as {
      InstructionError?: [number, { Custom?: number }];
    };
    if (parsed?.InstructionError) {
      const [, detail] = parsed.InstructionError;
      if (detail && "Custom" in detail && typeof detail.Custom === "number") {
        const code = detail.Custom;
        if (errorMap.has(code)) return `${errorMap.get(code)} (${code})`;
        if (code === 1) return "System:InsufficientLamports (1)";
        const logLine = logs.find((l) => l.includes("Error Code:"));
        if (logLine) {
          const match = logLine.match(/Error Code: ([^.]*)/);
          if (match) return `External:${match[1]} (${code})`;
        }
        return `External:Custom (${code})`;
      }
    }
    return JSON.stringify(err);
  } catch {
    return "unknown";
  }
}

async function analyze(): Promise<void> {
  if (!PROGRAM_ID) throw new Error("Set AXIOM_PROGRAM_ID.");
  const { discriminatorMap, errorMap } = await loadIdl();

  const fileStream = createReadStream(TX_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const instructionStats = new Map<string, InstructionStats>();
  const globalErrors = new Map<string, number>();
  const walletStats = new Map<string, WalletStats>();
  const uniqueWallets = new Set<string>();
  let totalTx = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const tx: Transaction = JSON.parse(line);
    totalTx++;

    for (const signer of tx.signers) {
      if (EXCLUDED_WALLETS.has(signer)) continue;
      uniqueWallets.add(signer);
      if (!walletStats.has(signer)) {
        walletStats.set(signer, { txCount: 0, success: 0, failure: 0, instructions: {} });
      }
      const wallet = walletStats.get(signer)!;
      wallet.txCount++;
      tx.success ? wallet.success++ : wallet.failure++;
    }

    for (const ix of tx.instructions) {
      if (ix.programId !== PROGRAM_ID) continue;
      const raw = Buffer.from(ix.data, "base64");
      if (raw.length < 8) continue;
      const name = discriminatorMap.get(raw.subarray(0, 8).toString("hex")) ?? "unknown";

      if (!instructionStats.has(name)) {
        instructionStats.set(name, {
          total: 0,
          success: 0,
          failure: 0,
          errors: {},
          wallets: new Set<string>(),
          sampleLogs: [],
        });
      }
      const stat = instructionStats.get(name)!;
      stat.total++;

      if (tx.success) {
        stat.success++;
      } else {
        stat.failure++;
        const errKey = parseError(tx.error, errorMap, tx.logs);
        stat.errors[errKey] = (stat.errors[errKey] ?? 0) + 1;
        globalErrors.set(errKey, (globalErrors.get(errKey) ?? 0) + 1);
        if (stat.sampleLogs.length < 3) stat.sampleLogs.push([...tx.logs]);
      }

      for (const signer of tx.signers) {
        if (EXCLUDED_WALLETS.has(signer)) continue;
        stat.wallets.add(signer);
        const wallet = walletStats.get(signer);
        if (wallet) wallet.instructions[name] = (wallet.instructions[name] ?? 0) + 1;
      }
    }
  }

  const output: Output = {
    instructions: {},
    globalErrors: {},
    wallets: { totalUniqueWallets: uniqueWallets.size, topWallets: [] },
  };

  for (const [name, stat] of instructionStats.entries()) {
    output.instructions[name] = {
      total: stat.total,
      success: stat.success,
      failure: stat.failure,
      successRate: ((stat.success / stat.total) * 100).toFixed(2) + "%",
      failureRate: ((stat.failure / stat.total) * 100).toFixed(2) + "%",
      errors: stat.errors,
      wallets: stat.wallets.size,
      sampleLogs: stat.sampleLogs,
    };
  }

  for (const [err, count] of globalErrors.entries()) output.globalErrors[err] = count;

  output.wallets.topWallets = [...walletStats.entries()]
    .sort((a, b) => b[1].txCount - a[1].txCount)
    .slice(0, 20)
    .map(([wallet, stats]) => ({
      wallet,
      txCount: stats.txCount,
      success: stats.success,
      failure: stats.failure,
      instructions: stats.instructions,
    }));

  await fs.writeFile(ANALYSIS_FILE, JSON.stringify(output, null, 2));
  console.log(`Analysis complete. Total TX: ${totalTx}, Unique wallets: ${output.wallets.totalUniqueWallets}`);
}

analyze().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

