# Razorpay AI Revenue Recovery Ledger (Track 03 — AI Revenue Recovery)

> **An autonomous, policy-governed revenue recovery agent for subscription payments with calibrated AI failure diagnosis, deterministic safety rails, real SMTP intervention dispatch, and cryptographic webhook verification.**

---

## 1. Problem Statement

In subscription and recurring SaaS billing, **up to 9% of monthly recurring revenue (MRR) is lost to involuntary churn** caused by failed recurring payment debits (insufficient funds, expired cards, 3DS authentication timeouts, temporary acquirer network timeouts, velocity limits, and bank risk declines).

Traditional recovery approaches suffer from two failure modes:
1. **Blind brute-force retries**: Repeating payment attempts without backoff causes issuer penalty fees, velocity blocks, and customer frustration.
2. **Ungoverned AI decision-making**: Relying on unconstrained LLMs to trigger monetary transactions risks hallucinated recovery decisions, double debits, or security violations.

---

## 2. The Solution: Governed 7-Stage Recovery Architecture

The **Revenue Recovery Ledger** implements a strict **governed autonomy model**:
- **Deterministic Rules & Fast Path**: Instant classification for known gateway error codes (`CAUSE_MAP`).
- **Contextual AI Advisor (LLM)**: Invoked *only* for ambiguous failure codes or low-confidence events (`confidence < 0.80`) to propose actions with business explanations.
- **Deterministic Policy Rails**: Hardcoded safety rules (`MAX_ATTEMPTS = 3`, `MIN_CONFIDENCE_TO_ACT = 0.80`, risk halt) that **cannot be overridden by the LLM**.
- **Real Intervention Dispatch**: Sends real customer recovery emails via Nodemailer with Ethereal SMTP test inboxes and public preview URLs.
- **Atomic State Machine**: Status transitions through `pending → attempted → executed / pending_confirmation → confirmed_recovered`. **No code path can jump directly to `recovered` without a separate verified confirmation event.**
- **Cryptographic Webhooks**: HMAC-SHA256 signature verification and persistent database-backed idempotency (`processed_events` table).

---

## 3. The 7-Stage Pipeline

```
Payment Failure Event
  │
  ▼
[1. Detect & Validate]      ─── Schema normalization & malformed record rejection
  │
  ▼
[2. Deterministic Diagnose] ─── CAUSE_MAP matching (Confidence >= 0.80)
  │
  ├── (If confidence < 0.80 or unclassified code)
  ▼
[3. AI Advisor Consult]     ─── LLM analysis (Gemini / OpenAI API / contextual heuristic)
  │
  ▼
[4. Strategy Recommend]     ─── Action proposed (LLM proposes, NEVER decides)
  │
  ▼
[5. Policy Engine Check]    ─── Deterministic safety rails (ALLOWED / BLOCKED: <reason>)
  │
  ▼
[6. Real Execution]         ─── Ethereal SMTP email dispatch / Gateway retry queue
  │                         ─── Sets status: "pending_confirmation"
  ▼
[7. Outcome Confirmation]   ─── HMAC-signed webhook event (recovery.confirmed)
  │                         ─── ONLY event that sets status: "recovered"
  ▼
[Durable Audit Stream]      ─── Immutable log entry at EVERY stage
```

---

## 4. AI Advisor vs. Deterministic Policy Engine

| Capability | AI Advisor (`aiAdvisor.js`) | Policy Engine (`policyEngine.js`) |
|---|---|---|
| **Role** | Contextual analysis & strategy recommendation | Invariant enforcement & safety boundaries |
| **When Invoked** | Only when confidence < 0.80 or unknown failure | Every single transaction action |
| **Can Modify Status?** | ❌ **No** (Never writes to status) | ❌ **No** (Only ALLOWS or BLOCKS actions) |
| **Can Override Max Attempts?** | ❌ **No** | ✅ **Enforces hard limit (3 attempts)** |
| **Can Override Confidence?** | ❌ **No** | ✅ **Enforces hard cutoff (0.80)** |
| **Output** | `{ recommended_action, confidence, business_explanation }` | `{ decision: 'ALLOWED' \| 'BLOCKED', action, reason }` |

---

## 5. Recovery Playbooks & State Machine

### Playbook Actions
1. `schedule_smart_retry`: Progressive backoff window (1h → 4h → 8h) for transient balance/timing issues.
2. `immediate_retry`: Secondary acquirer routing for first-attempt network or gateway timeouts.
3. `send_update_payment_link`: Real email dispatch with localized 48h update link for expired cards or 3DS failures.
4. `escalate_alternate_method`: Automated request for UPI / NetBanking when a card is blocked.
5. `manual_review`: Human finance ops queue for risk declines, fraud flags, or exhausted retries.

### State Transitions
```
[pending] 
   └── (Stage 6 Execution) ────────► [pending_confirmation] / [partial]
                                             │
                                             ▼ (Stage 7 Verified Webhook)
                                     [confirmed_recovered] / [partial]
```

---

## 6. Real Intervention Execution (Ethereal SMTP)

Payment link dispatches are **not fake strings in logs** — they execute through a real SMTP transport:
- Auto-provisions an Ethereal SMTP test account with zero paid credentials.
- Dispatches a full HTML payment recovery email.
- Generates a publicly accessible preview URL (e.g., `https://ethereal.email/message/...`) recorded in `recovery_history` and `audit_log`.

---

## 7. Webhook Security & Persistent Idempotency

All payment lifecycle events and confirmations entering `/webhooks/payment` are verified:
1. **HMAC-SHA256 Signature**: Validates `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using constant-time comparison (`crypto.timingSafeEqual`).
2. **Persistent Idempotency**: Queries and inserts into Supabase `processed_events` table with unique constraint on `event_id`. Replay attempts return HTTP 200 `{ status: 'ignored' }`.

---

## 8. Data Model & Database Schema

### `payments` Table
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Transaction identifier (e.g. `pay_17881...`) |
| `subscription_id` | `TEXT` | Recurring mandate reference |
| `customer_name` | `TEXT` | Customer full name |
| `customer_email` | `TEXT` | Customer email for interventions |
| `customer_phone` | `TEXT` | Customer mobile number |
| `amount` | `NUMERIC` | Transaction amount in INR |
| `currency` | `TEXT` | Currency code (`INR`) |
| `failure_code` | `TEXT` | Bank / Acquirer decline code |
| `failure_reason` | `TEXT` | Human-readable decline message |
| `attempt_number` | `INTEGER` | Current retry count (1 to 3) |
| `status` | `TEXT` | `pending`, `pending_confirmation`, `partial`, `recovered` |
| `diagnosis` | `TEXT` | Root cause classification |
| `diagnosis_confidence` | `NUMERIC` | Confidence score (0.00 to 1.00) |
| `recovery_action` | `TEXT` | Last policy action dispatched |

### `recovery_history` Table
| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | History event ID |
| `payment_id` | `TEXT REFERENCES payments(id)` | Foreign key to payment |
| `action` | `TEXT` | Lifecycle stage action |
| `outcome` | `TEXT` | Detailed outcome / Ethereal preview URL |
| `ts` | `TIMESTAMPTZ` | Timestamp |

### `audit_log` Table
| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Audit entry ID |
| `payment_id` | `TEXT` | Associated payment ID |
| `stage` | `TEXT` | `detect`, `diagnose`, `ai_consult`, `recommend`, `policy_check`, `execute`, `confirm` |
| `action` | `TEXT` | Specific action name |
| `cause` | `TEXT` | Root cause |
| `confidence` | `NUMERIC` | Decision confidence |
| `explanation` | `TEXT` | Complete business explanation |
| `reason` | `TEXT` | Policy or technical reason |
| `amount` | `NUMERIC` | Amount at risk |
| `ts` | `TIMESTAMPTZ` | Timestamp |

### `processed_events` Table (Idempotency)
| Column | Type | Description |
|---|---|---|
| `event_id` | `TEXT PRIMARY KEY` | Unique webhook event ID |
| `event_type` | `TEXT` | Webhook event type |
| `processed_at` | `TIMESTAMPTZ` | Timestamp |

---

## 9. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/health-db` | Database connection check |
| `GET` | `/api/summary` | Dynamic recovery metrics & cohort counts |
| `GET` | `/api/records` | All payment records with recovery history |
| `GET` | `/api/audit` | Complete chronological audit trail |
| `POST` | `/api/run-batch` | Trigger full 7-stage recovery batch |
| `POST` | `/webhooks/payment` | HMAC-verified payment confirmation webhook |

---

## 10. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173

# Supabase (Service role key for server-side persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhook Security
RAZORPAY_WEBHOOK_SECRET=dev_webhook_secret_key_2026

# Optional: Live LLM Advisor (falls back to deterministic contextual advisor if absent)
GEMINI_API_KEY=your_gemini_api_key_here
# or OPENAI_API_KEY=your_openai_api_key_here
```

---

## 11. Local Setup & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed 100+ Synthetic Records (15–20% Ambiguous for AI Advisor)
```bash
npm run seed
# Or with custom record count:
node src/scripts/generateSyntheticData.js --count=100
```

### 3. Start Local Server
```bash
npm run server
```

### 4. Run Governed Recovery Batch
```bash
npm run run-batch
```

### 5. Start Frontend Development Server
```bash
npm run dev
```

---

## 12. Verification & Testing Commands

### A. Webhook Signature Security Test
```bash
# 1. Invalid signature -> HTTP 401 Unauthorized
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: invalid_sig" \
  -d '{"event":"recovery.confirmed","data":{"id":"pay_test_1"}}'
```

### B. Webhook Idempotency Replay Test
```bash
# Generate valid HMAC signature and send same event_id twice -> 2nd request returns { status: 'ignored' }
```

### C. Real Email Verification
Run `npm run run-batch` and inspect the audit trail logs for lines containing:
`Real email dispatched via Ethereal SMTP [Preview: https://ethereal.email/message/...]`
Click the preview URL to inspect the rendered recovery email.

---

## 13. Transparency & Disclosures

- **Data Source**: Synthetic Sandbox Data generated with calibrated Indian banking failure codes.
- **AI Advisor**: Evaluates ambiguous failure codes; strictly isolated from state modification.
- **Gateway Responses**: Automated confirmation webhooks generated via `simulatedGateway.js` with cause-weighted probabilities (60% insufficient funds, 80% bank timeout, 0% blocked cards) to test the real webhook signature and idempotency pipeline.
- **Interventions**: Real emails sent to Ethereal SMTP virtual inboxes.

---

## 14. Known Limitations & Roadmap

1. **WhatsApp & SMS Channels**: Currently simulated via metadata links; SMS gateway integration (Twilio / Gupshup) planned for production deployment.
2. **Production Razorpay Gateway**: Uses HMAC-signed simulated gateway in sandbox mode until production merchant keys with recurring mandate permissions are mounted.
3. **ML Risk Scoring**: Currently uses rule-calibrated confidence scores and LLM semantic reasoning; XGBoost/TensorFlow model training on historical cohort settlements planned for Phase 3.
