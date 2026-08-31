import { motion } from "framer-motion";
import clsx from "clsx";

type Tone = "amber" | "mint" | "blue" | "red" | "chalk";

const barTone: Record<Tone, string> = {
  amber: "bg-ember",
  mint: "bg-emerald-400",
  blue: "bg-sky-400",
  red: "bg-red-400",
  chalk: "bg-chalk-muted",
};

const textTone: Record<Tone, string> = {
  amber: "text-ember",
  mint: "text-emerald-300",
  blue: "text-sky-300",
  red: "text-red-300",
  chalk: "text-chalk",
};

export function ProgressStat({
  label,
  value,
  percent,
  tone = "chalk",
  delay = 0,
  compact = false,
  highlight = false,
}: {
  label: string;
  value: string;
  percent: number;
  tone?: Tone;
  delay?: number;
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-md border border-chalk-muted/10 bg-void-light/70 transition-all duration-500",
        compact ? "p-3" : "p-4",
        highlight && "border-ember/40 shadow-[0_0_18px_rgba(212,168,67,0.14)]",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-chalk-dim">{label}</span>
        <span className={clsx("font-mono text-sm tabular-nums", textTone[tone])}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden bg-chalk-muted/10">
        <motion.div
          className={clsx("h-full", barTone[tone])}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
