import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import AboutBio from "@/components/about/AboutBio";
import CurrentlySection from "@/components/about/CurrentlySection";
import JourneyTimeline from "@/components/about/JourneyTimeline";
import WorkAreas from "@/components/about/WorkAreas";
import EducationSection from "@/components/about/EducationSection";
import InterestsSection from "@/components/about/InterestsSection";
import PersonalProjectSection from "@/components/about/PersonalProjectSection";
import ConnectSection from "@/components/about/ConnectSection";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Michael Fernandes — QuantSynthicaLab",
  description: "Meet Michael Fernandes: Data Analyst, quantitative researcher, and graduate student in Big Data Analytics.",
  openGraph: {
    title: "Michael Fernandes — QuantSynthicaLab",
    description: "Meet Michael Fernandes: Data Analyst, quantitative researcher, and graduate student in Big Data Analytics.",
    images: [{ url: "/profile/michael-fernandes.jpg", width: 800, height: 800, alt: "Michael Fernandes" }],
  },
};

export default function AboutPage() {
  return (
    <div className="w-full bg-white dark:bg-[#070D18] text-slate-900 dark:text-white transition-colors duration-300">
      {/* 1. Hero: Personal introduction & Researcher profile card */}
      <AboutHero />

      {/* 2. A little about me (Genuine personal story) */}
      <AboutBio />

      {/* 3. What I'm doing now (Industry, study, building) */}
      <CurrentlySection />

      {/* 4. My journey (Human timeline) */}
      <JourneyTimeline />

      {/* 5. What I enjoy working on (4 core areas) */}
      <WorkAreas />

      {/* 6. Education (Secondary, clean profile entries) */}
      <EducationSection />

      {/* 7. Beyond the work (Personal curiosities & interests) */}
      <InterestsSection />

      {/* 8. Why I built QuantSynthicaLab (Supporting personal project section) */}
      <PersonalProjectSection />

      {/* 9. Let's connect (Warm human closing) */}
      <ConnectSection />

      {/* 10. Unified site footer */}
      <Footer />
    </div>
  );
}
