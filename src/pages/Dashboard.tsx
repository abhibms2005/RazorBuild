import { lazy, useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardData } from "../hooks/useDashboardData";
import { RunBatchButton } from "../components/dashboard/RunBatchButton";
import { RecordsTable } from "../components/dashboard/RecordsTable";
import { AuditTapePanel } from "../components/dashboard/AuditTapePanel";
import { Card, Eyebrow, RecoveryCommandCenter, SceneFallback, StatusDot } from "../components/shared";

const OrbitAccent = lazy(() => import("../components/three/OrbitAccent"));

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  ));

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export default function Dashboard() {
  const {
    summary,
    prevSummary,
    records,
    audit,
    loading,
    error,
    running,
    successFlash,
    runBatch,
    retry,
  } = useDashboardData();
  const isDesktop = useDesktopViewport();

  // Track which stats changed for highlight pulse
  const [highlightStats, setHighlightStats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (successFlash && summary && prevSummary) {
      const changed = new Set<string>();
      if (summary.recovered !== prevSummary.recovered) changed.add("recovered");
      if (summary.awaiting !== prevSummary.awaiting) changed.add("awaiting");
      if (summary.manual_review !== prevSummary.manual_review) changed.add("manual_review");
      if (summary.errors !== prevSummary.errors) changed.add("errors");
      if (summary.total_at_risk !== prevSummary.total_at_risk) changed.add("total_at_risk");
      setHighlightStats(changed);
      const timer = setTimeout(() => setHighlightStats(new Set()), 1800);
      return () => clearTimeout(timer);
    }
  }, [successFlash, summary, prevSummary]);

  return (
    <div className="min-h-screen bg-void text-chalk selection:bg-ember selection:text-void relative">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "url('/scene-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "50% center",
          }}
        />
        <div className="absolute inset-0 bg-void/92" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void-light/50 to-transparent" />
      </div>

      {/* Header section */}
      <section className="px-5 pt-4 pb-6 sm:px-8 sm:pt-6 sm:pb-8 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Live operations
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-chalk font-semibold tracking-tight">
              Recovery Operations Dashboard
            </h1>
            <p className="text-sm sm:text-base text-chalk-dim mt-1.5">
              Deterministic recovery monitoring across all active subscription decline events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RunBatchButton running={running} success={successFlash} onClick={runBatch} />
          </div>
        </div>
      </section>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 pb-4 sm:px-8 lg:px-12 max-w-7xl mx-auto"
          >
            <div className="bg-red-950/40 border border-red-500/30 px-4 py-3 flex items-center justify-between rounded-lg backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <span className="font-mono text-xs text-red-300">{error}</span>
              </div>
              <button
                onClick={retry}
                className="font-mono text-xs text-red-300 hover:text-red-200 underline font-semibold"
              >
                Retry connection
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Metrics Row + 3D Orbit Accent */}
      {summary && (
        <section className="px-5 pb-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <RecoveryCommandCenter
              title="Live batch run"
              metrics={[
                {
                  label: "Total at risk",
                  value: formatINR(summary.total_at_risk),
                  percent: 100,
                  tone: "amber",
                  highlight: highlightStats.has("total_at_risk"),
                },
                {
                  label: "Recovered",
                  value: formatINR(summary.recovered),
                  percent: summary.recovery_rate,
                  tone: "mint",
                  highlight: highlightStats.has("recovered"),
                },
                {
                  label: "Awaiting payment",
                  value: formatINR(summary.awaiting),
                  percent: 27.6,
                  tone: "blue",
                  highlight: highlightStats.has("awaiting"),
                },
                {
                  label: "Manual review",
                  value: formatINR(summary.manual_review),
                  percent: 15.5,
                  tone: "amber",
                  highlight: highlightStats.has("manual_review"),
                },
                {
                  label: "Handled errors",
                  value: formatINR(summary.errors),
                  percent: 12.1,
                  tone: "red",
                  highlight: highlightStats.has("errors"),
                },
              ]}
            />

            {/* Restrained 3D Orbit Ring Accent Card */}
            {isDesktop && (
              <Card className="min-h-[220px] p-0 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-chalk-muted/10 px-4 py-3 bg-void/60">
                  <div>
                    <Eyebrow tone={running ? "amber" : "mint"}>
                      {running ? "Processing" : "System live"}
                    </Eyebrow>
                    <p className="mt-0.5 text-xs text-chalk-dim">Batch monitor</p>
                  </div>
                  <StatusDot tone={running ? "amber" : "mint"} />
                </div>

                <div className="relative h-[160px] min-h-[160px]">
                  <Suspense fallback={<SceneFallback variant="orbit" />}>
                    <OrbitAccent status={running ? "running" : "live"} />
                  </Suspense>
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Main Records Table & Audit Stream */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] border border-chalk-muted/15 rounded-xl min-h-[520px] overflow-hidden bg-void-light/50 backdrop-blur-xl shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)]">
          {/* Records Table Column */}
          <div className="flex flex-col min-h-[500px]">
            <RecordsTable records={records} loading={loading} />
          </div>

          {/* Audit Tape Panel Column */}
          <div className="lg:sticky lg:top-14 lg:self-start lg:max-h-[calc(100vh-3.5rem)] lg:border-l border-t lg:border-t-0 border-chalk-muted/15 min-h-[360px] lg:min-h-0 bg-void-light/30">
            <AuditTapePanel entries={audit} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
}
