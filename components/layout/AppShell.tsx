"use client";

import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/layout/StatusBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto pb-8">{children}</main>
      <StatusBar />
    </div>
  );
}
