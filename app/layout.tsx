import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://axiomvaults.com"),
  title: {
    default: "Axiom Vaults — Prediction Market Vaults on Solana",
    template: "%s | Axiom Vaults",
  },
  description:
    "Axiom Vaults helps users deposit USDC into automated strategy vaults for prediction markets on Solana, with transparent NAV, share-based accounting, and clear risk visibility.",
  keywords: [
    "Axiom Vaults",
    "Solana vaults",
    "prediction market vaults",
    "USDC vault",
    "Jupiter Prediction",
    "Jupiter Lend",
    "DeFi vault strategy",
    "automated crypto investing",
    "prediction market ETF",
    "Solana DeFi",
    "vault FAQ",
  ],
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Axiom Vaults" }],
  creator: "Axiom Vaults",
  publisher: "Axiom Vaults",
  category: "Finance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://axiomvaults.com",
    title: "Axiom Vaults — Prediction Market Vaults on Solana",
    description:
      "Deposit USDC into automated strategy vaults, track live metrics, and manage prediction market exposure with a simpler workflow.",
    siteName: "Axiom Vaults",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom Vaults — Prediction Market Vaults on Solana",
    description:
      "USDC strategy vaults for prediction markets with transparent vault metrics and simple user flows.",
    creator: "@axiom_vaults",
  },
  other: {
    "contact:email": "axiomvaults1@gmail.com",
    "contact:x": "https://x.com/axiom_vaults",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080c14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full bg-[#080c14] antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-[#080c14] text-[#e8edf5]"
        suppressHydrationWarning
      >
        <PostHogProvider>
          <QueryProvider>
            <WalletProvider>{children}</WalletProvider>
          </QueryProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
