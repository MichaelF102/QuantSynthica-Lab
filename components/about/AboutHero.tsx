"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Linkedin, Globe, Mail, Code2, Database, TrendingUp, Sparkles } from "lucide-react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";
import { PROFILE_CONFIG, LINKEDIN_URL, PORTFOLIO_URL, CONTACT_EMAIL } from "@/lib/profile";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-100/60 via-white to-slate-50/50 dark:from-[#080E1A] dark:via-[#070D18] dark:to-[#0B1220]">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] rounded-full" />

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to QuantSynthicaLab</span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available for Quantitative Research & Analytics
            </span>
          </div>
        </div>

        {/* Hero Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8 flex flex-col items-start">
            {/* Section Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="rounded-md bg-[#1769FF]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:bg-blue-500/10 dark:text-blue-400">
                ABOUT ME
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Quantitative Research • Data Analytics • Financial Technology
              </span>
            </div>

            {/* Name & Titles */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {PROFILE_CONFIG.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm sm:text-base font-semibold text-[#1769FF] dark:text-blue-400">
              <span>{PROFILE_CONFIG.title}</span>
            </div>

            {/* Concise Bio */}
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl font-normal">
              &ldquo;{PROFILE_CONFIG.bio}&rdquo;
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#095196] transition-all"
              >
                <Linkedin className="h-4 w-4" />
                <span>Connect on LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-xs"
              >
                <Globe className="h-4 w-4" />
                <span>Personal Portfolio</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-xs"
              >
                <Mail className="h-4 w-4" />
                <span>Get in Touch</span>
              </Link>

              <a
                href="#projects"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>View Projects</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Right Highlight Box / Quick Stats */}
          <div className="lg:col-span-4 w-full">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-6 shadow-sm backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Profile Snapshot
                </span>
                <span className="rounded bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Mumbai, India
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 shrink-0">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Current Industry Role</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Data Analyst at <span className="font-semibold text-slate-800 dark:text-slate-200">Asterix StratComm</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Active Research Track</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      M.Sc. Big Data Analytics at <span className="font-semibold text-slate-800 dark:text-slate-200">St. Xavier&apos;s College, Mumbai</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 shrink-0">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Specialization</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Quantitative Systems, PySpark Lakehouses &amp; Factor Backtesting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
