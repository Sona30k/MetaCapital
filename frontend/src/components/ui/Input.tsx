import type { ComponentProps } from "react";

type Props = ComponentProps<"input">;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-base-200 placeholder:text-base-200/50 focus:outline-none focus:ring-2 focus:ring-accent-500 ${className}`}
      {...props}
    />
  );
}
