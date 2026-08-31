import { motion, useScroll } from "framer-motion";
import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Card, Eyebrow, RecoveryCommandCenter } from "../components/shared";

const metrics = [
  { value: "₹55,372", label: "Recovered from one batch" },
  { value: "48.3%", label: "Measured recovery rate" },
  { value: "58", label: "Failed records processed" },
  { value: "< 90s", label: "Batch decision time" },
];

const workflow = [
  {
    step: "01",
    title: "Detect failed payments",
    body: "Listens for Razorpay payment failure events and immediately groups recoverable subscription records.",
  },
  {
    step: "02",
    title: "Diagnose the cause",
    body: "Classifies decline patterns, customer context, and retry eligibility before any action is taken.",
  },
  {
    step: "03",
    title: "Recover with limits",
    body: "Schedules a bounded retry, sends a payment link, or escalates to a human when confidence is low.",
  },
];

const controls = [
  "Hard retry caps",
  "Cooldown windows",
  "Confidence thresholds",
  "Payment-link expiry",
  "Full audit trail",
  "Human escalation",
];

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen overflow-hidden bg-void text-chalk">
      <Nav scrollProgress={scrollYProgress} />

      <main>
        <section className="relative min-h-[92svh] px-5 pt-28 sm:px-8 lg:px-12">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <img
              src="/scene-bg.png"
              alt=""
              className="h-full w-full object-cover object-[54%_center]"
            />
            <div className="absolute inset-0 bg-void/52" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,10,0.96)_0%,rgba(8,8,10,0.74)_38%,rgba(8,8,10,0.42)_72%,rgba(8,8,10,0.72)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,var(--color-void)_0%,rgba(8,8,10,0)_100%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(420px,0.72fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-4xl"
            >
              <Eyebrow className="mb-5">Razorpay revenue intelligence</Eyebrow>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.96] text-chalk sm:text-7xl lg:text-[7.2rem] xl:text-[7.8rem]">
                Revenue Recovery Layer
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim sm:text-xl">
                Turn failed recurring payments into a governed recovery queue with diagnosis, bounded retries,
                payment links, human escalation, and an audit trail your finance team can trust.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-6 text-sm font-semibold text-btn-text transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  Open recovery dashboard
                  <ArrowIcon />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-chalk-muted/25 px-6 text-sm font-semibold text-chalk transition hover:border-chalk-muted/50 hover:bg-chalk/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  See workflow
                  <ArrowIcon />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
              className="mb-8 lg:mb-16"
            >
              <RecoveryCommandCenter />
            </motion.div>
          </div>

          <div className="mx-auto mt-8 grid max-w-7xl grid-cols-2 border-y border-chalk-muted/10 bg-void/35 backdrop-blur md:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="border-chalk-muted/10 p-4 odd:border-r md:border-r md:last:border-r-0 sm:p-5">
                <p className="font-mono text-2xl font-medium tabular-nums text-chalk sm:text-3xl">{metric.value}</p>
                <p className="mt-2 text-xs uppercase leading-5 tracking-[0.12em] text-chalk-muted">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr] lg:items-start">
              <div>
                <Eyebrow>Operating model</Eyebrow>
                <h2 className="mt-4 max-w-xl text-4xl font-medium leading-tight text-chalk sm:text-5xl">
                  Built for payment recovery teams that need proof, not promises.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {workflow.map((item) => (
                  <Card as="article" key={item.step}>
                    <span className="font-mono text-sm text-ember">{item.step}</span>
                    <h3 className="mt-8 text-xl font-medium text-chalk">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-chalk-dim">{item.body}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-chalk-muted/10 bg-void-light/55 px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-center">
            <div>
              <Eyebrow tone="mint">Governed automation</Eyebrow>
              <h2 className="mt-4 text-4xl font-medium leading-tight text-chalk sm:text-5xl">
                Autonomous where it helps. Accountable where it matters.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-chalk-dim">
                Recovery decisions are constrained by policy, written to the audit stream, and escalated before
                uncertainty becomes customer friction.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {controls.map((control) => (
                <Card key={control} className="flex min-h-14 items-center gap-3 px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <CheckIcon />
                  </span>
                  <span className="text-sm font-medium text-chalk-dim">{control}</span>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-5 py-20 text-center sm:px-8 lg:px-12">
          <div className="absolute inset-0 -z-10 opacity-45" aria-hidden="true">
            <img src="/scene-bg.png" alt="" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-void/82" />
          </div>

          <div className="mx-auto max-w-3xl">
            <Eyebrow>Ready to inspect the run</Eyebrow>
            <h2 className="mt-4 text-4xl font-medium leading-tight text-chalk sm:text-5xl">
              See every failed payment, action, and outcome.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-chalk-dim">
              The dashboard shows the underlying records, recovery status, and audit tape behind the headline numbers.
            </p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-7 text-sm font-semibold text-btn-text transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Launch dashboard
              <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
