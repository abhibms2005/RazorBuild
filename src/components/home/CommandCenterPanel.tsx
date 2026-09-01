import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { CountUp } from "./CountUp";
import { mockSummary, mockAudit } from "../../data/mockDashboard";

const API_BASE = import.meta.env.VITE_API_BASE || "";

interface MetricData {
  label: string;
  amount: number;
  percent: number;
  tone: "mint" | "blue" | "amber" | "red";
}

const toneStyles = {
  mint: {
    bar: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
    text: "text-emerald-300",
    badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  },
  blue: {
    bar: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]",
    text: "text-sky-300",
    badge: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  },
  amber: {
    bar: "bg-ember shadow-[0_0_12px_rgba(212,168,67,0.35)]",
    text: "text-ember",
    badge: "bg-ember/10 text-ember border-ember/20",
  },
  red: {
    bar: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.35)]",
    text: "text-red-300",
    badge: "bg-red-400/10 text-red-300 border-red-400/20",
  },
};

const initialAudit = mockAudit.slice(0, 5).map((entry) => ({
  time: entry.timestamp.substring(0, 8),
  event: entry.message,
  level: entry.level,
}));

export function CommandCenterPanel() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([
    { label: "Recovered", amount: mockSummary.recovered, percent: 74, tone: "mint" },
    { label: "Awaiting payment", amount: mockSummary.awaiting, percent: 42, tone: "blue" },
    { label: "Manual review", amount: mockSummary.manual_review, percent: 26, tone: "amber" },
    { label: "Handled errors", amount: mockSummary.errors, percent: 18, tone: "red" },
  ]);
  const [auditLines, setAuditLines] = useState(initialAudit);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Live data fetch
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveSummary() {
      try {
        const [sumRes, audRes] = await Promise.all([
          fetch(`${API_BASE}/api/summary`),
          fetch(`${API_BASE}/api/audit`),
        ]);

        if (sumRes.ok && isMounted) {
          const data = await sumRes.json();
          const s = data.summary || data;
          if (s.recovered !== undefined || s.byStatus !== undefined) {
            const total = s.total_at_risk || mockSummary.total_at_risk;
            const rec = s.recovered || mockSummary.recovered;
            const awt = s.awaiting || mockSummary.awaiting;
            const man = s.manual_review || mockSummary.manual_review;
            const err = s.errors || mockSummary.errors;

            setMetrics([
              { label: "Recovered", amount: rec, percent: Math.min(100, Math.round((rec / total) * 100)) || 74, tone: "mint" },
              { label: "Awaiting payment", amount: awt, percent: Math.min(100, Math.round((awt / total) * 100)) || 42, tone: "blue" },
              { label: "Manual review", amount: man, percent: Math.min(100, Math.round((man / total) * 100)) || 26, tone: "amber" },
              { label: "Handled errors", amount: err, percent: Math.min(100, Math.round((err / total) * 100)) || 18, tone: "red" },
            ]);
          }
        }

        if (audRes.ok && isMounted) {
          const audData = await audRes.json();
          const items = Array.isArray(audData) ? audData : Array.isArray(audData?.data) ? audData.data : [];
          if (items.length > 0) {
            const formatted = items.slice(-5).map((entry: any) => {
              const rawTime = entry?.timestamp || entry?.ts || "";
              const time = typeof rawTime === "string" && rawTime.includes("T")
                ? rawTime.split("T")[1]?.substring(0, 8)
                : (typeof rawTime === "string" && rawTime ? rawTime : "12:05:00");
              const event = entry?.message || (entry?.action ? `[${entry.action}] ${entry.explanation || entry.result || entry.payment_id || "processed"}` : "Event logged");
              return {
                time,
                event,
                level: entry?.level || (entry?.error ? "error" : "info"),
              };
            });
            setAuditLines(formatted);
          }
        }
      } catch {
        // Gracefully keep current mock baseline
      }
    }

    fetchLiveSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3D tilt tracking with clamped rotation
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced || window.innerWidth < 1024) return;
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Max rotation 3.8 degrees
      const rotX = ((y - centerY) / centerY) * -3.8;
      const rotY = ((x - centerX) / centerX) * 3.8;

      setRotate({ x: rotX, y: rotY });
      setMousePos({ x, y, active: true });
    },
    [prefersReduced],
  );

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 });
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <div
      style={{ perspective: "1100px" }}
      className="relative will-change-transform"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: prefersReduced
            ? "none"
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: "transform 0.22s cubic-bezier(0.2, 0, 0, 1)",
        }}
        className={clsx(
          "relative overflow-hidden rounded-xl border border-chalk-muted/20 bg-void-light/85 p-0 backdrop-blur-2xl transition-shadow duration-500",
          "shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85),0_0_36px_rgba(212,168,67,0.06),inset_0_1px_0_rgba(232,228,218,0.12)]",
        )}
      >
        {/* Cursor-following Specular Sheen Glow */}
        {mousePos.active && !prefersReduced && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232,228,218,0.08), transparent 70%)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-chalk-muted/12 bg-void/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-chalk-muted">
              RECOVERY COMMAND CENTER
            </span>
            <span className="h-3 w-px bg-chalk-muted/20" />
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-chalk">
              Live batch run
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80 duration-1000" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
              STREAMING
            </span>
          </div>
        </div>

        {/* Panel Content: Progress Metrics & Audit Stream */}
        <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Progress Bars */}
          <div className="space-y-3">
            {metrics.map((metric, idx) => {
              const tone = toneStyles[metric.tone];
              return (
                <div
                  key={metric.label}
                  className="rounded-lg border border-chalk-muted/10 bg-void/50 p-3 transition-colors hover:border-chalk-muted/20"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-chalk-dim">
                      {metric.label}
                    </span>
                    <span className={clsx("font-mono text-sm font-semibold tabular-nums", tone.text)}>
                      <CountUp prefix="₹" end={metric.amount} duration={1200 + idx * 150} />
                    </span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-void-soft/80">
                    <motion.div
                      className={clsx("h-full rounded-full", tone.bar)}
                      initial={prefersReduced ? { width: `${metric.percent}%` } : { width: 0 }}
                      whileInView={{ width: `${metric.percent}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.1,
                        delay: 0.2 + idx * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Audit Stream */}
          <div className="flex flex-col justify-between rounded-lg border border-chalk-muted/12 bg-black/40 p-3.5 font-mono text-[11px]">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-chalk-muted/10 pb-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-chalk-muted">
                  Audit Stream
                </span>
                <span className="text-[10px] text-chalk-muted/60">
                  UTC+05:30
                </span>
              </div>

              <div className="space-y-2">
                {auditLines.map((line, index) => {
                  const isLatest = index === auditLines.length - 1;
                  return (
                    <motion.div
                      key={`${line.time}-${index}`}
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4 + index * 0.09,
                        ease: "easeOut",
                      }}
                      className={clsx(
                        "flex items-start gap-2 leading-tight",
                        isLatest ? "text-emerald-300" : "text-chalk/75",
                      )}
                    >
                      <span className="text-chalk-muted/50 select-none">{line.time}</span>
                      <span className="truncate font-mono">{line.event}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 border-t border-chalk-muted/10 pt-2 flex items-center justify-between text-[10px] text-chalk-muted/70">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Deterministic policy verified
              </span>
              <span>hash: 7k2m9x</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
