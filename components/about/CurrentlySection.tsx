"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Hammer, Compass } from "lucide-react";

export default function CurrentlySection() {
  const ITEMS = [
    {
      num: "01",
      badge: "WORKING",
      title: "Data Analyst at Asterix StratComm",
      desc: "Working with FMCG market research data, preprocessing pipelines, structured databases, analytics, and dashboards.",
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      num: "02",
      badge: "STUDYING",
      title: "M.Sc. Big Data Analytics",
      sub: "St. Xavier’s College, Mumbai · 2025–2027",
      desc: "Deepening theoretical and applied knowledge in big data engineering, advanced machine learning, and cloud-scale computational analytics.",
      icon: GraduationCap,
      color: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
    },
    {
      num: "03",
      badge: "BUILDING",
      title: "QuantSynthicaLab",
      desc: "A personal research environment for quantitative finance, data engineering, financial analytics, and machine learning.",
      icon: Hammer,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      num: "04",
      badge: "EXPLORING",
      title: "Quantitative Finance + Data Engineering",
      desc: "Currently exploring systematic strategies, risk analytics, time-series models, distributed processing, and financial data systems.",
      icon: Compass,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <section className="py-14 sm:py-18 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#060B14] transition-colors duration-300">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1769FF] dark:text-blue-400">
            CURRENT FOCUS
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            What I’m doing now
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            A snapshot of my day-to-day work across analytics, graduate research, and personal engineering projects.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.badge}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                      {item.num}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  {item.sub && (
                    <div className="text-xs font-semibold text-[#1769FF] dark:text-blue-400 mt-0.5">
                      {item.sub}
                    </div>
                  )}

                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
