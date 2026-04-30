import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axiom Vaults",
    short_name: "Axiom",
    description:
      "USDC strategy vaults for prediction markets on Solana with transparent on-chain metrics.",
    start_url: "/",
    display: "standalone",
    background_color: "#080c14",
    theme_color: "#080c14",
  };
}
