import { useEffect, useState } from "react";

/**
 * Bottom-right session timer with "elapsed" label.
 * Ticks smoothly, respects prefers-reduced-motion.
 */
export function SessionTimer() {
  const [elapsed, setElapsed] = useState(0);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;

    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [prefersReduced]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end select-none"
      aria-label={`Session runtime: ${mins}:${secs}`}
    >
      <span className="font-mono text-[var(--type-caption)] text-chalk-muted/50 tabular-nums">
        <span className="text-chalk-muted/25 mr-1" aria-hidden="true">⏱</span>
        {mins}:{secs}
      </span>
      <span className="font-mono text-[9px] text-chalk-muted/25 tracking-wider uppercase">
        elapsed
      </span>
    </div>
  );
}
