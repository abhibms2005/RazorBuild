import { motion } from "framer-motion";

const workflow = [
  {
    step: "01",
    title: "Detect failed payments",
    body: "Listens for Razorpay payment failure events and immediately groups recoverable subscription records.",
    codeSnippet: 'event: "payment_failed" • txn: 7k2m9x',
    tone: "text-ember",
    borderGlow: "group-hover:border-ember/40",
  },
  {
    step: "02",
    title: "Diagnose the cause",
    body: "Classifies decline patterns, customer context, and retry eligibility before any action is taken.",
    codeSnippet: "cause: insufficient_funds • conf: 0.95",
    tone: "text-sky-300",
    borderGlow: "group-hover:border-sky-400/40",
  },
  {
    step: "03",
    title: "Recover with limits",
    body: "Schedules a bounded retry, sends a payment link, or escalates to a human when confidence is low.",
    codeSnippet: "action: smart_retry • cooldown: 4h",
    tone: "text-emerald-300",
    borderGlow: "group-hover:border-emerald-400/40",
  },
];

export function OperatingModelSection() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="relative px-5 py-24 sm:px-8 lg:px-12">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-void-mid/40 blur-[130px]" />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1fr] lg:items-start">
          {/* Left Column: Heading & Description */}
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Operating model
              </span>
            </div>

            <h2 className="text-4xl font-medium leading-[1.08] tracking-tight text-chalk sm:text-5xl lg:text-[3.2rem]">
              Built for payment recovery teams that need proof, not promises.
            </h2>
            <p className="mt-6 text-base leading-7 text-chalk-dim sm:text-lg">
              Every failed payment passes through deterministic gates. Decisions are calculated and logged
              within seconds of webhook receipt.
            </p>
          </motion.div>

          {/* Right Column: 3 Stage Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            {workflow.map((item, idx) => (
              <motion.article
                key={item.step}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group relative flex flex-col justify-between rounded-xl border border-chalk-muted/15 bg-void-light/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-void-light/95 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] ${item.borderGlow}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-sm font-semibold ${item.tone}`}>
                      {item.step}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-chalk-muted/30 group-hover:bg-chalk-muted/60 transition-colors" />
                  </div>

                  <h3 className="mt-6 text-xl font-medium text-chalk tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-chalk-dim">
                    {item.body}
                  </p>
                </div>

                <div className="mt-6 rounded-md border border-chalk-muted/10 bg-black/40 px-3 py-2 font-mono text-[10.5px] text-chalk-muted tracking-tight truncate">
                  {item.codeSnippet}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
