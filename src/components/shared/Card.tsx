import { type HTMLAttributes } from "react";
import clsx from "clsx";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section";
  tone?: "default" | "soft" | "accent" | "success";
};

const toneClasses = {
  default: "border-chalk-muted/12 bg-void-light/70",
  soft: "border-chalk-muted/10 bg-void/55",
  accent: "border-ember/20 bg-ember/5",
  success: "border-emerald-400/20 bg-emerald-400/5",
};

export function Card({
  as: Component = "div",
  tone = "default",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={clsx(
        "rounded-md border p-5",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
