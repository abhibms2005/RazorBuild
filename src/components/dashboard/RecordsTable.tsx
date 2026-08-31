import { useState, useMemo } from "react";
import type { PaymentRecord } from "../../hooks/useDashboardData";
import { StatusBadge } from "./StatusBadge";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

const filters = [
  { key: "all", label: "All" },
  { key: "recovered", label: "Recovered" },
  { key: "awaiting", label: "Awaiting" },
  { key: "manual-review", label: "Review" },
  { key: "error", label: "Errors" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function RecordRow({
  record,
  index,
  expanded,
  onToggle,
}: {
  record: PaymentRecord;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-chalk-muted/5 hover:bg-void-light/40 transition-colors cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${record.customer}, ${formatINR(record.amount)}, ${record.status}`}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <td className="px-4 py-2.5">
          <span className="text-[var(--type-body)] text-chalk">{record.customer}</span>
          <br />
          <span className="font-mono text-[9px] text-chalk-muted/40">{record.id}</span>
        </td>
        <td className="px-4 py-2.5 text-[var(--type-body)] text-chalk-dim">{record.plan}</td>
        <td className="px-4 py-2.5 text-right font-mono text-[var(--type-body)] text-chalk tabular-nums">
          {formatINR(record.amount)}
        </td>
        <td className="px-4 py-2.5 text-[var(--type-body)] text-chalk-dim">{record.failure_reason}</td>
        <td className="px-4 py-2.5 font-mono text-[var(--type-caption)] text-chalk-dim">{record.last_action}</td>
        <td className="px-4 py-2.5"><StatusBadge status={record.status} /></td>
      </tr>
      {expanded && (
        <tr className="bg-void-light/30 border-b border-chalk-muted/5">
          <td colSpan={6} className="px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-chalk-muted/40 mb-2">Recovery history</p>
            <div className="space-y-1">
              {record.recovery_history.map((step, i) => (
                <div key={i} className="flex items-start gap-3 font-mono text-[10px] leading-relaxed">
                  <span className="text-chalk-muted/40 w-16 flex-shrink-0 tabular-nums">{step.timestamp}</span>
                  <span className="text-ember/70 w-16 flex-shrink-0">{step.action}</span>
                  <span className="text-chalk-dim/80">{step.outcome}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function RecordsTable({
  records,
  loading,
}: {
  records: PaymentRecord[];
  loading: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = records;
    if (activeFilter !== "all") {
      result = result.filter((r) => r.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.plan.toLowerCase().includes(q),
      );
    }
    return result;
  }, [records, activeFilter, search]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Toolbar: filters + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-chalk-muted/10">
        {/* Filter segmented control */}
        <div className="flex gap-0.5 bg-void-light rounded-md p-0.5" role="radiogroup" aria-label="Filter records by status">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 text-[10px] font-mono rounded transition-all ${
                activeFilter === f.key
                  ? "bg-void-soft text-chalk"
                  : "text-chalk-muted hover:text-chalk-dim"
              }`}
              role="radio"
              aria-checked={activeFilter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-chalk-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-void-light border border-chalk-muted/10 rounded pl-7 pr-3 py-1.5 text-[var(--type-caption)] text-chalk placeholder:text-chalk-muted/30 focus:outline-none focus:border-chalk-muted/30 w-44"
            aria-label="Search records by customer or ID"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-chalk-muted/10">
              {["Customer", "Plan", "Amount", "Failure", "Action", "Status"].map((h) => (
                <th key={h} className={`px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-chalk-muted/50 ${h === "Amount" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-chalk-muted/5">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-void-soft rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="font-mono text-[var(--type-caption)] text-chalk-muted/50">No records in this category yet</p>
                </td>
              </tr>
            ) : (
              filtered.map((record, i) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  index={i}
                  expanded={expandedId === record.id}
                  onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div className="px-4 py-2 border-t border-chalk-muted/10">
        <p className="font-mono text-[9px] text-chalk-muted/40 tabular-nums">
          {filtered.length} of {records.length} records
        </p>
      </div>
    </div>
  );
}
