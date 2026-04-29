import { Connection, PublicKey } from "@solana/web3.js";
import type { ConfirmedSignatureInfo } from "@solana/web3.js";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// ---------------- CONFIG ----------------
// Fill these in before running.
const PROGRAM_ID = new PublicKey(process.env.AXIOM_PROGRAM_ID || "");
const RPC_URL = process.env.AXIOM_RPC_URL || "";

const connection = new Connection(RPC_URL, "confirmed");
const FETCH_DELAY_MS = 120;
const SIGNATURES_LIMIT = 1000;

const DATA_DIR = path.resolve("./scripts/axiom-report/data");
const TX_FILE = path.join(DATA_DIR, "transactions.jsonl");
const PROCESSED_FILE = path.join(DATA_DIR, "processed.jsonl");

type CleanInstruction = {
  programId: string;
  accounts: string[];
  data: string;
};

type ParsedTx = {
  signature: string;
  slot: number;
  timestamp: number | null;
  success: boolean;
  error: unknown | null;
  fee: number;
  signers: string[];
  accounts: string[];
  instructions: CleanInstruction[];
  logs: string[];
  preBalances: number[];
  postBalances: number[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadProcessed(): Promise<Set<string>> {
  try {
    if (!existsSync(PROCESSED_FILE)) return new Set();
    const data = await fs.readFile(PROCESSED_FILE, "utf-8");
    const lines = data.split("\n").filter(Boolean);
    return new Set(lines.map((l) => JSON.parse(l) as string));
  } catch {
    return new Set();
  }
}

async function appendProcessed(signature: string): Promise<void> {
  await fs.appendFile(PROCESSED_FILE, JSON.stringify(signature) + "\n");
}

async function appendTx(tx: ParsedTx): Promise<void> {
  await fs.appendFile(TX_FILE, JSON.stringify(tx) + "\n");
}

async function getAllSignatures(address: PublicKey): Promise<ConfirmedSignatureInfo[]> {
  const all: ConfirmedSignatureInfo[] = [];
  let before: string | undefined;

  while (true) {
    const batch = await connection.getSignaturesForAddress(address, {
      limit: SIGNATURES_LIMIT,
      before,
    });
    if (!batch.length) break;

    all.push(...batch);
    before = batch[batch.length - 1]?.signature;
    console.log(`Fetched ${all.length} signatures...`);
    await sleep(200);
  }

  return all;
}

async function getTransactionDetails(signature: string): Promise<ParsedTx | null> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || !tx.meta || !tx.transaction) return null;

    const meta = tx.meta;
    const message = tx.transaction.message;
    const staticKeys = message.staticAccountKeys.map((k) => k.toBase58());
    const loadedWritable = meta.loadedAddresses?.writable.map((k) => k.toBase58()) ?? [];
    const loadedReadonly = meta.loadedAddresses?.readonly.map((k) => k.toBase58()) ?? [];
    const accountKeys = [...staticKeys, ...loadedWritable, ...loadedReadonly];
    const signers = accountKeys.slice(0, message.header.numRequiredSignatures);

    const instructions: CleanInstruction[] = message.compiledInstructions.map((ix) => {
      const programId = accountKeys[ix.programIdIndex] ?? "UNKNOWN_PROGRAM";
      const accounts = ix.accountKeyIndexes.map((idx) => accountKeys[idx] ?? "UNKNOWN_ACCOUNT");
      return {
        programId,
        accounts,
        data: Buffer.from(ix.data).toString("base64"),
      };
    });

    return {
      signature,
      slot: tx.slot,
      timestamp: tx.blockTime ?? null,
      success: meta.err === null,
      error: meta.err ?? null,
      fee: meta.fee,
      signers,
      accounts: accountKeys,
      instructions,
      logs: meta.logMessages ?? [],
      preBalances: meta.preBalances ?? [],
      postBalances: meta.postBalances ?? [],
    };
  } catch (err) {
    console.error(`Error fetching tx ${signature}`, err);
    return null;
  }
}

async function main(): Promise<void> {
  if (!RPC_URL || !process.env.AXIOM_PROGRAM_ID) {
    throw new Error("Set AXIOM_PROGRAM_ID and AXIOM_RPC_URL environment variables.");
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const processed = await loadProcessed();
  console.log(`Already processed: ${processed.size}`);

  const signatures = await getAllSignatures(PROGRAM_ID);
  console.log(`Total signatures: ${signatures.length}`);

  let newProcessedCount = 0;
  for (let i = 0; i < signatures.length; i++) {
    const signature = signatures[i]?.signature;
    if (!signature || processed.has(signature)) continue;

    console.log(`Processing ${i + 1}/${signatures.length}`);
    const tx = await getTransactionDetails(signature);
    if (tx) await appendTx(tx);

    await appendProcessed(signature);
    processed.add(signature);
    newProcessedCount++;
    await sleep(FETCH_DELAY_MS);
  }

  console.log(`Done. New processed: ${newProcessedCount}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});

