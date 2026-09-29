"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CTAHeader from "./CTAHeader";
import ResearchUniverse from "./ResearchUniverse";
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
      className="relative w-full bg-[var(--bg-cta)] text-white pt-24 sm:pt-32 overflow-hidden border-t border-slate-800/80 transition-colors duration-500"
    >
      {/* Component-Specific Semantic CTA Background */}
      <SectionBackground variant="cta" />

      {/* 1. Header & CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <CTAHeader />
      </motion.div>

      {/* 2. Three.js Research Universe Hero Visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <ResearchUniverse />
      </motion.div>

      {/* 3. Research Journey Timeline (01 RESEARCH -> 05 DECIDE) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-2"
      >
        <ResearchJourney />
      </motion.div>

      {/* 4. Product Capability Figures */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <CTAStats />
      </motion.div>

      {/* 5. Minimal Institutional Footer */}
      <FinalFooter />
    </section>
  );
}
