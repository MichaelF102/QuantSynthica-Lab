"use client";

import React from "react";
import { Terminal, Database, BrainCircuit, Activity, Cloud } from "lucide-react";
import { PROFILE_CONFIG } from "@/lib/profile";

export default function SkillsSection() {
  const CATEGORIES = [
    {
      title: "Programming",
      icon: Terminal,
      skills: PROFILE_CONFIG.skills.programming,
      accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      title: "Data Engineering",
      icon: Database,
      skills: PROFILE_CONFIG.skills.dataEngineering,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Machine Learning",
      icon: BrainCircuit,
      skills: PROFILE_CONFIG.skills.machineLearning,
      accent: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
    },
    {
      title: "Quantitative Finance",
      icon: Activity,
      skills: PROFILE_CONFIG.skills.quantitativeFinance,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "Cloud & Infrastructure",
      icon: Cloud,
      skills: PROFILE_CONFIG.skills.cloud,
      accent: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
            TECHNICAL REPERTOIRE
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Core Competencies &amp; Toolkit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Proficiency across high-performance quantitative modeling, distributed big data pipelines, machine learning, and cloud backbones.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`p-2.5 rounded-xl ${cat.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cat.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cat.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
