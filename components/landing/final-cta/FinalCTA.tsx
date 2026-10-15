"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CTAHeader from "./CTAHeader";
import ResearchJourney from "./ResearchJourney";
import CTAStats from "./CTAStats";
import FinalFooter from "./FinalFooter";
import SectionBackground from "@/components/backgrounds/SectionBackground";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="final-cta"
      ref={sectionRef}
      className="relative w-full bg-[var(--bg-cta)] text-white pt-20 sm:pt-28 pb-10 overflow-hidden border-t border-slate-800/80 transition-colors duration-500"
    >
      {/* Component-Specific Semantic CTA Background */}
      <SectionBackground variant="cta" />

      {/* Ambient Radial Lighting Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-purple-600/15 blur-[120px]" />

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* 1. Plain Editorial Header & Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <CTAHeader />
        </motion.div>

        {/* 2. Research Journey Timeline (01 RESEARCH -> 05 DECIDE) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <ResearchJourney />
        </motion.div>

        {/* 3. Product Capability Figures Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <CTAStats />
        </motion.div>

        {/* 4. Minimal Institutional Footer */}
        <FinalFooter />
      </div>
    </section>
  );
}
