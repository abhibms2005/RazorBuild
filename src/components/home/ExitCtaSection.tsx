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

export function ExitCtaSection() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="relative px-5 py-28 text-center sm:px-8 lg:px-12 overflow-hidden">
      {/* Background with faint scene-bg overlay and ambient glow */}
      <div className="absolute inset-0 -z-10 opacity-30 select-none pointer-events-none" aria-hidden="true">
        <img
          src="/scene-bg.png"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-void/85" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-void to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent" />
      </div>

      {/* Central glow aura */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/6 blur-[120px]" />

      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Ready to inspect the run
            </span>
          </div>

          <h2 className="text-4xl font-medium leading-[1.08] tracking-tight text-chalk sm:text-5xl lg:text-[3.4rem]">
            See every failed payment, action, and outcome.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-chalk-dim sm:text-lg">
            The dashboard shows the underlying records, recovery status, and audit tape behind the headline numbers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <motion.div whileTap={{ scale: 0.975 }}>
              <Link
                to="/dashboard"
                className="group relative inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-md bg-btn px-7 text-sm font-semibold text-btn-text shadow-[0_0_24px_rgba(240,237,230,0.15)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_32px_rgba(240,237,230,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative z-10 flex items-center gap-2">
                  Launch dashboard
                  <ArrowIcon />
                </span>
              </Link>
            </motion.div>

            <motion.div whileTap={{ scale: 0.975 }}>
              <Link
                to="/how-it-works"
                className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-md border border-chalk-muted/25 bg-void/40 px-6 text-sm font-semibold text-chalk backdrop-blur-sm transition-all duration-300 hover:border-chalk-muted/60 hover:bg-chalk/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
              >
                <span>See workflow</span>
              </Link>
            </motion.div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 font-mono text-[11px] text-chalk-muted/60">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Webhook listener active
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Track 03: AI Revenue Recovery
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
