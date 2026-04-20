import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

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
  title: "Axiom Vaults — Premium Prediction Vaults on Solana",
  description:
    "Institutional-grade prediction vaults for Solana. Deposit USDC, gain diversified market exposure, and earn yield on idle capital via Jupiter Lend.",
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
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
