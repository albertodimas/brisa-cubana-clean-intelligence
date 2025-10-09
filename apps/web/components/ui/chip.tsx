import type { PropsWithChildren } from "react";

type ChipProps = PropsWithChildren<{ tone?: "neutral" | "accent" }>;

export function Chip({ children }: ChipProps) {
  return <span className="ui-chip">{children}</span>;
}
