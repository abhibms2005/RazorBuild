import { useEffect, useRef, useState } from "react";
import type { AuditEntry } from "../../hooks/useDashboardData";

const stageConfig: Record<string, { icon: string; borderColor: string; label: string }> = {
  detect:   { icon: "◉", borderColor: "border-l-chalk-muted/40", label: "detect" },
  diagnose: { icon: "◆", borderColor: "border-l-ember/50", label: "diagnose" },
  decide:   { icon: "→", borderColor: "border-l-sky-500/40", label: "decide" },
  execute:  { icon: "✓", borderColor: "border-l-emerald-500/50", label: "execute" },
  error:    { icon: "✗", borderColor: "border-l-red-500/50", label: "error" },
};

function getStage(message: string): string {
  if (message.includes("[diagnose]")) return "diagnose";
  if (message.includes("[decide]")) return "decide";
  if (message.includes("[execute]")) return "execute";
  if (message.includes("[detect]")) return "detect";
  return "error";
}

function AuditLine({ entry, isNew }: { entry: AuditEntry; isNew?: boolean }) {
  const stage = getStage(entry.message);
  const config = stageConfig[stage] || stageConfig.detect;

  return (
    <div
      className={`font-mono text-[10px] leading-[1.75] flex border-l-2 ${config.borderColor} pl-3 ${
        isNew ? "animate-[fadeInSlide_0.3s_ease-out]" : ""
      }`}
    >
      <span className="text-chalk-muted/40 w-16 flex-shrink-0 tabular-nums">
        {entry.timestamp.split(".")[0]}
      </span>
      <span className="text-chalk-muted/30 w-3.5 flex-shrink-0 text-center" aria-hidden="true">
        {config.icon}
      </span>
      <span className="text-chalk-dim/80 flex-1 min-w-0">{entry.message}</span>
    </div>
  );
}

export function AuditTapePanel({
  entries,
  loading,
}: {
  entries: AuditEntry[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newCount, setNewCount] = useState(0);
  const prevLengthRef = useRef(entries.length);

  // Track new entries
  useEffect(() => {
    if (entries.length > prevLengthRef.current) {
      setNewCount((c) => c + (entries.length - prevLengthRef.current));
      // Auto-scroll to bottom
      const el = scrollRef.current;
      if (el) {
        setTimeout(() => { el.scrollTop = el.scrollHeight; }, 100);
      }
    }
    prevLengthRef.current = entries.length;
  }, [entries.length]);

  // Gentle auto-scroll when idle
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let frameId: number;
    let scrollPos = 0;
    let idle = false;
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdle = () => { idle = false; clearTimeout(idleTimer); idleTimer = setTimeout(() => { idle = true; }, 4000); };
    el.addEventListener("scroll", resetIdle);
    resetIdle();

    const tick = () => {
      if (idle && el.scrollHeight > el.clientHeight) {
        scrollPos += 0.3;
        if (scrollPos >= el.scrollHeight - el.clientHeight) scrollPos = 0;
        el.scrollTop = scrollPos;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(idleTimer);
      el.removeEventListener("scroll", resetIdle);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with live count */}
      <div className="px-4 py-2.5 border-b border-chalk-muted/10 flex items-center justify-between bg-void-light/50">
        <p className="font-mono text-[10px] uppercase tracking-wider text-chalk-muted/50">
          Audit trail
        </p>
        <p className="font-mono text-[9px] text-chalk-muted/40 tabular-nums">
          {entries.length} entries
          {newCount > 0 && (
            <span className="text-ember/60 ml-1">+{newCount} new</span>
          )}
        </p>
      </div>

      {/* Log area with paper texture */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 relative"
        role="log"
        aria-label="Audit trail log"
        aria-live="polite"
      >
        {/* Paper grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
          aria-hidden="true"
        />

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2 py-1.5">
              <div className="h-2.5 bg-void-soft rounded animate-pulse w-14" />
              <div className="h-2.5 bg-void-soft rounded animate-pulse w-full" />
            </div>
          ))
        ) : (
          entries.map((entry, i) => (
            <AuditLine key={i} entry={entry} />
          ))
        )}
      </div>

      {/* Perforated bottom edge */}
      <div className="h-3 bg-void-light/30 overflow-hidden" aria-hidden="true">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-void) 2.5px, transparent 2.5px)",
            backgroundSize: "12px 12px",
            backgroundPosition: "6px 0",
          }}
        />
      </div>
    </div>
  );
}
