import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) { setValue(target); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, prefersReduced]);

  return value;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

interface SummaryStatProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percent";
  accent?: boolean;
  highlight?: boolean;
}

export function SummaryStat({ label, value, format = "number", accent, highlight }: SummaryStatProps) {
  const animated = useCountUp(value);

  const display =
    format === "currency" ? formatINR(animated) :
    format === "percent" ? `${(animated / 10).toFixed(1)}%` :
    String(animated);

  return (
    <div className={`bg-void-light border border-chalk-muted/10 p-4 transition-all duration-500 ${
      highlight ? "border-ember/30 shadow-[0_0_12px_rgba(212,168,67,0.08)]" : ""
    }`}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-chalk-muted/50 mb-1">{label}</p>
      <p className={`font-mono text-[var(--type-h4)] tabular-nums leading-tight ${
        accent ? "text-ember" : "text-chalk"
      }`}>
        {display}
      </p>
    </div>
  );
}
