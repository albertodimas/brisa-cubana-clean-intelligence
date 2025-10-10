import type { PropsWithChildren } from "react";

type ChipProps = PropsWithChildren<{
  tone?: "neutral" | "accent";
  className?: string;
}>;

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: ChipProps) {
  const toneStyles = {
    neutral: "bg-brisa-800 text-brisa-200 border-brisa-600",
    accent: "bg-brisa-400 text-brisa-900 border-brisa-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
