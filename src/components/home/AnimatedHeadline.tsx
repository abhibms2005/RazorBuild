import { motion } from "framer-motion";

const lines = ["Revenue", "Recovery", "Layer"];

export function AnimatedHeadline() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      {/* Eyebrow Label with slide + fade entrance */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex items-center gap-2.5"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75 duration-1000" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">
          Razorpay revenue intelligence
        </span>
      </motion.div>

      {/* Main Headline: Staggered Blur-to-Sharp Lines */}
      <h1 className="max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.03em] text-chalk sm:text-7xl lg:text-[6.8rem] xl:text-[7.4rem]">
        {lines.map((line, index) => (
          <span key={line} className="inline-block overflow-visible pr-3.5 lg:pr-5">
            <motion.span
              className="inline-block origin-bottom will-change-[transform,filter,opacity]"
              initial={
                prefersReduced
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: 28,
                      filter: "blur(12px)",
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.85,
                delay: 0.15 + index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>

      {/* Subhead with smooth delayed entrance */}
      <motion.p
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim sm:text-xl"
      >
        Turn failed recurring payments into a governed recovery queue with diagnosis, bounded retries,
        payment links, human escalation, and an audit trail your finance team can trust.
      </motion.p>
    </div>
  );
}
