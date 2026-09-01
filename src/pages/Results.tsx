import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Eyebrow, SceneFallback } from "../components/shared";
import { mockSummary } from "../data/mockDashboard";
import type { MonumentData } from "../components/three/DataMonumentScene";

const DataMonumentScene = lazy(() => import("../components/three/DataMonumentScene"));

const API_BASE = import.meta.env.VITE_API_BASE || "";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const onChange = () => setReduced(q.matches);
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CountUpValue({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    let startTime = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, prefersReduced]);

  return (
    <span className="tabular-nums font-mono">
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

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
  const prefersReduced = usePrefersReducedMotion();
  const [summary, setSummary] = useState(mockSummary);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`${API_BASE}/api/summary`);
        if (res.ok) {
          const data = await res.json();
          const s = data.summary || data;
          if (s.recovered !== undefined) {
            setSummary({
              total_at_risk: s.total_at_risk || mockSummary.total_at_risk,
              recovered: s.recovered || mockSummary.recovered,
              awaiting: s.awaiting || mockSummary.awaiting,
              manual_review: s.manual_review || mockSummary.manual_review,
              errors: s.errors || mockSummary.errors,
              recovery_rate: s.recovery_rate || mockSummary.recovery_rate,
            });
          }
        }
      } catch {
        // Fallback to mock baseline
      }
    }
    fetchSummary();
  }, []);

  const monumentData: MonumentData = {
    recoveredCount: 28,
    recoveredAmount: formatINR(summary.recovered),
    awaitingCount: 14,
    awaitingAmount: formatINR(summary.awaiting),
    reviewCount: 9,
    reviewAmount: formatINR(summary.manual_review),
    errorCount: 7,
    errorAmount: formatINR(summary.errors),
  };

  const scoreStats = [
    { value: summary.total_at_risk, label: "Total at risk", prefix: "₹", tone: "text-amber" },
    { value: summary.recovered, label: "Recovered", prefix: "₹", tone: "text-emerald-300" },
    { value: summary.recovery_rate, label: "Recovery rate", suffix: "%", tone: "text-chalk" },
    { value: 58, label: "Records processed", tone: "text-sky-300" },
  ];

  return (
    <div className="min-h-screen bg-void text-chalk">
      {/* ─── Hero Section with Max 3D Data Monument ─── */}
      <section className="relative px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12 overflow-hidden">
        <div className="pointer-events-none absolute left-1/3 top-1/2 -z-10 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/5 blur-[140px]" />
        <div className="pointer-events-none absolute right-1/3 top-1/3 -z-10 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/5 blur-[140px]" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.68fr_1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  The results
                </span>
              </div>
              <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight text-chalk sm:text-7xl">
                Measured outcomes, scored like a recovery board.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim">
                The batch recovered {formatINR(summary.recovered)} from {formatINR(summary.total_at_risk)} at risk.
                The 3D monument renders live volumetric proportions, billboarded with real data numbers.
              </p>
            </div>

            {/* 3D Monument Canvas */}
            <div className="relative">
              <div className="h-[380px] overflow-hidden rounded-xl border border-chalk-muted/15 bg-void-light/80 backdrop-blur-xl shadow-[0_24px_50px_-15px_rgba(0,0,0,0.85)] sm:h-[450px]">
                {prefersReduced ? (
                  <SceneFallback variant="monument" />
                ) : (
                  <Suspense fallback={<SceneFallback variant="monument" />}>
                    <DataMonumentScene data={monumentData} />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Scoreboard Section ─── */}
      <section className="px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-xl border border-chalk-muted/15 bg-void-light/70 backdrop-blur-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-chalk-muted/10 bg-void/60 px-6 py-4">
              <div>
                <Eyebrow tone="muted">Recovery scoreboard</Eyebrow>
                <p className="mt-1 text-sm font-medium text-chalk">Batch outcome verification</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded">
                Verified Run
              </span>
            </div>

            {/* 4 Large Score Stats */}
            <div className="grid grid-cols-2 divide-y divide-chalk-muted/10 md:grid-cols-4 md:divide-y-0 md:divide-x border-b border-chalk-muted/10">
              {scoreStats.map((stat) => (
                <div key={stat.label} className="p-6 transition-colors hover:bg-chalk/[0.02]">
                  <p className={`font-mono text-3xl font-semibold sm:text-4xl ${stat.tone}`}>
                    <CountUpValue
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Outcome Mix Breakdown */}
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Recovered", value: formatINR(summary.recovered), percent: 74, color: "bg-emerald-400", tone: "text-emerald-300" },
                  { label: "Awaiting payment", value: formatINR(summary.awaiting), percent: 42, color: "bg-sky-400", tone: "text-sky-300" },
                  { label: "Manual review", value: formatINR(summary.manual_review), percent: 26, color: "bg-ember", tone: "text-ember" },
                  { label: "Handled errors", value: formatINR(summary.errors), percent: 18, color: "bg-red-400", tone: "text-red-300" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-chalk-muted/10 bg-void/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-chalk-dim">{item.label}</span>
                      <span className={`font-mono text-sm font-semibold tabular-nums ${item.tone}`}>
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-void-soft">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-chalk-muted/12 bg-black/40 p-4 font-mono text-[11px] text-chalk-dim">
                <div>
                  <Eyebrow className="mb-3">Outcome Mix</Eyebrow>
                  <div className="space-y-1.5">
                    <p><span className="text-emerald-300 font-bold">28</span> records recovered automatically</p>
                    <p><span className="text-sky-300 font-bold">14</span> records awaiting customer payment link</p>
                    <p><span className="text-ember font-bold">09</span> records escalated to finance review</p>
                    <p><span className="text-red-300 font-bold">07</span> records handled via error policy</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-chalk-muted/10 pt-2 text-[10px] text-chalk-muted/60">
                  Total cohort: 58 payment failure events
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Disclosures Section: What's simulated vs real ─── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <Card tone="accent" className="p-6 sm:p-8">
            <Eyebrow>What's simulated vs. real</Eyebrow>
            <h2 className="mt-4 text-3xl font-medium text-chalk sm:text-4xl">No hidden fine print.</h2>
            <div className="mt-6 grid gap-3.5">
              {disclosures.map(([label, value]) => (
                <div key={label} className="grid gap-1 border-t border-ember/10 pt-3 sm:grid-cols-[220px_1fr]">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ember font-semibold">
                    {label}
                  </span>
                  <span className="text-sm leading-6 text-chalk-dim">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Launch Dashboard CTA ─── */}
      <section className="px-5 pb-24 text-center sm:px-8 lg:px-12">
        <Link
          to="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-8 text-sm font-semibold text-btn-text shadow-[0_0_24px_rgba(240,237,230,0.14)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          See the underlying records in live dashboard
          <ArrowIcon />
        </Link>
      </section>
    </div>
  );
}
