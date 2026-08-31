import clsx from "clsx";

export function Eyebrow({
  children,
  tone = "amber",
  className,
}: {
  children: React.ReactNode;
  tone?: "amber" | "mint" | "muted";
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "font-mono text-[11px] uppercase tracking-[0.16em]",
        tone === "amber" && "text-ember",
        tone === "mint" && "text-emerald-300",
        tone === "muted" && "text-chalk-muted/60",
        className,
      )}
    >
      {children}
    </p>
  );
}
