import type { PaymentRecord, AuditEntry, DashboardSummary } from "../hooks/useDashboardData";

export const mockSummary: DashboardSummary = {
  total_at_risk: 119143,
  recovered: 55372,
  awaiting: 32847,
  manual_review: 18294,
  errors: 12630,
  recovery_rate: 48.3,
};

export const mockRecords: PaymentRecord[] = [
  {
    id: "txn_7k2m9x", subscription_id: "sub_rah_118", customer: "R. Mehta", plan: "Pro Annual",
    amount: 14999, failure_reason: "Insufficient funds", status: "recovered", last_action: "Smart retry (2/3)",
    timestamp: "2026-08-30T04:12:00Z",
    recovery_history: [
      { timestamp: "04:12:00", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "04:12:00", action: "diagnose", outcome: "insufficient_funds (confidence: 0.94)" },
      { timestamp: "04:12:01", action: "decide", outcome: "smart_retry (attempt 2/3, cooldown 4h)" },
      { timestamp: "08:12:00", action: "execute", outcome: "retry_succeeded — ₹14,999 settled" },
    ],
  },
  {
    id: "txn_3p8v1q", subscription_id: "sub_avi_224", customer: "A. Sharma", plan: "Team Monthly",
    amount: 3249, failure_reason: "Card expired", status: "awaiting", last_action: "Payment link sent",
    timestamp: "2026-08-30T03:48:00Z",
    recovery_history: [
      { timestamp: "03:48:12", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "03:48:12", action: "diagnose", outcome: "card_expired (confidence: 0.98)" },
      { timestamp: "03:48:12", action: "decide", outcome: "payment_link (retry not viable)" },
      { timestamp: "03:48:12", action: "execute", outcome: "link_sent via email+SMS (expires 48h)" },
    ],
  },
  {
    id: "txn_9w4n6j", subscription_id: "sub_npr_087", customer: "N. Patel", plan: "Enterprise",
    amount: 49999, failure_reason: "Bank decline — risk", status: "manual-review", last_action: "Escalated to finance",
    timestamp: "2026-08-30T02:15:00Z",
    recovery_history: [
      { timestamp: "02:15:44", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "02:15:44", action: "diagnose", outcome: "bank_decline_risk (confidence: 0.71, flag: fraud)" },
      { timestamp: "02:15:44", action: "decide", outcome: "escalate_human (confidence < 0.80)" },
      { timestamp: "02:15:45", action: "execute", outcome: "ticket #FIN-2847 created, assigned @ops" },
    ],
  },
  {
    id: "txn_1d5f3h", subscription_id: "sub_san_331", customer: "S. Nair", plan: "Pro Monthly",
    amount: 2499, failure_reason: "Network timeout", status: "recovered", last_action: "Smart retry (1/3)",
    timestamp: "2026-08-30T01:30:00Z",
    recovery_history: [
      { timestamp: "01:30:02", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "01:30:02", action: "diagnose", outcome: "network_timeout (confidence: 0.89)" },
      { timestamp: "01:30:02", action: "decide", outcome: "smart_retry (attempt 1/3, cooldown 1h)" },
      { timestamp: "02:30:00", action: "execute", outcome: "retry_succeeded — ₹2,499 settled" },
    ],
  },
  {
    id: "txn_6b0t8y", subscription_id: "sub_vkr_195", customer: "V. Kumar", plan: "Starter Annual",
    amount: 1174, failure_reason: "Card blocked", status: "manual-review", last_action: "Customer notified",
    timestamp: "2026-08-29T22:05:00Z",
    recovery_history: [
      { timestamp: "22:05:31", action: "detect", outcome: "payment_failed (card_on_blocklist)" },
      { timestamp: "22:05:31", action: "diagnose", outcome: "card_blocked (confidence: 0.99, bank: HDFC)" },
      { timestamp: "22:05:31", action: "decide", outcome: "escalate_human (blocked_card — no auto path)" },
      { timestamp: "22:05:32", action: "execute", outcome: "email sent, ticket #FIN-2843, SLA 24h" },
    ],
  },
  {
    id: "txn_2m7c4p", subscription_id: "sub_dgr_412", customer: "D. Gupta", plan: "Pro Annual",
    amount: 14999, failure_reason: "Insufficient funds", status: "recovered", last_action: "Smart retry (3/3)",
    timestamp: "2026-08-29T19:42:00Z",
    recovery_history: [
      { timestamp: "19:42:10", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "19:42:10", action: "diagnose", outcome: "insufficient_funds (confidence: 0.91)" },
      { timestamp: "19:42:11", action: "decide", outcome: "smart_retry (attempt 3/3, cooldown 8h)" },
      { timestamp: "03:42:00", action: "execute", outcome: "retry_succeeded — ₹14,999 settled" },
    ],
  },
  {
    id: "txn_8k3w5r", subscription_id: "sub_psin_503", customer: "P. Singhania", plan: "Team Annual",
    amount: 8749, failure_reason: "Do not honour", status: "awaiting", last_action: "Payment link sent",
    timestamp: "2026-08-29T17:11:00Z",
    recovery_history: [
      { timestamp: "17:11:22", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "17:11:22", action: "diagnose", outcome: "do_not_honour (confidence: 0.82)" },
      { timestamp: "17:11:23", action: "decide", outcome: "payment_link (bank-side refusal)" },
      { timestamp: "17:11:23", action: "execute", outcome: "link_sent via email (expires 48h)" },
    ],
  },
  {
    id: "txn_5f9j2n", subscription_id: "sub_akd_617", customer: "A. K. Das", plan: "Pro Monthly",
    amount: 2499, failure_reason: "Network timeout", status: "recovered", last_action: "Smart retry (1/3)",
    timestamp: "2026-08-29T14:58:00Z",
    recovery_history: [
      { timestamp: "14:58:45", action: "detect", outcome: "payment_failed webhook received" },
      { timestamp: "14:58:45", action: "diagnose", outcome: "network_timeout (confidence: 0.92)" },
      { timestamp: "14:58:46", action: "decide", outcome: "smart_retry (attempt 1/3, cooldown 1h)" },
      { timestamp: "15:58:00", action: "execute", outcome: "retry_succeeded — ₹2,499 settled" },
    ],
  },
];

export const mockAudit: AuditEntry[] = [
  { timestamp: "04:12:00.341", level: "info", message: "[detect] Webhook: txn_7k2m9x — payment_failed" },
  { timestamp: "04:12:00.347", level: "info", message: "[diagnose] cause: insufficient_funds | confidence: 0.94" },
  { timestamp: "04:12:00.352", level: "info", message: "[decide] action: smart_retry | attempt: 2/3" },
  { timestamp: "04:12:00.358", level: "recovered", message: "[execute] retry_scheduled at 08:12 IST" },
  { timestamp: "03:48:12.011", level: "info", message: "[detect] Webhook: txn_3p8v1q — payment_failed" },
  { timestamp: "03:48:12.019", level: "info", message: "[diagnose] cause: card_expired | confidence: 0.98" },
  { timestamp: "03:48:12.024", level: "warn", message: "[decide] action: payment_link | card needs update" },
  { timestamp: "03:48:12.031", level: "info", message: "[execute] link_sent via email+SMS | expiry: 48h" },
  { timestamp: "02:15:44.890", level: "info", message: "[detect] Webhook: txn_9w4n6j — payment_failed" },
  { timestamp: "02:15:44.898", level: "warn", message: "[diagnose] cause: bank_decline_risk | confidence: 0.71" },
  { timestamp: "02:15:44.903", level: "error", message: "[decide] action: escalate_human | confidence < 0.80" },
  { timestamp: "02:15:44.910", level: "info", message: "[execute] ticket #FIN-2847 | assigned: @ops" },
  { timestamp: "01:30:02.115", level: "info", message: "[detect] Webhook: txn_1d5f3h — payment_failed" },
  { timestamp: "01:30:02.121", level: "info", message: "[diagnose] cause: network_timeout | confidence: 0.89" },
  { timestamp: "01:30:02.126", level: "info", message: "[decide] action: smart_retry | attempt: 1/3" },
  { timestamp: "01:30:02.133", level: "recovered", message: "[execute] retry_succeeded | ₹2,499 settled" },
  { timestamp: "22:05:31.442", level: "error", message: "[detect] Webhook: txn_6b0t8y | alert: blocklist" },
  { timestamp: "22:05:31.450", level: "warn", message: "[diagnose] cause: card_blocked | bank: HDFC" },
  { timestamp: "22:05:31.456", level: "error", message: "[decide] action: escalate_human | blocked_card" },
  { timestamp: "22:05:31.463", level: "info", message: "[execute] customer notified | ticket #FIN-2843" },
];
