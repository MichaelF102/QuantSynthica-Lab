"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import WorkspaceBackground from "./WorkspaceBackground";
import WorkspaceIntro from "./WorkspaceIntro";
import WorkspaceNavigation, { WorkspaceFeatureKey } from "./WorkspaceNavigation";
import SecurityTerminal from "./SecurityTerminal";
import WorkspaceFeatureRail from "./WorkspaceFeatureRail";

export default function ResearchWorkspace() {
  const [activeFeature, setActiveFeature] =
    useState<WorkspaceFeatureKey>("charts");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  const sectionRef = useRef<HTMLElement>(null);

  // Parallax floating effect for the terminal & background
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    restDelta: 0.001,
  });

  const terminalY = useTransform(smoothProgress, [0, 1], [15, -12]);
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, -35]);

  return (
    <section
      ref={sectionRef}
      id="research-workspace"
      className="relative w-full border-t border-slate-200/80 dark:border-slate-800 bg-[var(--bg-research)] py-20 lg:py-28 overflow-hidden select-none transition-colors duration-500"
    >
      {/* Subtle Background Radial Glow, Decorative Arcs, Floating Badges & R3F */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        <WorkspaceBackground />
      </motion.div>

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header & Horizontal Feature Navigation */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <WorkspaceIntro />

          <WorkspaceNavigation
            activeFeature={activeFeature}
            onSelectFeature={setActiveFeature}
          />
        </motion.div>

        {/* Security Research Terminal Widget (Brought Down & Centered) */}
        <motion.div
          initial={{ opacity: 1, scale: 1, y: 0 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: terminalY }}
          className="mt-10 mb-14 w-full max-w-[1320px] mx-auto"
        >
          <SecurityTerminal
            activeFeature={activeFeature}
            onSelectFeature={setActiveFeature}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
        </motion.div>

        {/* Bottom Feature Rail: 6 Equal Height Capability Cards */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <WorkspaceFeatureRail
            activeFeature={activeFeature}
            onSelectFeature={setActiveFeature}
          />
        </motion.div>
      </div>
    </section>
  );
}
