import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import BackgroundSection from "@/components/about/BackgroundSection";
import EducationTimeline from "@/components/about/EducationTimeline";
import SkillsSection from "@/components/about/SkillsSection";
import ProjectShowcase from "@/components/about/ProjectShowcase";
import QuantSynthicaConnection from "@/components/about/QuantSynthicaConnection";
import AboutContactCTA from "@/components/about/AboutContactCTA";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Michael Fernandes — QuantSynthicaLab",
  description: "Background, education, projects, and quantitative research work of Michael Fernandes.",
  openGraph: {
    title: "Michael Fernandes — QuantSynthicaLab",
    description: "Background, education, projects, and quantitative research work of Michael Fernandes.",
    images: [{ url: "/branding/quantsynthicalab-logo.png", width: 1024, height: 682, alt: "Michael Fernandes — QuantSynthicaLab" }],
  },
};

export default function AboutPage() {
  return (
    <div className="w-full bg-white dark:bg-[#070D18] text-slate-900 dark:text-white transition-colors duration-300">
      {/* 1. Hero Section */}
      <AboutHero />

      {/* 2. Professional & Academic Background */}
      <BackgroundSection />

      {/* 3. Education Timeline */}
      <EducationTimeline />

      {/* 4. Categorized Skills */}
      <SkillsSection />

      {/* 5. Selected Projects */}
      <ProjectShowcase />

      {/* 6. Why QuantSynthicaLab? Architecture & Pipeline Connection */}
      <QuantSynthicaConnection />

      {/* 7. Collaboration CTA */}
      <AboutContactCTA />

      {/* 8. Unified Footer */}
      <Footer />
    </div>
  );
}
