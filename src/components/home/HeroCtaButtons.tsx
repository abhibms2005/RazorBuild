import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export function HeroCtaButtons() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center"
    >
      {/* Primary CTA: Open recovery dashboard */}
      <motion.div whileTap={{ scale: 0.975 }} className="inline-block">
        <Link
          to="/dashboard"
          className="group relative inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-md bg-btn px-6 text-sm font-semibold text-btn-text shadow-[0_0_20px_rgba(240,237,230,0.12)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_28px_rgba(240,237,230,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          {/* Subtle light sweep shimmer */}
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span className="relative z-10 flex items-center gap-2">
            Open recovery dashboard
            <ArrowIcon />
          </span>
        </Link>
      </motion.div>

      {/* Secondary CTA: See workflow */}
      <motion.div whileTap={{ scale: 0.975 }} className="inline-block">
        <Link
          to="/how-it-works"
          className="group relative inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-chalk-muted/25 bg-void/40 px-6 text-sm font-semibold text-chalk backdrop-blur-sm transition-all duration-300 hover:border-chalk-muted/60 hover:bg-chalk/[0.06] hover:shadow-[0_0_20px_rgba(232,228,218,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span className="flex items-center gap-2">
            See workflow
            <ArrowIcon />
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
