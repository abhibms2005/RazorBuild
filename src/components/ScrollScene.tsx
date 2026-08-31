import { useRef, useEffect, useCallback, useState } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { chapters, type ChapterLevel } from "../data/chapters";

interface ScrollSceneProps {
  scrollProgress: MotionValue<number>;
}

/**
 * 4-level type sizing system — explicit px values, no Tailwind variables
 *   Level 1: 22-26px, weight 400-450 (quiet setup)
 *   Level 2: 32-40px, weight 500 (data/proof)
 *   Level 3: 130-170px, weight 900 (THE peak — dramatically larger)
 *   Level 4: 11-13px, uppercase, letter-spaced (UI chrome)
 */
function levelStyles(level: ChapterLevel): string {
  switch (level) {
    case 1:
      return "text-[22px] sm:text-[26px] font-normal leading-[1.35]";
    case 2:
      return "text-[32px] sm:text-[40px] font-medium leading-[1.2]";
    case 3:
      return "text-[8rem] sm:text-[10rem] md:text-[11rem] lg:text-[13rem] font-black leading-[0.95] tracking-[-0.03em]";
    case 4:
      return "text-[11px] sm:text-[13px] font-medium uppercase tracking-[0.1em] opacity-60";
  }
}

function alignClasses(align: "left" | "center" | "right"): string {
  switch (align) {
    case "left":
      return "items-start justify-start text-left pl-6 sm:pl-12 md:pl-20 lg:pl-28";
    case "right":
      return "items-end justify-end text-right pr-6 sm:pr-12 md:pr-20 lg:pr-28";
    case "center":
    default:
      return "items-center justify-center text-center";
  }
}

function verticalPosition(level: ChapterLevel): string {
  switch (level) {
    case 1:
      return "pt-[22vh] sm:pt-[24vh]";
    case 2:
      return "pt-[20vh] sm:pt-[22vh]";
    case 3:
      return "pt-[26vh] sm:pt-[28vh]";
    case 4:
      return "pt-[20vh] sm:pt-[22vh]";
  }
}

/** Eased interpolation: ease-out cubic */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function ChapterText({
  chapter,
  scrollContainerRef,
}: {
  chapter: (typeof chapters)[number];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const update = useCallback(() => {
    const el = elRef.current;
    const container = scrollContainerRef.current;
    if (!el || !container) return;

    const viewportH = window.innerHeight;
    const totalScroll = container.offsetHeight - viewportH;
    if (totalScroll <= 0) return;

    const rect = container.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -rect.top / totalScroll));

    const pad = 0.035;
    const fadeIn = chapter.start;
    const fadeInEnd = chapter.start + pad;
    const fadeOut = chapter.end;
    const fadeOutEnd = chapter.end + pad;

    let opacity: number;
    let translateY: number;
    let scale = 1;

    if (progress < fadeIn - pad) {
      opacity = 0;
      translateY = prefersReduced ? 0 : 8;
    } else if (progress < fadeInEnd) {
      const raw = (progress - (fadeIn - pad)) / (fadeInEnd - (fadeIn - pad));
      const t = easeOut(Math.min(1, Math.max(0, raw)));
      opacity = t;
      translateY = prefersReduced ? 0 : 8 * (1 - t);
      // Level 3 gets a scale-in (0.97 → 1.0)
      if (chapter.level === 3) {
        scale = 0.97 + 0.03 * t;
      }
    } else if (progress < fadeOut) {
      opacity = 1;
      translateY = 0;
    } else if (progress < fadeOutEnd) {
      const raw = (progress - fadeOut) / (fadeOutEnd - fadeOut);
      const t = easeOut(Math.min(1, Math.max(0, raw)));
      opacity = 1 - t;
      translateY = prefersReduced ? 0 : -6 * t;
    } else {
      opacity = 0;
      translateY = prefersReduced ? 0 : -6;
    }

    el.style.opacity = String(opacity);
    el.style.transform = `translateY(${translateY}px) scale(${scale})`;
  }, [chapter, scrollContainerRef, prefersReduced]);

  useEffect(() => {
    update();
    const onScroll = () => requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [update]);

  return (
    <div
      ref={elRef}
      className={`absolute inset-0 flex px-6 sm:px-12 ${alignClasses(chapter.align || "center")} ${verticalPosition(chapter.level)}`}
      style={{ opacity: 0, willChange: "opacity, transform" }}
    >
      <p
        className={`${levelStyles(chapter.level)} text-chalk max-w-5xl`}
        aria-label={chapter.ariaLabel}
      >
        {chapter.content}
      </p>
    </div>
  );
}

/**
 * Opening beat: RRL wordmark → then scroll affordance.
 * Sequenced: nav fades in first, wordmark at 400ms, scroll hint at 1.8s.
 */
function OpeningBeat() {
  const [phase, setPhase] = useState<"hidden" | "wordmark" | "scroll">("hidden");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("wordmark"), 400);
    const t2 = setTimeout(() => setPhase("scroll"), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 60) setScrolled(true); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scrolled || phase === "hidden") return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-[14vh]">
      {/* Wordmark */}
      <div
        className={`absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-[800ms] ease-out ${
          phase === "wordmark" || phase === "scroll" ? "opacity-100" : "opacity-0"
        } ${phase === "scroll" ? "-translate-y-[calc(50%+20px)]" : ""}`}
      >
        <span className="font-display text-[var(--type-display)] sm:text-[var(--type-display-lg)] text-chalk/70 font-light tracking-tight">
          RRL
        </span>
      </div>

      {/* Scroll affordance — thin vertical line + label */}
      <div
        className={`flex flex-col items-center gap-2 transition-opacity duration-600 ${
          phase === "scroll" ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk-muted/35">
          Scroll
        </span>
        {!prefersReduced && (
          <div className="relative h-8 w-px">
            {/* Animated line */}
            <div className="absolute inset-0 bg-gradient-to-b from-chalk-muted/0 via-chalk-muted/30 to-chalk-muted/0 animate-[scrollPulse_2s_ease-in-out_infinite]" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The scroll-driven cinematic scene.
 */
export function ScrollScene({ scrollProgress }: ScrollSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      scrollProgress.set(v);
    });
  }, [scrollYProgress, scrollProgress]);

  return (
    <div ref={containerRef} className="h-[600vh] relative">
      <OpeningBeat />

      <div className="sticky top-0 h-screen overflow-hidden">
        {chapters.map((chapter, i) => (
          <ChapterText
            key={i}
            chapter={chapter}
            scrollContainerRef={containerRef}
          />
        ))}
      </div>
    </div>
  );
}
