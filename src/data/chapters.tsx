import type { ReactNode } from "react";

export type ChapterLevel = 1 | 2 | 3 | 4;

export interface Chapter {
  start: number;
  end: number;
  content: ReactNode;
  ariaLabel: string;
  level: ChapterLevel;
  align?: "left" | "center" | "right";
  /** Extra scale multiplier for Level 3 — the one moment allowed to dominate */
  scale?: number;
}

/*
 * 6-chapter rhythm with 4-level type hierarchy:
 *
 * Level 1 (22-26px, weight 400-450): quiet setup lines
 * Level 2 (32-40px text, 48-56px rupee figure): data/proof lines
 * Level 3 (130-170px, weight 800-900, tight tracking): THE peak
 * Level 4 (11-13px, uppercase, letter-spaced): UI chrome
 *
 * Rhythm: small → small → MASSIVE → small → medium(data) → small(CTA)
 * Alignment: center → center → LEFT (off-center) → center → center → RIGHT (CTA)
 */

export const chapters: Chapter[] = [
  // ─── Level 1: Establishing line (bright/dim split) ───
  {
    start: -0.02,
    end: 0.14,
    level: 1,
    align: "center",
    content: (
      <span>
        Every month, recurring payments{" "}
        <span className="opacity-45">quietly fail.</span>
      </span>
    ),
    ariaLabel: "Every month, recurring payments quietly fail.",
  },

  // ─── Level 2: Stakes — rupee figure jumps to 48-56px, monospace ───
  {
    start: 0.16,
    end: 0.28,
    level: 2,
    align: "center",
    content: (
      <span>
        <span className="font-mono text-[2.8em] sm:text-[3.2em] tabular-nums font-medium tracking-tight text-chalk leading-none inline-block">
          ₹1,19,143
        </span>{" "}
        <span className="opacity-45 text-[0.65em]">was sitting at risk in one batch alone.</span>
      </span>
    ),
    ariaLabel: "₹1,19,143 was sitting at risk in one batch alone.",
  },

  // ─── Level 3: THE PEAK — 130-170px, weight 900, tight tracking, LEFT-aligned ───
  {
    start: 0.30,
    end: 0.52,
    level: 3,
    align: "left",
    content: <>Recover it.</>,
    ariaLabel: "Recover it.",
    scale: 1.15,
  },

  // ─── Level 1: Mechanism teaser (bright/dim, ember accent) ───
  {
    start: 0.54,
    end: 0.66,
    level: 1,
    align: "center",
    content: (
      <span>
        Detect. Diagnose. Recover. Every action{" "}
        <span className="text-ember">logged.</span>
        <span className="opacity-45 block mt-2 text-[0.75em]">Bounded. Auditable. Explainable.</span>
      </span>
    ),
    ariaLabel: "Detect. Diagnose. Recover. Every action logged.",
  },

  // ─── Level 2: Proof data (monospace, tabular, data figures dominate) ───
  {
    start: 0.68,
    end: 0.82,
    level: 2,
    align: "center",
    content: (
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          <div className="text-center">
            <span className="block font-mono text-[2.4em] sm:text-[2.8em] tabular-nums text-ember font-medium leading-none">
              ₹55,372
            </span>
            <span className="block font-mono text-[0.28em] uppercase tracking-[0.2em] text-chalk-muted/60 mt-3">
              recovered
            </span>
          </div>
          <div className="hidden sm:block w-px h-12 bg-chalk-muted/15" />
          <div className="text-center">
            <span className="block font-mono text-[2.4em] sm:text-[2.8em] tabular-nums text-chalk font-medium leading-none">
              48.3%
            </span>
            <span className="block font-mono text-[0.28em] uppercase tracking-[0.2em] text-chalk-muted/60 mt-3">
              recovery rate
            </span>
          </div>
          <div className="hidden sm:block w-px h-12 bg-chalk-muted/15" />
          <div className="text-center">
            <span className="block font-mono text-[2.4em] sm:text-[2.8em] tabular-nums text-chalk font-medium leading-none">
              58
            </span>
            <span className="block font-mono text-[0.28em] uppercase tracking-[0.2em] text-chalk-muted/60 mt-3">
              records
            </span>
          </div>
        </div>
        <p className="font-mono text-[0.32em] text-chalk-muted/40 tracking-[0.15em] uppercase">
          Measured. Not simulated.
        </p>
      </div>
    ),
    ariaLabel:
      "₹55,372 recovered. 48.3% recovery rate. 58 records. Measured, not simulated.",
  },

  // ─── Level 4/1: CTA — right-weighted for directional movement ───
  {
    start: 0.84,
    end: 0.96,
    level: 1,
    align: "right",
    content: (
      <div className="flex flex-col items-end gap-4">
        <p className="text-chalk-muted/50 text-[0.85em] mb-1">
          See the mechanism. Verify the numbers.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 bg-btn text-btn-text px-6 py-2.5 text-[var(--type-body)] font-medium rounded-md transition-all hover:scale-[0.98] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            See how it works
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-chalk-muted/25 px-6 py-2.5 text-[var(--type-body)] font-medium text-chalk-dim rounded-md transition-all hover:border-chalk-muted/50 hover:text-chalk hover:bg-chalk/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            View live dashboard
          </a>
        </div>
      </div>
    ),
    ariaLabel: "See how it works or view the live dashboard.",
  },
];
