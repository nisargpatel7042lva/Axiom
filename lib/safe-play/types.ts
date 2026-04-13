export type StoredSafePlayAck = {
  version: string;
  publicKey: string;
  /** Base64-encoded Ed25519 signature over UTF-8 agreement text */
  signatureB64: string;
  signedAt: number;
};
