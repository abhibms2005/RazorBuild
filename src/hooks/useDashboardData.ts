import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export interface RecoveryStep {
  timestamp: string;
  action: string;
  outcome: string;
}

export interface PaymentRecord {
  id: string;
  subscription_id: string;
  customer: string;
  plan: string;
  amount: number;
  failure_reason: string;
  status: "recovered" | "awaiting" | "manual-review" | "error";
  last_action: string;
  timestamp: string;
  recovery_history: RecoveryStep[];
}

export interface AuditEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "recovered";
  message: string;
}

export interface DashboardSummary {
  total_at_risk: number;
  recovered: number;
  awaiting: number;
  manual_review: number;
  errors: number;
  recovery_rate: number;
}

export type SummaryKey = keyof Omit<DashboardSummary, "recovery_rate">;

export interface UseDashboardDataResult {
  summary: DashboardSummary | null;
  prevSummary: DashboardSummary | null;
  records: PaymentRecord[];
  audit: AuditEntry[];
  loading: boolean;
  error: string | null;
  running: boolean;
  successFlash: boolean;
  runBatch: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Map API/DB status strings to the frontend's display statuses.
 */
function mapStatus(s: string): PaymentRecord["status"] {
  switch (s) {
    case "recovered": return "recovered";
    case "pending": return "awaiting";
    case "partial": return "manual-review";
    case "error": case "failed": return "error";
    default: return "awaiting";
  }
}

/**
 * Dashboard data hook — isolated, testable, swappable.
 * Tracks previous summary for animated count-up on batch run.
 * Handles loading, error, and success-flash states.
 */
export function useDashboardData(): UseDashboardDataResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const prevSummaryRef = useRef<DashboardSummary | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [sumRes, recRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/api/summary`),
        fetch(`${API_BASE}/api/records`),
        fetch(`${API_BASE}/api/audit`),
      ]);

      let loadedRecords: PaymentRecord[] = [];
      if (recRes.ok) {
        const json = await recRes.json();
        const rawRecords = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        loadedRecords = rawRecords.map((r: Record<string, unknown>) => ({
          id: String(r?.id ?? ""),
          subscription_id: String(r?.subscription_id ?? "—"),
          customer: String(r?.customer_name ?? r?.customer ?? "Unknown Customer"),
          plan: String(r?.plan ?? "Standard Plan"),
          amount: typeof r?.amount === "number" ? r.amount : 0,
          failure_reason: String(r?.failure_reason ?? r?.failure_code ?? "Payment failure"),
          status: mapStatus(String(r?.status ?? "")),
          last_action: String(r?.recovery_action ?? r?.last_action ?? "Automated retry"),
          timestamp: String(r?.created_at ?? r?.timestamp ?? new Date().toISOString()),
          recovery_history: Array.isArray(r?.recovery_history)
            ? r.recovery_history.map((h: Record<string, unknown>) => ({
                timestamp: typeof h?.ts === "string" ? h.ts.split("T")[1]?.split(".")[0] ?? h.ts : String(h?.timestamp ?? "--:--:--"),
                action: String(h?.action ?? "action"),
                outcome: String(h?.outcome ?? "—"),
              }))
            : [],
        }));
        setRecords(loadedRecords);
      }

      if (sumRes.ok) {
        const json = await sumRes.json();
        const raw = json?.summary ?? json;
        
        // Calculate amount-based breakdown from records if available
        const totalAmount = loadedRecords.length > 0
          ? loadedRecords.reduce((acc, r) => acc + (r.amount || 0), 0)
          : (typeof raw?.totalAmount === "number" ? raw.totalAmount : 0);
        
        const recoveredAmount = loadedRecords.length > 0
          ? loadedRecords.filter(r => r.status === "recovered").reduce((acc, r) => acc + (r.amount || 0), 0)
          : (raw?.byStatus?.recovered ?? 0);
        
        const awaitingAmount = loadedRecords.length > 0
          ? loadedRecords.filter(r => r.status === "awaiting").reduce((acc, r) => acc + (r.amount || 0), 0)
          : (raw?.byStatus?.pending ?? 0);
        
        const reviewAmount = loadedRecords.length > 0
          ? loadedRecords.filter(r => r.status === "manual-review").reduce((acc, r) => acc + (r.amount || 0), 0)
          : (raw?.byStatus?.partial ?? 0);
        
        const errorAmount = loadedRecords.length > 0
          ? loadedRecords.filter(r => r.status === "error").reduce((acc, r) => acc + (r.amount || 0), 0)
          : (raw?.errors ?? 0);
        
        const recoveryRate = totalAmount > 0 ? (recoveredAmount / totalAmount) * 100 : (raw?.averageRecoveryRate ?? 0);

        const newSummary: DashboardSummary = {
          total_at_risk: totalAmount,
          recovered: recoveredAmount,
          awaiting: awaitingAmount,
          manual_review: reviewAmount,
          errors: errorAmount,
          recovery_rate: Math.round(recoveryRate * 10) / 10,
        };
        prevSummaryRef.current = summary;
        setSummary(newSummary);
      }

      if (auditRes.ok) {
        const json = await auditRes.json();
        const rawAudit = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        const mappedAudit: AuditEntry[] = rawAudit.map((a: Record<string, unknown>) => {
          let timestamp = "--:--:--";
          if (typeof a?.timestamp === "string") {
            timestamp = a.timestamp;
          } else if (typeof a?.ts === "string") {
            const timePart = a.ts.split("T")[1];
            timestamp = timePart ? timePart.replace("Z", "").slice(0, 8) : a.ts;
          }

          let message = "";
          if (typeof a?.message === "string" && a.message) {
            message = a.message;
          } else {
            const parts: string[] = [];
            if (a?.stage) parts.push(`[${a.stage}]`);
            if (a?.action) parts.push(String(a.action));
            if (a?.cause) parts.push(`cause: ${a.cause}`);
            if (a?.explanation) parts.push(String(a.explanation));
            if (a?.reason) parts.push(`reason: ${a.reason}`);
            if (a?.result) parts.push(`result: ${a.result}`);
            if (a?.payment_id) parts.push(`(${a.payment_id})`);
            if (a?.error) parts.push(`error: ${a.error}`);

            message = parts.length > 0 ? parts.join(" ") : "Audit entry recorded";
          }

          let level: AuditEntry["level"] = "info";
          if (a?.level === "warn" || a?.level === "error" || a?.level === "recovered" || a?.level === "info") {
            level = a.level;
          } else if (a?.error || message.toLowerCase().includes("error") || message.toLowerCase().includes("malformed") || message.toLowerCase().includes("fail")) {
            level = "error";
          } else if (message.toLowerCase().includes("recovered") || message.toLowerCase().includes("settled") || message.toLowerCase().includes("succeeded")) {
            level = "recovered";
          }

          return {
            timestamp,
            level,
            message,
          };
        });
        setAudit(mappedAudit);
      }
    } catch {
      const { mockSummary, mockRecords, mockAudit } = await import("../data/mockDashboard");
      prevSummaryRef.current = summary;
      setSummary(mockSummary);
      setRecords(mockRecords);
      setAudit(mockAudit);
    } finally {
      setLoading(false);
    }
  }, [summary]);

  const runBatch = useCallback(async () => {
    setRunning(true);
    setSuccessFlash(false);
    try {
      const res = await fetch(`${API_BASE}/api/run-batch`, { method: "POST" });
      if (res.ok || !API_BASE) {
        // In demo mode, simulate with mock data
        await new Promise((r) => setTimeout(r, 1200));
        await fetchData();
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 1500);
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1200));
      await fetchData();
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 1500);
    } finally {
      setRunning(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summary,
    prevSummary: prevSummaryRef.current,
    records,
    audit,
    loading,
    error,
    running,
    successFlash,
    runBatch,
    retry: fetchData,
  };
}
