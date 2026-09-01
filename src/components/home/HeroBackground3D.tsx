import { lazy, Suspense, useEffect, useState } from "react";

const HeroParticlesScene = lazy(() => import("./HeroParticlesScene"));

function useShouldRender3D() {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    setCanRender(!prefersReduced && !isMobile);

    const onResize = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setCanRender(!reduced && window.innerWidth >= 768);
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return canRender;
}

export function HeroBackground3D() {
  const canRender3D = useShouldRender3D();

  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* Base Image Layer */}
      <img
        src="/scene-bg.png"
        alt=""
        className="h-full w-full object-cover object-[54%_center] select-none pointer-events-none"
      />

      {/* Atmospheric Vignettes & Color Grading */}
      <div className="absolute inset-0 bg-void/50" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,10,0.95)_0%,rgba(8,8,10,0.72)_38%,rgba(8,8,10,0.38)_72%,rgba(8,8,10,0.75)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,var(--color-void)_0%,rgba(8,8,10,0)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(to_bottom,rgba(8,8,10,0.85)_0%,rgba(8,8,10,0)_100%)]" />

      {/* Subtle glowing focal spots matching image light trails */}
      <div className="absolute top-[28%] left-[22%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/6 blur-[110px] pointer-events-none" />
      <div className="absolute top-[48%] right-[18%] h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none" />

      {/* 3D R3F Particle Flow Layer */}
      {canRender3D && (
        <div className="absolute inset-0 opacity-80 transition-opacity duration-1000">
          <Suspense fallback={null}>
            <HeroParticlesScene />
          </Suspense>
        </div>
      )}
    </div>
  );
}
