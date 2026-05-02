import type { Idl, Program } from "@coral-xyz/anchor";
import {
  SendTransactionError,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import bs58 from "bs58";

function messageLooksLikeAlreadyProcessed(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("already been processed");
}

async function ensureConfirmed(
  connection: Program<Idl>["provider"]["connection"],
  signature: TransactionSignature,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<void> {
  const result = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  if (result.value.err) {
    throw new Error(`Transaction ${signature} failed: ${JSON.stringify(result.value.err)}`);
  }
}

/**
 * Signs with the Anchor wallet, sends the legacy transaction once (no resubmit
 * loop), then confirms with blockhash expiry. Handles "already been processed"
 * when the same signed bytes were already accepted (e.g. a prior send or RPC
 * retry) by treating an already-confirmed signature as success.
 */
export async function signSendAndConfirmLegacyTx(
  program: Program<Idl>,
  tx: Transaction,
): Promise<TransactionSignature> {
  const { connection, wallet } = program.provider;
  if (!wallet?.publicKey) {
    throw new Error("Wallet required to sign transaction");
  }

  tx.feePayer = wallet.publicKey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  const signed = await wallet.signTransaction(tx);
  const payerSigBytes = signed.signatures[0]?.signature;
  if (!payerSigBytes) {
    throw new Error("Wallet did not produce a transaction signature");
  }

  const expectedSig = bs58.encode(payerSigBytes) as TransactionSignature;
  const raw = signed.serialize();

  try {
    const sig = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      maxRetries: 0,
    });
    await ensureConfirmed(connection, sig, blockhash, lastValidBlockHeight);
    return sig;
  } catch (err) {
    if (err instanceof SendTransactionError) {
      if (messageLooksLikeAlreadyProcessed(err)) {
        const { value } = await connection.getSignatureStatuses([expectedSig]);
        const st = value[0];
        if (st && !st.err) {
          try {
            await ensureConfirmed(connection, expectedSig, blockhash, lastValidBlockHeight);
          } catch {
            const again = await connection.getSignatureStatuses([expectedSig]);
            const st2 = again.value[0];
            if (
              !st2 ||
              st2.err ||
              (st2.confirmationStatus !== "confirmed" &&
                st2.confirmationStatus !== "finalized")
            ) {
              throw err;
            }
          }
          return expectedSig;
        }
      }
      const logs = await err.getLogs(connection).catch(() => null);
      const logBlob = logs?.length ? `\nLogs:\n${logs.join("\n")}` : "";
      const wrapped = new Error(`${err.message}${logBlob}`);
      wrapped.name = err.name;
      throw wrapped;
    }

    if (!messageLooksLikeAlreadyProcessed(err)) {
      throw err;
    }

    const { value } = await connection.getSignatureStatuses([expectedSig]);
    const st = value[0];
    if (!st || st.err) {
      throw err;
    }

    await ensureConfirmed(connection, expectedSig, blockhash, lastValidBlockHeight);
    return expectedSig;
  }
}
