import clsx from "clsx";
import { Card } from "./Card";
import { Eyebrow } from "./Eyebrow";
import { ProgressStat } from "./ProgressStat";
import { StatusDot } from "./StatusDot";

export interface CommandMetric {
  label: string;
  value: string;
  percent: number;
  tone?: "amber" | "mint" | "blue" | "red" | "chalk";
  highlight?: boolean;
}

const defaultMetrics: CommandMetric[] = [
  { label: "Recovered", value: "₹55,372", percent: 74, tone: "mint" },
  { label: "Awaiting payment", value: "₹32,847", percent: 42, tone: "blue" },
  { label: "Manual review", value: "₹18,294", percent: 26, tone: "amber" },
  { label: "Handled errors", value: "₹12,630", percent: 18, tone: "red" },
];

const defaultAudit: Array<[string, string]> = [
  ["12:04:18", "webhook.received"],
  ["12:04:19", "cause.insufficient_funds"],
  ["12:04:21", "retry.window_4h"],
  ["12:04:24", "link.created"],
  ["12:05:02", "payment.recovered"],
];

export function RecoveryCommandCenter({
  title = "Live batch run",
  metrics = defaultMetrics,
  audit = defaultAudit,
  className,
  full = false,
  children,
}: {
  title?: string;
  metrics?: CommandMetric[];
  audit?: Array<[string, string]>;
  className?: string;
  full?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className={clsx("overflow-hidden p-0 backdrop-blur-xl shadow-2xl shadow-black/35", className)}>
      <div className="flex items-center justify-between border-b border-chalk-muted/10 px-4 py-3">
        <div>
          <Eyebrow tone="muted">Recovery command center</Eyebrow>
          <p className="mt-1 text-sm text-chalk">{title}</p>
        </div>
        <StatusDot tone="mint" />
      </div>

      {children ? (
        children
      ) : (
        <div className={clsx("grid gap-4 p-4", full ? "lg:grid-cols-[1fr_320px]" : "sm:grid-cols-[1fr_0.65fr]")}>
          <div className={clsx("grid gap-3", full && "sm:grid-cols-2")}>
            {metrics.map((metric, index) => (
              <ProgressStat
                key={metric.label}
                label={metric.label}
                value={metric.value}
                percent={metric.percent}
                tone={metric.tone}
                highlight={metric.highlight}
                delay={0.15 + index * 0.08}
                compact={!full}
              />
            ))}
          </div>

          <div className="rounded-md border border-chalk-muted/10 bg-black/25 p-3 font-mono text-[11px] leading-6 text-chalk-muted">
            <Eyebrow className="mb-3">Audit stream</Eyebrow>
            {audit.map(([time, event], index) => (
              <p key={`${time}-${event}`}>
                <span className={index === audit.length - 1 ? "text-emerald-300" : "text-chalk/70"}>
                  {time}
                </span>{" "}
                {event}
              </p>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
