"use client";

import React from "react";
import { motion } from "framer-motion";

export default function JourneyTimeline() {
  const MILESTONES = [
    {
      year: "2022",
      title: "B.Sc. Information Technology",
      place: "University of Mumbai",
      desc: "Built a solid technical foundation across programming, database management, data structures, and software engineering principles.",
    },
    {
      year: "2023",
      title: "Started working as a Data Analyst",
      place: "Asterix StratComm",
      desc: "Stepped into professional market research analytics, processing complex consumer datasets, designing database schemas, and delivering decision dashboards.",
    },
    {
      year: "2025",
      title: "Started M.Sc. Big Data Analytics",
      place: "St. Xavier’s College, Mumbai",
      desc: "Advanced into distributed computing, PySpark, statistical modeling, machine learning algorithms, and cloud data architecture.",
    },
    {
      year: "2025 – Present",
      title: "Expanding into Quantitative Systems",
      place: "QuantSynthicaLab & Research",
      desc: "Focusing on the convergence of quantitative finance, systematic strategy backtesting, econometric risk models, and scalable financial data pipelines.",
    },
  ];

  return (
    <section className="py-14 sm:py-18 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18] transition-colors duration-300">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1769FF] dark:text-blue-400">
            EXPERIENCE &amp; PATHWAY
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My journey
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            A chronological timeline of how my interest in computer science evolved toward market data, analytics, and quantitative engineering.
          </p>
        </motion.div>

        {/* Minimal Human Timeline */}
        <div className="mt-12 relative border-l border-slate-200 dark:border-slate-800 ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-10">
          {MILESTONES.map((m, idx) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Timeline marker */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#070D18] border-2 border-[#1769FF] shadow-xs group-hover:scale-125 transition-transform" />

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="text-xs font-mono font-bold text-[#1769FF] dark:text-blue-400 shrink-0">
                  {m.year}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {m.title}
                </h3>
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {m.place}
              </div>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
                {m.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
