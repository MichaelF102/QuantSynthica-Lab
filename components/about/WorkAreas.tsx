"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, TrendingUp, Cpu, BrainCircuit } from "lucide-react";

export default function WorkAreas() {
  const AREAS = [
    {
      title: "Data",
      desc: "Turning raw and messy datasets into structured analytical systems.",
      icon: Database,
      technologies: ["Python", "SQL", "Pandas", "ETL Cleaning"],
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      title: "Quantitative Research",
      desc: "Exploring systematic strategies, factor models, portfolio construction, backtesting, and financial modelling.",
      icon: TrendingUp,
      technologies: ["Factor Models", "Backtesting", "Risk Analytics", "Portfolio Optimization"],
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "Data Engineering",
      desc: "Building scalable pipelines with Python, SQL, PySpark, Parquet, Docker, and cloud infrastructure.",
      icon: Cpu,
      technologies: ["PySpark", "Apache Spark", "Parquet", "Docker", "AWS"],
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Machine Learning",
      desc: "Experimenting with predictive modelling, anomaly detection, time-series analysis, and financial ML.",
      icon: BrainCircuit,
      technologies: ["Scikit-learn", "XGBoost", "Time-Series", "Anomaly Detection"],
      color: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
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
            AREAS OF INTEREST
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            What I enjoy working on
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            The domains where I spend most of my time learning, building, and experimenting.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {AREAS.map((area, idx) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className={`p-2.5 rounded-xl ${area.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {area.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {area.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {area.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
