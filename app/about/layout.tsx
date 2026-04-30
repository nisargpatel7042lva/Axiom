import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what Axiom Vaults does, how the vault flow works, and how users can use the app without manual day trading.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
