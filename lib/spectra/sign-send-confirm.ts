import type { Idl, Program } from "@coral-xyz/anchor";
import { Transaction, type TransactionSignature } from "@solana/web3.js";
import bs58 from "bs58";

function messageLooksLikeAlreadyProcessed(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("already been processed");
}

/**
 * Signs with the Anchor wallet, sends the legacy transaction once (no resubmit
 * loop), then confirms with blockhash expiry. Handles "already been processed"
 * when the same signed bytes were already accepted (e.g. a prior send or RPC
 * retry) by treating a confirmed signature as success.
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
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    return sig;
  } catch (err) {
    if (!messageLooksLikeAlreadyProcessed(err)) {
      throw err;
    }

    const { value } = await connection.getSignatureStatuses([expectedSig]);
    const st = value[0];
    if (st?.err) {
      throw err;
    }

    await connection.confirmTransaction(
      {
        signature: expectedSig,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    );
    return expectedSig;
  }
}
