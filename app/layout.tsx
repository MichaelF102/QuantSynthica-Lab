import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuantSynthica Lab",
  description: "A research lab for charts, strategies, and backtests across US and India markets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="qs-app min-h-screen bg-background font-sans text-[#d1d4dc] antialiased selection:bg-[#2962FF]/40 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
