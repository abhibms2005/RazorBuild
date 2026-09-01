import { lazy, Suspense, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Eyebrow, SceneFallback } from "../components/shared";

const PipelineScene = lazy(() => import("../components/three/PipelineScene"));

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const onChange = () => setReduced(q.matches);
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const stages = [
  {
    step: "01",
    title: "Detect",
    body: "The ledger listens for payment_failed events, normalizes the payload, and attaches subscription context before the record enters recovery.",
    code: `{
  "event": "payment_failed",
  "txn_id": "txn_7k2m9x",
  "subscription_id": "sub_rah_118",
  "amount": 14999,
  "gateway": "razorpay.recurring"
}`,
    tone: "text-ember",
    glow: "border-ember/30 shadow-[0_0_20px_rgba(212,168,67,0.12)]",
  },
  {
    step: "02",
    title: "Diagnose",
    body: "Each failure is classified into a known cause with confidence, customer tenure, and eligibility signals used by the decision layer.",
    code: `{
  "cause": "insufficient_funds",
  "confidence": 0.95,
  "customer_tenure": "18 months",
  "retry_eligible": true,
  "risk_score": 0.08
}`,
    tone: "text-sky-300",
    glow: "border-sky-400/30 shadow-[0_0_20px_rgba(56,189,248,0.12)]",
  },
  {
    step: "03",
    title: "Recover",
    body: "The system chooses exactly one action: schedule a smart retry, send a payment link, or escalate to finance when automation should stop.",
    code: `{
  "action": "schedule_smart_retry",
  "attempt": "2 / 3",
  "cooldown_hours": 4,
  "max_attempts": 3,
  "next_run": "08:12 IST"
}`,
    tone: "text-emerald-300",
    glow: "border-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.12)]",
  },
  {
    step: "04",
    title: "Audit",
    body: "Every diagnosis, decision, and outcome is written as a timestamped audit entry so the recovery path can be reviewed later.",
    code: `{
  "phase": "execute",
  "result": "retry_scheduled",
  "hash": "7k2m9x_a2",
  "logged_at": "04:12:00.358Z",
  "immutable": true
}`,
    tone: "text-emerald-300",
    glow: "border-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.12)]",
  },
];

const safeguards = [
  ["MAX_RETRIES", "3", "Retries stop before customer pressure becomes noise."],
  ["COOLDOWN", "1h → 4h → 8h", "Backoff windows prevent blind repeated attempts."],
  ["CONFIDENCE_THRESHOLD", "0.80", "Low-confidence cases move to a human reviewer."],
  ["LINK_EXPIRY", "48 hours", "Payment links cannot linger indefinitely."],
  ["ERROR_POLICY", "catch → log → escalate", "Failures are visible and recoverable."],
  ["AUDIT_SCOPE", "diagnose + decide + execute", "Each automated choice has a durable trace."],
];

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

/**
 * 3D Tilt Stage Card with Typewriter Reveal
 */
function StageCard({
  stage,
  index,
  isActive,
  onActivate,
}: {
  stage: (typeof stages)[number];
  index: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });
  const prefersReduced = usePrefersReducedMotion();

  // 3D tilt calculations
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced || window.innerWidth < 1024) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
      const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 4;
      setRotate({ x: rotX, y: rotY });
      setMousePos({ x, y, active: true });
    },
    [prefersReduced],
  );

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 });
    setMousePos((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <div
      style={{ perspective: "1000px" }}
      onMouseEnter={onActivate}
      className="h-full"
    >
      <motion.article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transform: prefersReduced
            ? "none"
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
        }}
        className={`group relative flex h-full min-h-[440px] flex-col justify-between overflow-hidden rounded-xl border p-6 backdrop-blur-xl transition-all duration-300 ${
          isActive
            ? `${stage.glow} bg-void-light/95`
            : "border-chalk-muted/15 bg-void-light/70 hover:border-chalk-muted/30"
        } shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]`}
      >
        {/* Cursor Specular Highlight */}
        {mousePos.active && !prefersReduced && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232,228,218,0.07), transparent 70%)`,
            }}
            aria-hidden="true"
          />
        )}

        <div>
          <div className="flex items-center justify-between">
            <span className={`font-mono text-sm font-semibold ${stage.tone}`}>
              {stage.step}
            </span>
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                isActive ? "bg-emerald-400 animate-pulse" : "bg-chalk-muted/30"
              }`}
            />
          </div>

          <h3 className="mt-6 text-2xl font-medium text-chalk tracking-tight">
            {stage.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-chalk-dim">
            {stage.body}
          </p>
        </div>

        {/* Monospace JSON log terminal with animated reveal */}
        <div className="mt-6 overflow-hidden rounded-lg border border-chalk-muted/12 bg-black/45 p-3.5 font-mono text-[11px] leading-5 text-chalk-dim shadow-inner">
          <div className="mb-2 flex items-center justify-between border-b border-chalk-muted/10 pb-1.5 text-[9px] uppercase tracking-wider text-chalk-muted/60">
            <span>Payload Stream</span>
            <span className="text-emerald-400/80">● active</span>
          </div>
          <pre className="overflow-x-auto">
            <code className="text-chalk/90">{stage.code}</code>
          </pre>
        </div>
      </motion.article>
    </div>
  );
}

export default function HowItWorks() {
  const [activeStage, setActiveStage] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="min-h-screen bg-void text-chalk">
      {/* ─── Hero Section with Max 3D Pipeline ─── */}
      <section className="relative px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12 overflow-hidden">
        {/* Ambient atmospheric backdrop */}
        <div className="pointer-events-none absolute left-1/4 top-1/3 -z-10 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/5 blur-[140px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 -z-10 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/5 blur-[140px]" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-ember" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  The mechanism
                </span>
              </div>
              <h1 className="text-5xl font-semibold leading-[0.96] tracking-tight text-chalk sm:text-7xl">
                How the recovery loop actually runs.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-chalk-dim">
                Four bounded stages convert payment failure events into auditable, deterministic action.
                The 3D pipeline models the continuous flow from detection through to immutable ledger write.
              </p>
            </div>

            {/* 3D Pipeline Canvas Scene */}
            <div className="relative">
              <div className="h-[380px] overflow-hidden rounded-xl border border-chalk-muted/15 bg-void-light/80 backdrop-blur-xl shadow-[0_24px_50px_-15px_rgba(0,0,0,0.85)] sm:h-[450px]">
                {prefersReduced ? (
                  <SceneFallback variant="pipeline" />
                ) : (
                  <Suspense fallback={<SceneFallback variant="pipeline" />}>
                    <PipelineScene activeStage={activeStage} />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4 Stage Cards Section ─── */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Stage outputs
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage, idx) => (
              <StageCard
                key={stage.step}
                stage={stage}
                index={idx}
                isActive={activeStage === idx}
                onActivate={() => setActiveStage(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Governed Automation Rails Section ─── */}
      <section className="border-y border-chalk-muted/12 bg-void-light/45 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1fr] lg:items-start">
          <div>
            <Eyebrow tone="mint">Governed automation</Eyebrow>
            <h2 className="mt-4 text-4xl font-medium leading-tight text-chalk sm:text-5xl">
              Autonomous where it helps. Accountable where it matters.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-chalk-dim">
              The agent is allowed to move fast only inside explicit policy rails. Anything uncertain, exhausted,
              blocked, or risky becomes a human-facing review item.
            </p>
          </div>

          <div className="grid gap-3.5">
            {safeguards.map(([rule, value, desc], i) => (
              <motion.div
                key={rule}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group grid gap-2 rounded-lg border border-chalk-muted/12 bg-void/60 p-4.5 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/30 hover:bg-void/80 sm:grid-cols-[190px_140px_1fr] sm:items-center"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ember font-semibold">
                  {rule}
                </span>
                <span className="font-mono text-sm tabular-nums text-chalk font-medium">
                  {value}
                </span>
                <span className="text-sm leading-6 text-chalk-dim">
                  {desc}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Next Proof Layer CTA ─── */}
      <section className="px-5 py-24 text-center sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Next proof layer
            </span>
          </div>

          <h2 className="text-4xl font-medium leading-tight text-chalk sm:text-5xl">
            Follow the mechanism into measured outcomes.
          </h2>

          <div className="mt-10 flex flex-col justify-center gap-3.5 sm:flex-row">
            <Link
              to="/results"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-btn px-7 text-sm font-semibold text-btn-text shadow-[0_0_24px_rgba(240,237,230,0.14)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              See the results
              <ArrowIcon />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-chalk-muted/25 bg-void/40 px-7 text-sm font-semibold text-chalk backdrop-blur-sm transition-all hover:border-chalk-muted/50 hover:bg-chalk/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Open dashboard
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
