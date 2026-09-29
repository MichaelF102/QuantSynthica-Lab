"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Linkedin, Globe, Mail, ExternalLink } from "lucide-react";
import { PROFILE_CONFIG, LINKEDIN_URL, PORTFOLIO_URL, CONTACT_EMAIL } from "@/lib/profile";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-[#070D18] dark:via-[#091122] dark:to-[#070D18] transition-colors duration-300">
      {/* Subtle ambient light */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to QuantSynthicaLab</span>
          </Link>
        </div>

        {/* Two-Column Personal Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT: Personal Story & Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Eyebrow */}
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1769FF] dark:text-blue-400 mb-2">
              ABOUT ME
            </span>

            {/* Large Personal Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Hi, I’m Michael Fernandes.
            </h1>

            {/* Short Professional Descriptor */}
            <div className="mt-2.5 text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
              Data Analyst · Quantitative Researcher · Big Data Analytics
            </div>

            {/* 2-3 First-Person Paragraphs */}
            <div className="mt-6 space-y-4 text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
              <p>
                I’m a Data Analyst and quantitative researcher interested in the intersection of data, financial markets, machine learning, and large-scale analytics.
              </p>
              <p>
                I currently work with market and FMCG data while pursuing an M.Sc. in Big Data Analytics at St. Xavier’s College, Mumbai. My work sits between analytical research and engineering — turning raw data into structured systems, models, and tools that can actually be used.
              </p>
              <p>
                Outside of day-to-day analytics, I build quantitative research platforms and experiment with systematic strategies, risk analytics, machine learning, and distributed data systems.
              </p>
            </div>

            {/* Subtle Inline Connect Strip */}
            <div className="mt-8 flex flex-wrap items-center gap-3 pt-2">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#095196] transition-all"
              >
                <Linkedin className="h-3.5 w-3.5" />
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-2xs"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Portfolio</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-2xs"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email Me</span>
              </a>
            </div>
          </motion.div>

          {/* RIGHT: Modern Employee / Researcher Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 w-full flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[380px] rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-2xl backdrop-blur-md transition-colors duration-300">
              {/* Profile Portrait */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 mb-5">
                <Image
                  src="/profile/michael-fernandes.jpg"
                  alt="Michael Fernandes"
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  priority
                  className="object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Identity & Details */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {PROFILE_CONFIG.name}
                  </h2>
                  <p className="text-xs font-semibold text-[#1769FF] dark:text-blue-400 mt-0.5">
                    Data Analyst
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quantitative Research &amp; Big Data Analytics
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Mumbai, India</span>
                </div>

                {/* Status Badges */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <Briefcase className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>Currently working at <strong className="font-semibold text-slate-900 dark:text-white">Asterix StratComm</strong></span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>M.Sc. Big Data Analytics — <strong className="font-semibold text-slate-900 dark:text-white">St. Xavier’s College</strong></span>
                  </div>
                </div>

                {/* Profile Links */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    <span>Contact</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
