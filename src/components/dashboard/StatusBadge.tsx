const styles: Record<string, string> = {
  recovered: "bg-emerald-900/30 text-emerald-400/80 border-emerald-700/20",
  awaiting: "bg-amber-900/25 text-amber-400/70 border-amber-700/20",
  "manual-review": "bg-violet-900/25 text-violet-400/70 border-violet-700/20",
  error: "bg-red-900/20 text-red-400/60 border-red-700/15",
};

const labels: Record<string, string> = {
  recovered: "Recovered",
  awaiting: "Awaiting",
  "manual-review": "Review",
  error: "Error",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border ${styles[status] || styles["manual-review"]}`}
      role="status"
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-60" aria-hidden="true" />
      {labels[status] || status}
    </span>
  );
}
