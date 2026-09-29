"use client";

import React from "react";
import { motion } from "framer-motion";

export default function InterestsSection() {
  const TOPICS = [
    "Quantitative finance",
    "Financial markets",
    "Data visualization",
    "Open-source technologies",
    "Cloud computing",
    "Machine learning",
    "Building side projects",
    "Exploring new technologies",
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
            CURIOSITIES
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Beyond the work
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Topics, experiments, and questions I find myself reading about, building on weekends, or discussing with peers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 flex flex-wrap gap-2.5 max-w-3xl"
        >
          {TOPICS.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              {topic}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
