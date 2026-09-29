"use client";

import React from "react";
import Link from "next/link";
import { Linkedin, Twitter, Youtube, Github, ExternalLink } from "lucide-react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

export default function FinalFooter() {
  return (
    <footer className="relative z-20 border-t border-slate-800/80 bg-[#060D17] text-slate-400 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Micro-copy line */}
        <div className="text-center text-xs font-medium text-slate-500 tracking-wide">
          One platform for the complete quantitative research process.
        </div>

        {/* Main Footer Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800/60">
          {/* Left Brand */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <QuantSynthicaLogo variant="full" size="sm" theme="dark" />
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-xs text-slate-500">Quantitative intelligence for modern markets.</span>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <Link href="/research" className="hover:text-white transition-colors">
              Markets
            </Link>
            <Link href="/strategies" className="hover:text-white transition-colors">
              Strategies
            </Link>
            <Link href="/backtests" className="hover:text-white transition-colors">
              Backtests
            </Link>
            <Link href="/analytics" className="hover:text-white transition-colors">
              Analytics
            </Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">
              Portfolio
            </Link>
            <Link href="/risk" className="hover:text-white transition-colors">
              Risk
            </Link>
            <Link href="/research" className="hover:text-white transition-colors">
              Research
            </Link>
            <Link href="/settings" className="hover:text-white transition-colors">
              Resources
            </Link>
          </div>

          {/* Right Links & Socials */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span className="text-slate-700">·</span>
            <a
              href="/research"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Docs
            </a>
            <span className="text-slate-700">·</span>
            <a
              href="mailto:contact@quantsynthica.com"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Contact
            </a>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 ml-2 border-l border-slate-800 pl-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-6 h-6 rounded-md bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                className="w-6 h-6 rounded-md bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-6 h-6 rounded-md bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} QuantSynthica Lab. Built for quantitative research and institutional education.
        </div>
      </div>
    </footer>
  );
}
