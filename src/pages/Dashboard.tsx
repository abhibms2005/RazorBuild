import { lazy, useEffect, useState } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { RunBatchButton } from "../components/dashboard/RunBatchButton";
import { RecordsTable } from "../components/dashboard/RecordsTable";
import { AuditTapePanel } from "../components/dashboard/AuditTapePanel";
import { Card, Eyebrow, RecoveryCommandCenter, Scene3D, SceneFallback, StatusDot } from "../components/shared";

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
      setTimeout(() => setHighlightStats(new Set()), 1500);
    }
  }, [successFlash, summary, prevSummary]);

  return (
    <div className="min-h-screen bg-void relative">
      {/* Background: faint ambient texture, not full-bleed cinematic */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url('/scene-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "50% center",
          }}
        />
        <div className="absolute inset-0 bg-void/90" />
        {/* Top vignette only — sliver of the image visible */}
        <div
          className="absolute inset-x-0 top-0 h-48"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, var(--color-void) 100%)",
          }}
        />
      </div>

      <section className="px-5 pt-8 pb-5 sm:px-8 sm:pt-12 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>Live operations</Eyebrow>
            <h1 className="mt-3 font-display text-[var(--type-h3)] sm:text-[var(--type-h2)] text-chalk font-medium">
              Live Recovery Dashboard
            </h1>
            <p className="text-[var(--type-body)] text-chalk-dim mt-1">
              Real-time view of payment recovery across all subscription records.
            </p>
          </div>
          <RunBatchButton running={running} success={successFlash} onClick={runBatch} />
        </div>
      </section>

      {error && (
        <section className="px-5 pb-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-700/20 px-4 py-3 flex items-center justify-between rounded-md">
            <span className="font-mono text-[var(--type-caption)] text-red-400/80">{error}</span>
            <button
              onClick={retry}
              className="font-mono text-[var(--type-caption)] text-red-400 hover:text-red-300 underline"
            >
              Retry
            </button>
          </div>
        </section>
      )}

      {summary && (
        <section className="px-5 pb-5 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <RecoveryCommandCenter
              title="Live batch run"
              full
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
            {isDesktop && (
              <Card className="min-h-[220px] p-0">
                <div className="flex items-center justify-between border-b border-chalk-muted/10 px-4 py-3">
                  <div>
                    <Eyebrow tone="mint">System live</Eyebrow>
                    <p className="mt-1 text-sm text-chalk-dim">Batch monitor</p>
                  </div>
                  <StatusDot tone={running ? "amber" : "mint"} />
                </div>
                <Scene3D
                  Scene={OrbitAccent}
                  fallback={<SceneFallback variant="orbit" />}
                  className="h-[160px] min-h-[160px]"
                />
              </Card>
            )}
          </div>
        </section>
      )}

      <section className="px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] border border-chalk-muted/10 rounded-md min-h-[500px] overflow-hidden">
          <div className="flex flex-col min-h-[500px]">
            <RecordsTable records={records} loading={loading} />
          </div>

          <div className="lg:sticky lg:top-14 lg:self-start lg:max-h-[calc(100vh-3.5rem)] lg:border-l border-t lg:border-t-0 border-chalk-muted/10 min-h-[350px] lg:min-h-0 bg-void-light/20">
            <AuditTapePanel entries={audit} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
}
