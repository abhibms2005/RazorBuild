import { CountUp } from "./CountUp";

interface MetricItem {
  prefix?: string;
  end: number;
  decimals?: number;
  suffix?: string;
  staticValue?: string;
  label: string;
  tone?: string;
}

const metrics: MetricItem[] = [
  { prefix: "₹", end: 55372, label: "Recovered from one batch", tone: "text-emerald-300" },
  { end: 48.3, decimals: 1, suffix: "%", label: "Measured recovery rate", tone: "text-chalk" },
  { end: 58, label: "Failed records processed", tone: "text-sky-300" },
  { staticValue: "< 90s", end: 90, label: "Batch decision time", tone: "text-ember" },
];

export function MetricsRibbon() {
  return (
    <div className="mx-auto mt-10 grid max-w-7xl grid-cols-2 rounded-lg border border-chalk-muted/15 bg-void-light/60 backdrop-blur-xl md:grid-cols-4 divide-y divide-chalk-muted/10 md:divide-y-0 md:divide-x shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="group relative p-5 transition-colors duration-300 hover:bg-chalk/[0.02]"
        >
          <div className="flex items-baseline gap-1">
            {metric.staticValue ? (
              <span className={`font-mono text-2xl font-semibold sm:text-3xl lg:text-4xl ${metric.tone}`}>
                {metric.staticValue}
              </span>
            ) : (
              <CountUp
                prefix={metric.prefix}
                end={metric.end}
                decimals={metric.decimals}
                suffix={metric.suffix}
                className={`text-2xl font-semibold sm:text-3xl lg:text-4xl ${metric.tone}`}
              />
            )}
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-chalk-muted transition-colors group-hover:text-chalk-dim">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}
