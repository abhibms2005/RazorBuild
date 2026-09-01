import { useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { type MotionValue } from "framer-motion";
import { SoundToggle } from "./SoundToggle";

interface NavProps {
  scrollProgress?: MotionValue<number>;
}

/**
 * Persistent top nav with scroll-linked scrim.
 * On Home page: dynamic scroll opacity.
 * On Inner pages: crisp blurred dark scrim with persistent boundary.
 */
export function Nav({ scrollProgress }: NavProps) {
  const navRef = useRef<HTMLElement>(null);

  // Scroll-linked background for home page
  useEffect(() => {
    if (!scrollProgress) return;
    return scrollProgress.on("change", (v: number) => {
      if (!navRef.current) return;
      const opacity = Math.min(v * 10, 0.85);
      const blur = Math.min(v * 14, 14);
      navRef.current.style.backgroundColor = `rgba(8, 8, 10, ${opacity})`;
      navRef.current.style.backdropFilter = `blur(${blur}px)`;
      navRef.current.style.setProperty("-webkit-backdrop-filter", `blur(${blur}px)`);
    });
  }, [scrollProgress]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive ? "text-chalk" : "text-chalk-muted hover:text-chalk"}`;

  const defaultStyle = scrollProgress
    ? { backgroundColor: "rgba(8,8,10,0)", backdropFilter: "blur(0px)" }
    : { backgroundColor: "rgba(8,8,10,0.85)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-chalk-muted/10"
      style={defaultStyle}
    >
      {/* Left: wordmark + breadcrumb */}
      <div className="flex items-center gap-2">
        <NavLink
          to="/"
          className="font-medium text-sm text-chalk tracking-tight hover:text-chalk transition-colors"
        >
          RRL
        </NavLink>
        <span className="text-chalk-muted/30 text-xs">/</span>
        <span className="font-mono text-[11px] text-chalk-muted/50">
          revenue-recovery
        </span>
      </div>

      {/* Right: nav links + sound toggle + CTA */}
      <div className="flex items-center gap-4 sm:gap-5">
        <NavLink to="/how-it-works" className={linkClass}>
          <span className="hidden sm:inline text-[13px]">How it works</span>
        </NavLink>
        <NavLink to="/results" className={linkClass}>
          <span className="hidden sm:inline text-[13px]">Results</span>
        </NavLink>
        <SoundToggle />
        <NavLink
          to="/dashboard"
          className="relative inline-flex items-center gap-2 bg-btn text-btn-text px-4 py-1.5 text-[13px] font-medium rounded-md transition-all hover:scale-[0.98] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-ember/40 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
          </span>
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}
