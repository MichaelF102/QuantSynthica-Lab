"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import LabsHeader from "./LabsHeader";
import LabMatrix, { LabId } from "./LabMatrix";
import ActiveLabVisualization from "./ActiveLabVisualization";
import PopularModelsRail from "./PopularModelsRail";

const LabsAtmosphere = dynamic(() => import("./LabsAtmosphere"), {
  ssr: false,
});

export default function QuantResearchLabs() {
  const [activeLab, setActiveLab] = useState<LabId>("timeseries");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    restDelta: 0.001,
  });

  const matrixY = useTransform(smoothProgress, [0, 1], [15, -10]);
  const visualY = useTransform(smoothProgress, [0, 1], [25, -5]);
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      id="quant-research-labs"
      className="relative w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#070D18] py-20 lg:py-28 overflow-hidden select-none"
    >
      {/* Subtle Radial Glows & Background Atmosphere */}
      <motion.div style={{ y: backgroundY }} className="pointer-events-none absolute inset-0 -z-10 select-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 80% 25%, rgba(37,99,235,0.08), transparent 38%),
              radial-gradient(circle at 15% 75%, rgba(99,102,241,0.05), transparent 32%)
            `,
          }}
        />
        {mounted && !isMobile && <LabsAtmosphere />}
      </motion.div>

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* Section Header with Eyebrow, Title, Copy & Top Capabilities Strip */}
        <LabsHeader />

        {/* 2-Column Research Labs Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
          {/* Left: 2 x 3 Research Lab Matrix (~52% -> col-span-7) */}
          <motion.div
            style={{ y: matrixY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <LabMatrix activeLab={activeLab} onSelectLab={setActiveLab} />
          </motion.div>

          {/* Right: Large Interactive Research Lab Visualization (~48% -> col-span-5) */}
          <motion.div
            style={{ y: visualY }}
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 w-full"
          >
            <ActiveLabVisualization
              activeLab={activeLab}
              onSelectLab={setActiveLab}
            />
          </motion.div>
        </div>

        {/* Bottom Rail: Popular Models & Techniques */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PopularModelsRail />
        </motion.div>
      </div>
    </section>
  );
}
