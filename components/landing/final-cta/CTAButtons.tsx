"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function CTAButtons() {
  const scrollToPlatform = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("features") || document.getElementById("workflow");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-20">
      {/* Primary CTA */}
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href="/research"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1769FF] via-[#2563EB] to-[#4F46E5] text-white text-sm font-semibold shadow-[0_0_25px_rgba(23,105,255,0.45)] hover:shadow-[0_0_35px_rgba(23,105,255,0.7)] transition-all group"
        >
          <span>Open QuantSynthica Lab</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* Secondary CTA */}
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <button
          type="button"
          onClick={scrollToPlatform}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 text-sm font-medium backdrop-blur-md transition-all shadow-xs hover:border-slate-500"
        >
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <Play className="w-2.5 h-2.5 fill-current text-white ml-0.5" />
          </div>
          <span>Explore the Platform</span>
        </button>
      </motion.div>
    </div>
  );
}
