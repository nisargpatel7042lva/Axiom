import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Complete technical and user documentation for Axiom Vaults — how vaults work, the strategy engine, NAV mechanics, Jupiter integrations, and security architecture.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
