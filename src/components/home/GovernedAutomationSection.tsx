import { motion } from "framer-motion";

const controls = [
  {
    name: "Hard retry caps",
    spec: "MAX: 3 attempts",
    desc: "Stops endless automated retries before customer trust is compromised.",
  },
  {
    name: "Cooldown windows",
    spec: "1h → 4h → 8h backoff",
    desc: "Prevents immediate successive failures from flooding banking gateways.",
  },
  {
    name: "Confidence thresholds",
    spec: "Min 80% confidence",
    desc: "Uncertain or borderline failure diagnoses trigger immediate human review.",
  },
  {
    name: "Payment-link expiry",
    spec: "48 hours strict",
    desc: "Time-bounded link life cycles prevent outdated collection attempts.",
  },
  {
    name: "Full audit trail",
    spec: "Immutable ledger",
    desc: "Every diagnosis, decision weight, and API webhook stored with timestamps.",
  },
  {
    name: "Human escalation",
    spec: "Auto-ticket creation",
    desc: "Escalates blocked cards and high-risk flags directly to finance operators.",
  },
];

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function GovernedAutomationSection() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="relative border-y border-chalk-muted/12 bg-void-light/45 px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/* Left Column: Heading */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Governed automation
            </span>
          </div>

          <h2 className="text-4xl font-medium leading-[1.08] tracking-tight text-chalk sm:text-5xl lg:text-[3.2rem]">
            Autonomous where it helps. Accountable where it matters.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-chalk-dim sm:text-lg">
            Recovery decisions are constrained by policy rails, written to the audit stream, and escalated
            before uncertainty becomes customer friction.
          </p>
        </motion.div>

        {/* Right Column: 6 Policy Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {controls.map((control, idx) => (
            <motion.div
              key={control.name}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative rounded-xl border border-chalk-muted/12 bg-void/60 p-4.5 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/30 hover:bg-void/80 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                    <CheckIcon />
                  </span>
                  <span className="text-sm font-medium text-chalk">
                    {control.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-chalk-muted/70 bg-chalk-muted/10 px-2 py-0.5 rounded">
                  {control.spec}
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-5 text-chalk-dim">
                {control.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
