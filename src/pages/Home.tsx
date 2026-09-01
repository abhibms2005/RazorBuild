import { useScroll } from "framer-motion";
import { Nav } from "../components/Nav";
import { HeroBackground3D } from "../components/home/HeroBackground3D";
import { AnimatedHeadline } from "../components/home/AnimatedHeadline";
import { HeroCtaButtons } from "../components/home/HeroCtaButtons";
import { CommandCenterPanel } from "../components/home/CommandCenterPanel";
import { MetricsRibbon } from "../components/home/MetricsRibbon";
import { OperatingModelSection } from "../components/home/OperatingModelSection";
import { GovernedAutomationSection } from "../components/home/GovernedAutomationSection";
import { ExitCtaSection } from "../components/home/ExitCtaSection";

export default function Home() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-void text-chalk selection:bg-ember selection:text-void">
      {/* Top Nav with scroll-linked scrim */}
      <Nav scrollProgress={scrollYProgress} />

      <main>
        {/* ─── Hero Section ─── */}
        <section className="relative min-h-[96svh] px-5 pt-28 pb-12 sm:px-8 sm:pt-32 lg:px-12 flex flex-col justify-between">
          {/* Base scene-bg.png + R3F 3D Particle Layer */}
          <HeroBackground3D />

          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(400px,0.8fr)] lg:items-center">
            {/* Left: Typography & CTAs */}
            <div className="max-w-3xl">
              <AnimatedHeadline />
              <HeroCtaButtons />
            </div>

            {/* Right: 3D Interactive Command Center Panel */}
            <div className="w-full lg:translate-y-2">
              <CommandCenterPanel />
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="w-full">
            <MetricsRibbon />
          </div>
        </section>

        {/* ─── Operating Model Section ─── */}
        <OperatingModelSection />

        {/* ─── Governed Automation Section ─── */}
        <GovernedAutomationSection />

        {/* ─── Exit / Inspect Run Section ─── */}
        <ExitCtaSection />
      </main>
    </div>
  );
}
