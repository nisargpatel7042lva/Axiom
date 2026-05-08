"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useSnsIdentity } from "@/hooks/useSnsIdentity";

export function IdentityBadge() {
  const { identity, loading } = useSnsIdentity();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2332] border border-[#2d3f52] animate-pulse">
        <div className="w-2 h-2 rounded-full bg-[#8b9cb3]"></div>
        <span className="text-xs font-medium text-[#8b9cb3]">Loading...</span>
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  const displayValue = identity.domain || identity.wallet;
  const shortValue = identity.domain
    ? identity.domain
    : `${identity.wallet.slice(0, 4)}...${identity.wallet.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00e5c3]/10 border border-[#00e5c3]/30 hover:border-[#00e5c3]/50 transition-colors">
      <div className="w-2 h-2 rounded-full bg-[#00e5c3]"></div>
      <span className="text-xs font-medium text-[#00e5c3]">{shortValue}</span>
      <button
        onClick={handleCopy}
        className="ml-1 hover:bg-[#00e5c3]/20 p-0.5 rounded transition-colors"
        title={copied ? "Copied!" : "Copy address"}
      >
        {copied ? (
          <Check className="w-3 h-3 text-[#00e5c3]" />
        ) : (
          <Copy className="w-3 h-3 text-[#00e5c3]/60 hover:text-[#00e5c3]" />
        )}
      </button>
    </div>
  );
}
