import { lazy } from "react";
import { Link } from "react-router-dom";
import { Card, Eyebrow, RecoveryCommandCenter, Scene3D, SceneFallback } from "../components/shared";

const DataMonumentScene = lazy(() => import("../components/three/DataMonumentScene"));

const scoreStats = [
  { value: "₹1,19,143", label: "Total at risk", tone: "text-amber" },
  { value: "₹55,372", label: "Recovered", tone: "text-emerald-300" },
  { value: "48.3%", label: "Recovery rate", tone: "text-chalk" },
  { value: "58", label: "Records processed", tone: "text-sky-300" },
];

const commandMetrics = [
  { label: "Recovered", value: "28 records", percent: 48.3, tone: "mint" as const },
  { label: "Awaiting payment", value: "14 records", percent: 24.1, tone: "blue" as const },
  { label: "Manual review", value: "9 records", percent: 15.5, tone: "amber" as const },
  { label: "Handled errors", value: "7 records", percent: 12.1, tone: "red" as const },
];

const disclosures = [
  ["BATCH_SOURCE", "Real Razorpay test transaction data"],
  ["DIAGNOSIS_MODEL", "Rule-based classifier, not ML"],
  ["RECOVERY_ACTIONS", "Smart retry and payment link paths use real API-shaped calls"],
  ["HUMAN_ESCALATION", "Ticket creation is simulated for demo safety"],
  ["METRICS", "Calculated from the batch run shown in the dashboard"],
];

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function Results() {
  return (
    <div className="min-h-screen bg-void">
      <section className="px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1fr] lg:items-center">
            <div>
              <Eyebrow>The results</Eyebrow>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.96] text-chalk sm:text-7xl">
                Measured outcomes, scored like a recovery board.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim">
                The batch recovered ₹55,372 from ₹1,19,143 at risk. The monument is decorative,
                but every number is repeated as crisp DOM text below.
              </p>
            </div>

            <div className="relative">
              <Scene3D
                Scene={DataMonumentScene}
                fallback={<SceneFallback variant="monument" />}
                className="h-[360px] overflow-hidden rounded-md border border-chalk-muted/12 bg-void-light/70 sm:h-[430px]"
              />
              <div className="pointer-events-none absolute inset-x-[11%] bottom-[22%] grid grid-cols-4 gap-2">
                {[
                  ["₹55,372", "28 recovered", "text-emerald-300"],
                  ["₹32,847", "14 awaiting", "text-sky-300"],
                  ["₹18,294", "9 review", "text-ember"],
                  ["₹12,630", "7 errors", "text-red-300"],
                ].map(([value, label, tone]) => (
                  <div key={label} className="text-center">
                    <p className={`font-mono text-[11px] font-medium tabular-nums sm:text-sm ${tone}`}>{value}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-chalk-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <RecoveryCommandCenter title="Batch scoreboard" metrics={commandMetrics} full>
            <div className="grid gap-0 border-b border-chalk-muted/10 md:grid-cols-4">
              {scoreStats.map((stat) => (
                <div key={stat.label} className="border-chalk-muted/10 p-5 md:border-r md:last:border-r-0">
                  <p className={`font-mono text-3xl font-medium tabular-nums sm:text-4xl ${stat.tone}`}>
                    {stat.value}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase leading-5 tracking-[0.12em] text-chalk-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-3 sm:grid-cols-2">
                {commandMetrics.map((metric) => (
                  <Card key={metric.label} className="p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-chalk-dim">{metric.label}</span>
                      <span className="font-mono text-sm tabular-nums text-chalk">{metric.value}</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden bg-chalk-muted/10">
                      <div
                        className={
                          metric.tone === "mint" ? "h-full bg-emerald-400" :
                          metric.tone === "blue" ? "h-full bg-sky-400" :
                          metric.tone === "amber" ? "h-full bg-ember" :
                          "h-full bg-red-400"
                        }
                        style={{ width: `${metric.percent}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
              <div className="rounded-md border border-chalk-muted/10 bg-black/25 p-4 font-mono text-[11px] leading-6 text-chalk-muted">
                <Eyebrow className="mb-3">Outcome mix</Eyebrow>
                <p><span className="text-emerald-300">28</span> recovered</p>
                <p><span className="text-sky-300">14</span> awaiting payment</p>
                <p><span className="text-ember">09</span> manual review</p>
                <p><span className="text-red-300">07</span> handled errors</p>
              </div>
            </div>
          </RecoveryCommandCenter>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <Card tone="accent" className="p-6 sm:p-8">
            <Eyebrow>What's simulated vs. real</Eyebrow>
            <h2 className="mt-4 text-3xl font-medium text-chalk sm:text-4xl">No hidden fine print.</h2>
            <div className="mt-6 grid gap-3">
              {disclosures.map(([label, value]) => (
                <div key={label} className="grid gap-1 border-t border-ember/10 pt-3 sm:grid-cols-[210px_1fr]">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ember">{label}</span>
                  <span className="text-sm leading-6 text-chalk-dim">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="px-5 pb-24 text-center sm:px-8 lg:px-12">
        <Link
          to="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-7 text-sm font-semibold text-btn-text transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          See the underlying records
          <ArrowIcon />
        </Link>
      </section>
    </div>
  );
}
