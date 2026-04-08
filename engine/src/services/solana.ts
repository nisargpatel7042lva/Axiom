import { Connection, Keypair, Transaction, VersionedTransaction, SendOptions } from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "../config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("solana");

let _connection: Connection | null = null;
let _authority: Keypair | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(CONFIG.RPC_URL, "confirmed");
    log.info(`Connected to ${CONFIG.RPC_URL}`);
  }
  return _connection;
}

export function getAuthority(): Keypair {
  if (!_authority) {
    const resolved = path.resolve(CONFIG.KEYPAIR_PATH);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Keypair file not found at ${resolved}`);
    }
    const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
    _authority = Keypair.fromSecretKey(Uint8Array.from(raw));
    log.info(`Authority loaded: ${_authority.publicKey.toBase58()}`);
  }
  return _authority;
}

export async function signAndSend(
  serializedTx: string,
  opts?: SendOptions,
): Promise<string> {
  const connection = getConnection();
  const authority = getAuthority();
  const txBuffer = Buffer.from(serializedTx, "base64");

  let signature: string;

  try {
    const vtx = VersionedTransaction.deserialize(txBuffer);
    vtx.sign([authority]);
    signature = await connection.sendTransaction(vtx, opts);
  } catch {
    const tx = Transaction.from(txBuffer);
    tx.partialSign(authority);
    signature = await connection.sendRawTransaction(tx.serialize(), opts);
  }

  log.info(`Transaction sent: ${signature}`);
  await connection.confirmTransaction(signature, "confirmed");
  log.info(`Transaction confirmed: ${signature}`);
  return signature;
}

export async function getTokenBalance(
  tokenAccountPubkey: import("@solana/web3.js").PublicKey,
): Promise<number> {
  const connection = getConnection();
  try {
    const balance = await connection.getTokenAccountBalance(tokenAccountPubkey);
    return parseFloat(balance.value.uiAmountString || "0");
  } catch {
    return 0;
  }
}
