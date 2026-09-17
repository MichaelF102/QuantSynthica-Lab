import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/layout/StatusBar";

export const metadata: Metadata = {
  title: "AlgoLab — Systematic Quantitative Strategy Platform",
  description:
    "Institutional quantitative trading strategy research, backtesting, parameter optimization, risk analytics, and walk-forward validation platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased flex flex-col font-sans selection:bg-brand-cyan/20 selection:text-brand-cyan">
        <Navbar />
        <main className="flex-1 pb-9 overflow-y-auto">{children}</main>
        <StatusBar />
      </body>
    </html>
  );
}
