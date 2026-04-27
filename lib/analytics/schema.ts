export const TELEMETRY_EVENT_NAMES = [
  "wallet_connect",
  "wallet_disconnect",
  "deposit_review_opened",
  "deposit_submit_clicked",
  "deposit_tx_submitted",
  "deposit_tx_confirmed",
  "deposit_tx_failed",
  "withdraw_review_opened",
  "withdraw_submit_clicked",
  "withdraw_tx_submitted",
  "withdraw_tx_confirmed",
  "withdraw_tx_failed",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

export type TxKind = "deposit" | "withdraw";

export type TelemetryEvent = {
  name: TelemetryEventName;
  timestamp: string;
  sessionId: string;
  attemptId?: string;
  wallet?: string;
  vaultId?: string;
  chainVaultId?: number;
  network?: string;
  txSig?: string;
  txKind?: TxKind;
  amountUsdc?: number;
  shares?: number;
  errorMessage?: string;
  errorClass?: string;
  source: "frontend";
};

