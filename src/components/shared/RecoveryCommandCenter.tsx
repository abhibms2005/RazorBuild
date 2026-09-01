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
  { label: "Recovered", value: "₹0", percent: 0, tone: "mint" },
  { label: "Awaiting payment", value: "₹0", percent: 0, tone: "blue" },
  { label: "Manual review", value: "₹0", percent: 0, tone: "amber" },
  { label: "Handled errors", value: "₹0", percent: 0, tone: "red" },
];

export function RecoveryCommandCenter({
  title = "Live batch run",
  metrics = defaultMetrics,
  className,
  children,
}: {
  title?: string;
  metrics?: CommandMetric[];
  className?: string;
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
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric, index) => (
              <ProgressStat
                key={metric.label}
                label={metric.label}
                value={metric.value}
                percent={metric.percent}
                tone={metric.tone}
                highlight={metric.highlight}
                delay={0.15 + index * 0.08}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
