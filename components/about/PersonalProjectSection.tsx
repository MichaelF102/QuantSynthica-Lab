"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

export default function PersonalProjectSection() {
  return (
    <section className="py-14 sm:py-18 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18] transition-colors duration-300">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-7 sm:p-10 max-w-3xl"
        >
          <div className="mb-4">
            <QuantSynthicaLogo variant="full" size="sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Why I built QuantSynthicaLab
          </h2>

          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              QuantSynthicaLab started as a personal environment for experimenting with quantitative finance and data engineering.
            </p>
            <p>
              It brings together the areas I enjoy working on — market research, systematic strategies, backtesting, risk analytics, machine learning, and large-scale data processing — in one evolving platform.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769FF] dark:text-blue-400 hover:underline group"
            >
              <span>Explore the Lab</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
