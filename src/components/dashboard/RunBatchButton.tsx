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
    <button
      onClick={onClick}
      disabled={running}
      className={`
        inline-flex items-center gap-2 px-5 py-2 text-[var(--type-caption-lg)] font-medium
        rounded-md transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember
        disabled:opacity-50 disabled:cursor-not-allowed
        ${success
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/30"
          : "bg-btn text-btn-text hover:scale-[1.03] hover:opacity-95"
        }
      `}
      aria-live="polite"
      aria-label={running ? "Running recovery batch" : success ? "Batch completed successfully" : "Run recovery batch"}
    >
      {running ? (
        <>
          {/* Spinner */}
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Running…
        </>
      ) : success ? (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Completed
        </>
      ) : (
        "Run recovery batch"
      )}
    </button>
  );
}
