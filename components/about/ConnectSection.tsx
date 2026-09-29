"use client";

import React from "react";
import { motion } from "framer-motion";
import { Linkedin, Globe, Mail, ExternalLink } from "lucide-react";
import { LINKEDIN_URL, PORTFOLIO_URL, CONTACT_EMAIL } from "@/lib/profile";

export default function ConnectSection() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50/60 dark:bg-[#060B14] transition-colors duration-300">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1769FF] dark:text-blue-400">
            CONTACT
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Let’s connect.
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            If you’re interested in quantitative research, data engineering, financial technology, or simply want to talk about something I’m building, feel free to reach out.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[#095196] transition-all"
            >
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>

            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-2xs"
            >
              <Globe className="h-4 w-4" />
              <span>Portfolio</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all shadow-2xs"
            >
              <Mail className="h-4 w-4" />
              <span>Email Me</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
