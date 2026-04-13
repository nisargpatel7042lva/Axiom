import { PublicKey } from "@solana/web3.js";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verifies that `signatureB64` is a valid Ed25519 signature over `message`
 * for `publicKey`, using the Web Crypto API (no extra npm deps).
 */
export async function verifyEd25519Acknowledgment(
  message: Uint8Array,
  signatureB64: string,
  publicKey: PublicKey,
): Promise<boolean> {
  let signature: Uint8Array;
  try {
    signature = b64ToBytes(signatureB64);
  } catch {
    return false;
  }
  if (signature.length !== 64) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(publicKey.toBytes()),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      new Uint8Array(signature),
      new Uint8Array(message),
    );
  } catch {
    return false;
  }
}
