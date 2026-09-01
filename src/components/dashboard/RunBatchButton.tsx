import { motion } from "framer-motion";

export function RunBatchButton({
  running,
  success,
  onClick,
}: {
  running: boolean;
  success: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      disabled={running}
      className={`group relative inline-flex h-11 items-center justify-center gap-2.5 overflow-hidden rounded-md px-6 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-60 disabled:cursor-not-allowed ${
        success
          ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
          : "bg-btn text-btn-text shadow-[0_0_20px_rgba(240,237,230,0.12)] hover:brightness-110 hover:shadow-[0_0_28px_rgba(240,237,230,0.22)]"
      }`}
      aria-live="polite"
      aria-label={
        running
          ? "Running recovery batch"
          : success
          ? "Batch completed successfully"
          : "Run recovery batch"
      }
    >
      {/* Light sweep shimmer on hover */}
      {!running && !success && (
        <span
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
          aria-hidden="true"
        />
      )}

      {running ? (
        <span className="relative z-10 flex items-center gap-2">
          {/* Spinner */}
          <svg
            className="h-4 w-4 animate-spin text-btn-text"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Processing batch…
        </span>
      ) : success ? (
        <span className="relative z-10 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
          <svg
            className="h-4 w-4 text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Batch Completed
        </span>
      ) : (
        <span className="relative z-10 flex items-center gap-2">
          <svg className="h-4 w-4 text-btn-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run recovery batch
        </span>
      )}
    </motion.button>
  );
}
