"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Sparkles, Layers } from "lucide-react";
import { PROFILE_CONFIG } from "@/lib/profile";

export default function ProjectShowcase() {
  return (
    <section id="projects" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#060B14]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
            PORTFOLIO &amp; SYSTEMS
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Selected Projects
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Research platforms, distributed data engines, and algorithmic backtesting suites built with institutional precision.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PROFILE_CONFIG.projects.map((project) => (
            <div
              key={project.title}
              className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
                    {project.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {project.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">
                  {project.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {project.description}
                </p>

                <div className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Key Architectural Capabilities
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {project.highlights.map((hl) => (
                      <li key={hl} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={project.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
                >
                  <span>Explore in Platform</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
