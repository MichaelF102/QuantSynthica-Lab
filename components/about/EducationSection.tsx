"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Calendar } from "lucide-react";

export default function EducationSection() {
  const DEGREES = [
    {
      degree: "M.Sc. Big Data Analytics",
      institution: "St. Xavier’s College, Mumbai",
      period: "2025 – 2027",
      focus: "Big Data Engineering · Data Analytics · Machine Learning · Quantitative Research · Cloud Computing",
    },
    {
      degree: "B.Sc. Information Technology",
      institution: "University of Mumbai",
      period: "2022 – 2025",
      focus: "Software Engineering · Databases · Algorithms & Data Structures · Statistical Methods",
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
            ACADEMICS
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Education
          </h2>
        </motion.div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DEGREES.map((d, idx) => (
            <motion.div
              key={d.degree}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-6 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1769FF] dark:text-blue-400">
                    <GraduationCap className="h-4 w-4" />
                    <span>{d.institution}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{d.period}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {d.degree}
                </h3>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Focus: </span>
                <span className="text-slate-600 dark:text-slate-300">{d.focus}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
