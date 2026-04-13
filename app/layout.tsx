import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spectra Vaults — Prediction Market ETFs on Solana",
  description:
    "Set-and-forget prediction market ETFs. Deposit USDC, earn yield from diversified prediction portfolios and Jupiter Lend. Powered by Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceMono.variable} h-full bg-[#080c14] antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-[#080c14] text-[#e8edf5]"
        suppressHydrationWarning
      >
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
