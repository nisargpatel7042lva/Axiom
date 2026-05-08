"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Brain, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useSnsIdentity } from "@/hooks/useSnsIdentity";
import { Topbar } from "@/components/layout/Topbar";
import { AgentIdentityCard } from "@/components/identity/AgentIdentityCard";
import { useVaultAgentIdentity } from "@/hooks/useVaultAgentIdentity";
import type { AgentIdentity } from "@/lib/services/sns-identity";

// Static fallback agent profiles — shown when Supabase has no data yet
const VAULT_AGENT_FALLBACKS: Record<string, AgentIdentity> = {
  "safe-consensus": {
    wallet: "system",
    agentId: "axiom-agent-safe-001",
    agentName: "Safe Consensus Agent",
    reputation: 82,
    strategies: ["High Probability", "Capital Preservation", "Jupiter Lend"],
    createdAt: Date.now(),
  },
  "macro-contrarian": {
    wallet: "system",
    agentId: "axiom-agent-macro-001",
    agentName: "Macro Contrarian Agent",
    reputation: 67,
    strategies: ["Mispriced Events", "Mid-Band (40–65%)", "Jupiter Lend"],
    createdAt: Date.now(),
  },
  "yield-maximizer": {
    wallet: "system",
    agentId: "axiom-agent-yield-001",
    agentName: "Yield Maximizer Agent",
    reputation: 74,
    strategies: ["Jupiter Lend (70%)", "High Conviction Trades", "Auto Harvest"],
    createdAt: Date.now(),
  },
};

const VAULT_IDS = ["safe-consensus", "macro-contrarian", "yield-maximizer"] as const;

function VaultAgentRow({ vaultId }: { vaultId: string }) {
  const { agent, loading } = useVaultAgentIdentity(vaultId);
  const display = agent ?? VAULT_AGENT_FALLBACKS[vaultId];

  if (loading) {
    return (
      <div className="rounded-lg border border-[#1f2e3d] bg-[#0d1420] p-4 animate-pulse h-24" />
    );
  }
  if (!display) return null;
  return <AgentIdentityCard agent={display} />;
}

function SummaryRow({ label, value }: { label: string; value: string | number | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-[#c8d0df] shadow-sm shadow-black/10">
      <span className="text-[11px] uppercase tracking-[0.22em] text-white/60">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export default function IdentityPage() {
  const { publicKey } = useWallet();
  const { identity, loading } = useSnsIdentity();
  const [copied, setCopied] = useState(false);

  if (!publicKey) {
    return (
      <div className="flex min-h-screen flex-col bg-[#080c14] text-[#e8edf5]">
        <Topbar />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center mt-20">
          <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-6">
            <h2 className="font-semibold text-[#fbbf24]">Wallet Required</h2>
            <p className="mt-2 text-sm text-[#8b9cb3]">
              Connect your wallet to view your Axiom identity profile.
            </p>
          </div>

          {/* Still show vault agents even when disconnected */}
          <div className="mt-12 space-y-4 text-left">
            <h2 className="text-lg font-semibold text-[#e8edf5]">Vault Strategy Agents</h2>
            <p className="text-sm text-[#8b9cb3]">
              Autonomous agents managing each vault's prediction market strategy.
            </p>
            <div className="space-y-3">
              {VAULT_IDS.map((id) => (
                <AgentIdentityCard key={id} agent={VAULT_AGENT_FALLBACKS[id]} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const wallet = publicKey.toBase58();
  const displayDomain = identity?.domain || "Not registered";

  const handleCopyWallet = async () => {
    await navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#080c14] text-[#e8edf5]">
      <Topbar />
      <main className="mx-auto max-w-2xl px-4 py-12 mt-20">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-[#e8edf5]">Identity Profile</h1>
            <p className="text-[#8b9cb3]">
              Manage your Solana identity on Axiom Vaults powered by Bonfida SNS.
            </p>
          </div>

          {/* Identity Card */}
          <div className="rounded-lg border border-[#1f2e3d] bg-gradient-to-br from-[#111a27] to-[#0d1420] p-6 space-y-6">
            {/* SNS Domain */}
            <div>
              <label className="text-xs font-semibold uppercase text-[#8b9cb3]">
                .SOL Domain
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-[#0d1420] p-4 border border-[#1f2e3d]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00e5c3]/20 text-[#00e5c3]">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {loading ? (
                    <div className="h-5 w-32 rounded bg-[#1f2e3d] animate-pulse" />
                  ) : (
                    <>
                      <p className="font-semibold text-[#e8edf5] text-lg">
                        {displayDomain}
                      </p>
                      {identity?.domain && (
                        <p className="text-xs text-[#8b9cb3]">
                          Registered on Bonfida SNS
                        </p>
                      )}
                    </>
                  )}
                </div>
                {identity?.domain && (
                  <a
                    href={`https://www.sns.id/${identity.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b9cb3] hover:text-[#00e5c3] transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
              </div>
              {!loading && !identity?.domain && (
                <div className="mt-4 rounded-lg border border-[#00e5c3]/30 bg-[#00e5c3]/5 p-4">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="mt-0.5 h-4 w-4 text-[#00e5c3]" />
                    <div>
                      <p className="text-sm font-medium text-[#00e5c3]">Register Your .sol Domain</p>
                      <p className="mt-1 text-xs text-[#8b9cb3]">
                        Get your Solana identity at{" "}
                        <a
                          href="https://www.sns.id"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00e5c3] hover:underline"
                        >
                          sns.id
                        </a>{" "}
                        to unlock agent identity and reputation features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Address */}
            <div>
              <label className="text-xs font-semibold uppercase text-[#8b9cb3]">
                Wallet Address
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#0d1420] p-4 border border-[#1f2e3d] font-[family-name:var(--font-space-mono)] text-xs text-[#8b9cb3]">
                <span className="flex-1 truncate">{wallet}</span>
                <button
                  onClick={handleCopyWallet}
                  className="hover:text-[#00e5c3] transition-colors p-1"
                  title={copied ? "Copied!" : "Copy address"}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Identity Benefits */}
            <div>
              <label className="text-xs font-semibold uppercase text-[#8b9cb3]">
                Identity Benefits
              </label>
              <div className="mt-2 space-y-2">
                {[
                  { title: "Trust Score", desc: "Build reputation across Axiom vaults" },
                  { title: "Agent Identity", desc: "Create autonomous vault agents with distinct .sol identities" },
                  { title: "Social Graph", desc: "Leverage your .sol domain across Solana apps" },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3 rounded-lg bg-[#0d1420] p-4 border border-[#1f2e3d]">
                    <div className="text-[#00e5c3]">✓</div>
                    <div>
                      <p className="font-medium text-[#e8edf5]">{title}</p>
                      <p className="text-xs text-[#8b9cb3]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vault Strategy Agents */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#e8edf5]">Vault Strategy Agents</h2>
              <p className="mt-1 text-sm text-[#8b9cb3]">
                Autonomous agents executing each vault's prediction market strategy on your behalf.
              </p>
            </div>
            <div className="space-y-3">
              {VAULT_IDS.map((id) => (
                <VaultAgentRow key={id} vaultId={id} />
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg border border-[#00e5c3]/30 bg-[#00e5c3]/5 p-4">
            <p className="text-xs text-[#8b9cb3]">
              Axiom Vaults implements SNS-based identity to enable trust in prediction
              markets. Your identity is stored on-chain via Bonfida SNS and is portable
              across all Solana applications.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
