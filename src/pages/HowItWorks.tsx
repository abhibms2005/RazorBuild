import { lazy } from "react";
import { Link } from "react-router-dom";
import { Card, Eyebrow, Scene3D, SceneFallback } from "../components/shared";

const PipelineScene = lazy(() => import("../components/three/PipelineScene"));

const stages = [
  {
    step: "01",
    title: "Detect",
    body: "The ledger listens for payment_failed events, normalizes the payload, and attaches subscription context before the record enters recovery.",
    log: `{
  event: "payment_failed",
  txn_id: "txn_7k2m9x",
  subscription_id: "sub_rah_118",
  amount: 14999
}`,
  },
  {
    step: "02",
    title: "Diagnose",
    body: "Each failure is classified into a known cause with confidence, customer tenure, and eligibility signals used by the decision layer.",
    log: `{
  cause: "insufficient_funds",
  confidence: 0.95,
  customer_tenure: "18 months",
  retry_eligible: true
}`,
  },
  {
    step: "03",
    title: "Recover",
    body: "The system chooses exactly one action: schedule a smart retry, send a payment link, or escalate to finance when automation should stop.",
    log: `{
  action: "schedule_smart_retry",
  attempt: "2 / 3",
  cooldown_hours: 4,
  max_attempts: 3
}`,
  },
  {
    step: "04",
    title: "Audit",
    body: "Every diagnosis, decision, and outcome is written as a timestamped audit entry so the recovery path can be reviewed later.",
    log: `{
  phase: "execute",
  result: "retry_scheduled",
  next_webhook: "awaiting",
  logged_at: "04:12:00.358"
}`,
  },
];

const safeguards = [
  ["MAX_RETRIES", "3", "Retries stop before customer pressure becomes noise."],
  ["COOLDOWN", "1h → 4h → 8h", "Backoff windows prevent blind repeated attempts."],
  ["CONFIDENCE_THRESHOLD", "0.80", "Low-confidence cases move to a human reviewer."],
  ["LINK_EXPIRY", "48 hours", "Payment links cannot linger indefinitely."],
  ["ERROR_POLICY", "catch → log → escalate", "Failures are visible and recoverable."],
  ["AUDIT_SCOPE", "diagnose + decide + execute", "Each automated choice has a durable trace."],
];

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-void">
      <section className="px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-center">
            <div>
              <Eyebrow>The mechanism</Eyebrow>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.96] text-chalk sm:text-7xl">
                How the recovery loop actually runs.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim">
                Four bounded stages convert payment failure events into auditable action. The 3D path is decorative;
                the real operating model is spelled out below in readable logs and constraints.
              </p>
            </div>

            <div className="relative">
              <Scene3D
                Scene={PipelineScene}
                fallback={<SceneFallback variant="pipeline" />}
                className="h-[360px] overflow-hidden rounded-md border border-chalk-muted/12 bg-void-light/70 sm:h-[430px]"
              />
              <div className="pointer-events-none absolute inset-x-[9%] top-1/2 hidden -translate-y-1/2 grid-cols-4 gap-4 sm:grid">
                {["Detect", "Diagnose", "Recover", "Audit"].map((label) => (
                  <span key={label} className="pt-20 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-dim">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>Stage outputs</Eyebrow>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {stages.map((stage) => (
              <Card as="article" key={stage.step} className="flex min-h-[420px] flex-col">
                <span className="font-mono text-sm text-ember">{stage.step}</span>
                <h2 className="mt-8 text-2xl font-medium text-chalk">{stage.title}</h2>
                <p className="mt-3 text-sm leading-6 text-chalk-dim">{stage.body}</p>
                <pre className="mt-auto overflow-x-auto rounded-md border border-chalk-muted/10 bg-black/25 p-4 font-mono text-[11px] leading-5 text-chalk-dim">
                  <code>{stage.log}</code>
                </pre>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-chalk-muted/10 bg-void-light/55 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1fr] lg:items-start">
          <div>
            <Eyebrow tone="mint">Governed automation</Eyebrow>
            <h2 className="mt-4 text-4xl font-medium leading-tight text-chalk sm:text-5xl">
              Autonomous where it helps. Accountable where it matters.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-chalk-dim">
              The agent is allowed to move fast only inside explicit policy rails. Anything uncertain, exhausted,
              blocked, or risky becomes a human-facing review item.
            </p>
          </div>

          <div className="grid gap-3">
            {safeguards.map(([rule, value, desc]) => (
              <Card key={rule} className="grid gap-2 p-4 sm:grid-cols-[190px_140px_1fr] sm:items-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ember">{rule}</span>
                <span className="font-mono text-sm tabular-nums text-chalk">{value}</span>
                <span className="text-sm leading-6 text-chalk-dim">{desc}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 text-center sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Next proof layer</Eyebrow>
          <h2 className="mt-4 text-4xl font-medium leading-tight text-chalk sm:text-5xl">
            Follow the mechanism into measured outcomes.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/results"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-7 text-sm font-semibold text-btn-text transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              See the results
              <ArrowIcon />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-chalk-muted/25 px-7 text-sm font-semibold text-chalk transition hover:border-chalk-muted/50 hover:bg-chalk/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Open dashboard
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
