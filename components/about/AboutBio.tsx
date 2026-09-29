"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AboutBio() {
  return (
    <section className="py-14 sm:py-18 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18] transition-colors duration-300">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1769FF] dark:text-blue-400">
            BACKGROUND
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            A little about me
          </h2>

          <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            <p>
              I started out with a strong interest in technology and gradually found myself drawn toward data — especially the challenge of understanding large, messy datasets and turning them into something useful.
            </p>
            <p>
              During my undergraduate studies in Information Technology, I developed a foundation in programming, databases, and software engineering. That eventually led me toward data analytics, machine learning, and quantitative finance.
            </p>
            <p>
              Today, I enjoy working across both sides of the problem: understanding the analytical question and building the engineering systems required to solve it.
            </p>
            <p className="pt-2 text-slate-700 dark:text-slate-200 font-medium">
              My current interests include quantitative finance, systematic research, financial risk, time-series modelling, machine learning, distributed data processing, and cloud-based analytics.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
