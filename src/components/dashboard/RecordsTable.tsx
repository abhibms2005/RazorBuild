import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PaymentRecord } from "../../hooks/useDashboardData";
import { StatusBadge } from "./StatusBadge";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const filters = [
  { key: "all", label: "All Records" },
  { key: "recovered", label: "Recovered" },
  { key: "awaiting", label: "Awaiting Link" },
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
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.3) }}
        className={`group border-b border-chalk-muted/8 transition-colors cursor-pointer ${
          expanded ? "bg-void-light/80" : "hover:bg-void-light/50"
        }`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${record.customer}, ${formatINR(record.amount)}, ${record.status}`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-chalk group-hover:text-ember transition-colors">
              {record.customer}
            </span>
            <span className="font-mono text-[9.5px] text-chalk-muted/50 bg-void-soft/60 px-1.5 py-0.5 rounded">
              {record.id}
            </span>
          </div>
          <span className="font-mono text-[10px] text-chalk-muted/70">{record.subscription_id}</span>
        </td>

        <td className="px-4 py-3 text-xs text-chalk-dim">
          {record.plan}
        </td>

        <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-chalk tabular-nums">
          {formatINR(record.amount)}
        </td>

        <td className="px-4 py-3 text-xs text-chalk-dim">
          {record.failure_reason}
        </td>

        <td className="px-4 py-3 font-mono text-[11px] text-chalk-muted">
          {record.last_action}
        </td>

        <td className="px-4 py-3">
          <StatusBadge status={record.status} />
        </td>
      </motion.tr>

      {/* Expandable History Drawer */}
      <AnimatePresence>
        {expanded && (
          <tr className="bg-void-soft/40 border-b border-chalk-muted/10">
            <td colSpan={6} className="px-5 py-4">
              <div className="flex items-center justify-between border-b border-chalk-muted/10 pb-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ember font-semibold">
                  Deterministic Recovery Audit Trail
                </span>
                <span className="font-mono text-[10px] text-chalk-muted/60">
                  {record.recovery_history?.length ?? 0} lifecycle events
                </span>
              </div>

              <div className="space-y-1.5 pl-1">
                {(record.recovery_history || []).map((step, i) => (
                  <div key={i} className="flex items-start gap-3 font-mono text-[11px] leading-relaxed">
                    <span className="text-chalk-muted/50 w-20 flex-shrink-0 tabular-nums">
                      {step.timestamp}
                    </span>
                    <span className="text-ember font-medium w-20 flex-shrink-0 uppercase text-[10px]">
                      [{step.action}]
                    </span>
                    <span className="text-chalk-dim flex-1">
                      {step.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </AnimatePresence>
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

  const safeRecords = Array.isArray(records) ? records : [];

  const filtered = useMemo(() => {
    let result = safeRecords;
    if (activeFilter !== "all") {
      result = result.filter((r) => r.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.customer || "").toLowerCase().includes(q) ||
          (r.id || "").toLowerCase().includes(q) ||
          (r.plan || "").toLowerCase().includes(q) ||
          (r.subscription_id || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [safeRecords, activeFilter, search]);

  return (
    <div className="flex flex-col min-h-0 bg-void">
      {/* Toolbar: filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-chalk-muted/10 bg-void-light/30">
        {/* Segmented Control */}
        <div className="flex gap-1 bg-void-light rounded-lg p-1 border border-chalk-muted/10" role="radiogroup" aria-label="Filter records">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 text-[11px] font-mono rounded transition-all ${
                activeFilter === f.key
                  ? "bg-void-soft text-chalk font-semibold shadow-sm"
                  : "text-chalk-muted hover:text-chalk-dim"
              }`}
              role="radio"
              aria-checked={activeFilter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chalk-muted/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="bg-void-light border border-chalk-muted/12 rounded-md pl-8 pr-3 py-1.5 text-xs text-chalk placeholder:text-chalk-muted/40 focus:outline-none focus:border-chalk-muted/40 w-48 sm:w-56"
            aria-label="Search records by customer, ID or plan"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-chalk-muted/10 bg-void-light/50">
              {["Customer / ID", "Plan", "Amount", "Failure Reason", "Last Policy Action", "Status"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-wider text-chalk-muted/60 ${
                    h === "Amount" ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Shimmer Skeleton Rows
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-chalk-muted/5 animate-pulse">
                  <td className="px-4 py-3.5"><div className="h-3 bg-void-soft rounded w-28" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 bg-void-soft rounded w-20" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 bg-void-soft rounded w-16 ml-auto" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 bg-void-soft rounded w-24" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 bg-void-soft rounded w-28" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 bg-void-soft rounded-full w-16" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <p className="font-mono text-xs text-chalk-muted/60">No records found matching current criteria</p>
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

      {/* Row counter footer */}
      <div className="px-4 py-2.5 border-t border-chalk-muted/10 bg-void-light/20 flex items-center justify-between text-[10px] font-mono text-chalk-muted/50">
        <span>Showing {filtered.length} of {records.length} records</span>
        <span>Click any row to view lifecycle log</span>
      </div>
    </div>
  );
}
