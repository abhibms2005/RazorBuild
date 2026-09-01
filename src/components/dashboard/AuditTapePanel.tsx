import { useEffect, useRef, useState } from "react";
import type { AuditEntry } from "../../hooks/useDashboardData";

const stageConfig: Record<string, { icon: string; borderColor: string; color: string; label: string }> = {
  detect:   { icon: "◉", borderColor: "border-l-chalk-muted/50", color: "text-chalk-dim", label: "detect" },
  diagnose: { icon: "◆", borderColor: "border-l-ember", color: "text-ember", label: "diagnose" },
  decide:   { icon: "→", borderColor: "border-l-sky-400", color: "text-sky-300", label: "decide" },
  execute:  { icon: "✓", borderColor: "border-l-emerald-400", color: "text-emerald-300", label: "execute" },
  recovered:{ icon: "★", borderColor: "border-l-emerald-400", color: "text-emerald-300", label: "recovered" },
  error:    { icon: "✗", borderColor: "border-l-red-400", color: "text-red-300", label: "error" },
};

function getStage(message: string, level?: string): string {
  if (level === "recovered") return "recovered";
  if (message.includes("[diagnose]")) return "diagnose";
  if (message.includes("[decide]")) return "decide";
  if (message.includes("[execute]")) return "execute";
  if (message.includes("[detect]")) return "detect";
  if (level === "error" || message.includes("error") || message.includes("blocklist")) return "error";
  return "detect";
}

function AuditLine({ entry, isNew }: { entry: AuditEntry; isNew?: boolean }) {
  const stage = getStage(entry.message, entry.level);
  const config = stageConfig[stage] || stageConfig.detect;

  return (
    <div
      className={`font-mono text-[10.5px] leading-relaxed flex items-start border-l-2 ${config.borderColor} pl-3 py-1 transition-all ${
        isNew ? "bg-emerald-400/5 animate-[fadeInSlide_0.3s_ease-out]" : "hover:bg-void-light/30"
      }`}
    >
      <span className="text-chalk-muted/50 w-16 flex-shrink-0 tabular-nums select-none text-[10px]">
        {entry.timestamp.split(".")[0]}
      </span>
      <span className={`w-4 flex-shrink-0 text-center font-bold select-none ${config.color}`} aria-hidden="true">
        {config.icon}
      </span>
      <span className="text-chalk-dim/90 flex-1 min-w-0 break-words">
        {entry.message}
      </span>
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
      const added = entries.length - prevLengthRef.current;
      setNewCount((c) => c + added);
      const el = scrollRef.current;
      if (el) {
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 80);
      }
    }
    prevLengthRef.current = entries.length;
  }, [entries.length]);

  return (
    <div className="flex flex-col h-full bg-void-light/20">
      {/* Header with live count & stream badge */}
      <div className="px-4 py-3 border-b border-chalk-muted/10 flex items-center justify-between bg-void-light/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-chalk-dim font-medium">
            Audit Stream Tape
          </p>
        </div>

        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded animate-pulse">
              +{newCount} new
            </span>
          )}
          <span className="font-mono text-[10px] text-chalk-muted/60 tabular-nums">
            {entries.length} entries
          </span>
        </div>
      </div>

      {/* Log area with paper texture and scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 relative max-h-[520px]"
        role="log"
        aria-label="Audit stream log"
        aria-live="polite"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2 py-2 animate-pulse">
              <div className="h-2.5 bg-void-soft rounded w-14" />
              <div className="h-2.5 bg-void-soft rounded w-full" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-chalk-muted/40">
            Awaiting batch events…
          </div>
        ) : (
          entries.map((entry, i) => (
            <AuditLine
              key={`${entry.timestamp}-${i}`}
              entry={entry}
              isNew={i >= entries.length - newCount}
            />
          ))
        )}
      </div>

      {/* Perforated paper tape edge */}
      <div className="h-3.5 bg-void-light/40 overflow-hidden border-t border-chalk-muted/10" aria-hidden="true">
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
