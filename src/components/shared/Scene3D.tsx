import { Suspense, type LazyExoticComponent, type ComponentType } from "react";
import clsx from "clsx";
import { Card } from "./Card";

function usePrefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SceneFallback({
  variant = "pipeline",
}: {
  variant?: "pipeline" | "monument" | "orbit";
}) {
  return (
    <Card className="relative h-full min-h-[280px] overflow-hidden p-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_38%,rgba(212,168,67,0.22),transparent_28%),radial-gradient(circle_at_72%_50%,rgba(52,211,153,0.18),transparent_30%),linear-gradient(135deg,rgba(8,8,10,0.95),rgba(22,22,28,0.82))]" />
      {variant === "pipeline" && (
        <div className="absolute left-[10%] right-[10%] top-1/2 h-px bg-gradient-to-r from-ember via-sky-400 to-emerald-300">
          <span className="absolute -top-2 left-0 h-4 w-4 rounded-full border border-ember bg-void" />
          <span className="absolute -top-2 left-1/3 h-4 w-4 rounded-full border border-ember bg-void" />
          <span className="absolute -top-2 left-2/3 h-4 w-4 rounded-full border border-sky-400 bg-void" />
          <span className="absolute -top-2 right-0 h-4 w-4 rounded-full border border-emerald-300 bg-void" />
        </div>
      )}
      {variant === "monument" && (
        <div className="absolute inset-x-[12%] bottom-[22%] flex items-end justify-center gap-4">
          {[74, 42, 26, 18].map((height, index) => (
            <span
              key={height}
              className={clsx("w-12 rounded-t-md", ["bg-emerald-400", "bg-sky-400", "bg-ember", "bg-red-400"][index])}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
      {variant === "orbit" && (
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/40">
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-300" />
        </div>
      )}
    </Card>
  );
}

export function Scene3D({
  Scene,
  fallback,
  className,
}: {
  Scene: LazyExoticComponent<ComponentType>;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const fallbackNode = fallback ?? <SceneFallback />;

  return (
    <div className={clsx("relative min-h-[280px]", className)} aria-hidden="true">
      {reduced ? fallbackNode : (
        <Suspense fallback={fallbackNode}>
          <Scene />
        </Suspense>
      )}
    </div>
  );
}
