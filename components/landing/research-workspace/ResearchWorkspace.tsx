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
      className="relative w-full border-t border-slate-200/80 bg-[#F8FAFC] py-20 lg:py-28 overflow-hidden select-none dark:border-slate-800 dark:bg-[#070D18] transition-colors duration-200"
    >
      {/* Subtle Background Radial Glow, Decorative Arcs, Floating Badges & R3F */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0">
        <WorkspaceBackground />
      </motion.div>

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* 2-Column Responsive Composition (Left: ~38%, Right: ~62%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* Left Column: Intro + Feature Navigation */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 flex flex-col justify-between"
          >
            <WorkspaceIntro />

            <WorkspaceNavigation
              activeFeature={activeFeature}
              onSelectFeature={setActiveFeature}
            />
          </motion.div>

          {/* Right Column: Interactive Security Research Terminal */}
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: terminalY }}
            className="lg:col-span-7 w-full"
          >
            <SecurityTerminal
              activeFeature={activeFeature}
              onSelectFeature={setActiveFeature}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />
          </motion.div>
        </div>

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
