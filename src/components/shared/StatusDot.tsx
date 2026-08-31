import clsx from "clsx";

export function StatusDot({
  tone = "mint",
  pulse = true,
  className,
}: {
  tone?: "mint" | "amber" | "blue" | "red";
  pulse?: boolean;
  className?: string;
}) {
  const colors = {
    mint: "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]",
    amber: "bg-ember shadow-[0_0_18px_rgba(212,168,67,0.65)]",
    blue: "bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.65)]",
    red: "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)]",
  };

  return (
    <span className={clsx("relative inline-flex h-2.5 w-2.5", className)} aria-hidden="true">
      {pulse && <span className={clsx("absolute h-full w-full animate-ping rounded-full opacity-30", colors[tone])} />}
      <span className={clsx("relative h-2.5 w-2.5 rounded-full", colors[tone])} />
    </span>
  );
}
