import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { useState } from "react";

interface BackgroundProps {
  scrollProgress: MotionValue<number>;
}

/**
 * Fixed full-bleed background using /scene-bg.png.
 * Scroll-linked position shift from left (orange) → right (blue).
 * Strengthened scrim ensures text legibility at all scroll positions.
 */
export function Background({ scrollProgress }: BackgroundProps) {
  const [bgX, setBgX] = useState(45);

  useMotionValueEvent(scrollProgress, "change", (v: number) => {
    const shifted = 45 + v * 10;
    setBgX(Math.round(shifted * 10) / 10);
  });

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      {/* The image */}
      <div
        className="absolute inset-0 transition-[background-position] duration-700 ease-out"
        style={{
          backgroundImage: "url('/scene-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: `${bgX}% center`,
        }}
      />

      {/* Scrim layers — strengthened for text legibility */}

      {/* Base darkening */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Midline scrim — STRONG where trails converge (35-65% viewport)
          This is where Tier 3 text sits, so it needs real darkening */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.3) 70%, transparent 90%)",
        }}
      />

      {/* Top vignette — nav legibility */}
      <div
        className="absolute inset-x-0 top-0 h-1/4"
        style={{
          background: "linear-gradient(to bottom, rgba(8,8,10,0.6) 0%, transparent 100%)",
        }}
      />

      {/* Bottom vignette — lower text legibility */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/4"
        style={{
          background: "linear-gradient(to top, rgba(8,8,10,0.7) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
