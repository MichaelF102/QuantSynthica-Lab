"use client";

import React from "react";
import Link from "next/link";
import { Mail, Linkedin, Globe, ArrowRight, ExternalLink } from "lucide-react";
import { PROFILE_CONFIG, LINKEDIN_URL, PORTFOLIO_URL, CONTACT_EMAIL } from "@/lib/profile";

export default function AboutContactCTA() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/80 dark:bg-[#060B14]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-xs">
          <div className="max-w-2xl">
            <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
              CONNECT &amp; COLLABORATE
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Interested in Quantitative Research or Data Engineering?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Open to conversations around quantitative finance, algorithmic systems, distributed analytics, and collaborative machine learning initiatives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#095196] transition-all"
            >
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-xs"
            >
              <Globe className="h-4 w-4" />
              <span>Portfolio</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1769FF] px-5 py-3 text-xs font-semibold text-white hover:bg-blue-600 transition-all shadow-sm"
            >
              <Mail className="h-4 w-4" />
              <span>Send Message</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
