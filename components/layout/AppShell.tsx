"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/layout/StatusBar";
import LandingNavbar from "@/components/landing/Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/docs";

  if (isPublicPage) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0B1220] dark:bg-[#070D18] dark:text-[#E2E8F0] selection:bg-[#1769FF]/20 selection:text-[#0B1220] dark:selection:text-white transition-colors duration-200">
        <LandingNavbar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto pb-8">{children}</main>
      <StatusBar />
    </div>
  );
}
