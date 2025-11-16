import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { GameProvider } from "@/contexts/GameContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "100xTap - Price Prediction Game",
  description: "Predict price movements and win big",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <SessionProvider>
            <GameProvider>{children}</GameProvider>
          </SessionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
