import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "ghost";
};

export function Button({ className = "", variant = "primary", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-accent-500 hover:bg-accent-400 text-white shadow-panel"
      : "bg-white/5 hover:bg-white/10 text-base-200";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
